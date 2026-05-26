import { basename, dirname, join, relative } from "node:path";
import {
  buildRouterDescriptorTree,
  renderRouterDescriptorTree,
  type RouteMatchDescriptor,
} from "./routerDescriptorTree.js";
import type {
  CatchFormByPath,
  CatchExportByPath,
  DepsFormByPath,
  GuardExportByPath,
  RouteDescriptor,
} from "./buildRouteDescriptors.js";
import { siblingCompanionPath, type ConcernKind } from "./buildRouteDescriptors.js";
import {
  catchExprFor,
  depsExprFor,
  handlerExprFor,
  type RouterExpressionImports,
} from "./emitRouterHelpers.js";
import { ModuleSource } from "./moduleSource.js";
import { makeUniqueVarNames, pathToIdentifier, routeModuleIdentifier } from "./routeIdentifiers.js";
import { toPosixPath } from "./path.js";
import { mustEmitAllExports, type VirtualModuleBuildContext } from "@typed/virtual-modules";

/** Canonical root directory: Node's dirname returns "." for root-level files; we use "" consistently. */
function normalizeDir(dir: string): string {
  return dir === "." ? "" : dir;
}

/** True iff the companion path is directory-level (e.g. api/_layout.ts), not sibling (e.g. route.layout.ts). */
function isDirectoryCompanion(p: string): boolean {
  return basename(p).startsWith("_");
}

/** Directory path -> companion paths for that directory (only _layout, _dependencies, _catch; guard is per-route). */
function directoryCompanionPaths(
  descriptors: readonly RouteDescriptor[],
): Map<string, { layout?: string; dependencies?: string; catch?: string }> {
  const map = new Map<string, { layout?: string; dependencies?: string; catch?: string }>();
  for (const d of descriptors) {
    for (const kind of ["layout", "dependencies", "catch"] as const) {
      for (const p of d.composedConcerns[kind]) {
        if (!isDirectoryCompanion(p)) continue;
        const dir = normalizeDir(dirname(p));
        let entry = map.get(dir);
        if (!entry) {
          entry = {};
          map.set(dir, entry);
        }
        if (!entry[kind]) entry[kind] = p;
      }
    }
  }
  return map;
}

/** Collect unique paths in leaf→ancestor order (closest to route first; first occurrence wins). */
function collectOrderedCompanionPaths(
  descriptors: readonly RouteDescriptor[],
  kind: ConcernKind,
): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of descriptors) {
    const paths = d.composedConcerns[kind];
    for (const p of paths) {
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
  }
  return out;
}

function collectOrderedEntrypointPaths(descriptors: readonly RouteDescriptor[]): readonly string[] {
  const seen = new Set(descriptors.map((d) => d.filePath));
  const out: string[] = [];
  for (const d of descriptors) {
    if (seen.has(d.entrypointFilePath)) continue;
    seen.add(d.entrypointFilePath);
    out.push(d.entrypointFilePath);
  }
  return out;
}

/**
 * Emit Router.merge(...) of directory matchers. Each route compiles to .match(route, { handler, ...opts })
 * with opts only from in-file or sibling. Directory companions (_layout, _dependencies, _catch) apply to
 * all routes in that directory and are added once per directory via .layout(), .provide(), .catchCause().
 */
export function emitRouterMatchSource(
  descriptors: readonly RouteDescriptor[],
  targetDirectory: string,
  importer: string,
  guardExportByPath: GuardExportByPath,
  catchExportByPath: CatchExportByPath,
  catchFormByPath: CatchFormByPath,
  depsFormByPath: DepsFormByPath,
  context?: VirtualModuleBuildContext,
): string {
  const importerDir = dirname(toPosixPath(importer));
  const depPaths = collectOrderedCompanionPaths(descriptors, "dependencies");
  const layoutPaths = collectOrderedCompanionPaths(descriptors, "layout");
  const guardPaths = collectOrderedCompanionPaths(descriptors, "guard");
  const catchPaths = collectOrderedCompanionPaths(descriptors, "catch");
  const entrypointPaths = collectOrderedEntrypointPaths(descriptors);
  const source = new ModuleSource();
  const runtimeImports = createRouterExpressionImports(source);
  runtimeImports.router();

  const nameEntries: { path: string; proposedName: string }[] = [
    ...descriptors.map((d) => ({
      path: d.filePath,
      proposedName: routeModuleIdentifier(d.filePath),
    })),
    ...entrypointPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
  ];
  const varNameByPath = makeUniqueVarNames(nameEntries);
  const targetSpecifier = toVirtualTargetSpecifier(importerDir, targetDirectory, "");
  const emitAllExports = mustEmitAllExports(context);
  const servicesModule =
    emitAllExports || depPaths.length > 0
      ? source.importNamespace("RouteServices", `typed:services?dir=${targetSpecifier}`)
      : undefined;
  const guardsModule =
    emitAllExports || guardPaths.length > 0
      ? source.importNamespace("RouteGuards", `typed:guard?dir=${targetSpecifier}`)
      : undefined;
  const layoutsModule =
    emitAllExports || layoutPaths.length > 0
      ? source.importNamespace("RouteLayouts", `typed:layout?dir=${targetSpecifier}`)
      : undefined;
  const catchesModule =
    emitAllExports || catchPaths.length > 0
      ? source.importNamespace("RouteCatches", `typed:catch?dir=${targetSpecifier}`)
      : undefined;

  const dirToCompanions = directoryCompanionPaths(descriptors);
  const descriptorTree = buildRouterDescriptorTree({
    descriptors,
    dirToCompanions,
    guardExportByPath,
    catchExportByPath,
    catchFormByPath,
    normalizeDir,
    isDirectoryCompanion,
    siblingCompanionPath,
  });
  const handlerExprForMatch = (match: RouteMatchDescriptor, varName: string) =>
    handlerExprFor(
      match.runtimeKind,
      match.entrypointIsFunction,
      match.entrypointExpectsRefSubject,
      varName,
      match.entrypointExport,
      runtimeImports,
    );
  const rootSource = renderRouterDescriptorTree(descriptorTree, {
    varNameByPath,
    guardExportByPath,
    catchExportByPath,
    catchFormByPath,
    depsFormByPath,
    guardExprByPath: withInFileExpressions(
      concernExpressionMap(guardPaths, guardsModule, "guards"),
      descriptors,
      varNameByPath,
      "guard",
      "guard",
    ),
    layoutExprByPath: withInFileExpressions(
      concernExpressionMap(layoutPaths, layoutsModule, "layouts"),
      descriptors,
      varNameByPath,
      "layout",
      "layout",
    ),
    catchExprByPath: withInFileExpressions(
      concernExpressionMap(catchPaths, catchesModule, "catchers"),
      descriptors,
      varNameByPath,
      "catch",
      "catcher",
    ),
    depsInputExprByPath: withInFileExpressions(
      concernExpressionMap(depPaths, servicesModule, "dependencyInputs"),
      descriptors,
      varNameByPath,
      "dependencies",
      "dependencies",
    ),
    depsLayerExprByPath: concernExpressionMap(depPaths, servicesModule, "dependencyLayers"),
    handlerExprFor: handlerExprForMatch,
    catchExprFor: (catchForm, varName, exportName) =>
      catchExprFor(catchForm, varName, exportName, runtimeImports),
    depsExprFor: (kind, varName) => depsExprFor(kind, varName, runtimeImports),
  });

  for (const d of descriptors) {
    source.importNamespace(
      varNameByPath.get(d.filePath)!,
      `typed:route-template?path=${toVirtualTargetSpecifier(importerDir, targetDirectory, d.filePath)}`,
    );
  }
  for (const p of entrypointPaths) {
    source.importNamespace(
      varNameByPath.get(p)!,
      `typed:route-template?path=${toVirtualTargetSpecifier(importerDir, targetDirectory, p)}`,
    );
  }

  source.add(`const router = ${rootSource};
export default router;`);
  return `${source.emit()}\n`;
}

function concernExpressionMap(
  paths: readonly string[],
  moduleName: string | undefined,
  exportName: string,
): ReadonlyMap<string, string> {
  if (!moduleName) return new Map();
  return new Map(paths.map((path) => [path, `${moduleName}.${exportName}[${JSON.stringify(path)}]`]));
}

function withInFileExpressions(
  expressions: ReadonlyMap<string, string>,
  descriptors: readonly RouteDescriptor[],
  varNameByPath: ReadonlyMap<string, string>,
  concern: ConcernKind,
  exportName: string,
): ReadonlyMap<string, string> {
  const next = new Map(expressions);
  for (const descriptor of descriptors) {
    if (descriptor.inFileConcerns[concern]) {
      next.set(descriptor.filePath, `${varNameByPath.get(descriptor.filePath)!}.${exportName}`);
    }
  }
  return next;
}

function toVirtualTargetSpecifier(
  importerDir: string,
  targetDir: string,
  relativeFilePath: string,
): string {
  const absPath = relativeFilePath.length === 0 ? targetDir : join(targetDir, relativeFilePath);
  const rel = toPosixPath(relative(importerDir, absPath));
  return rel.startsWith(".") ? rel : `./${rel}`;
}

function createRouterExpressionImports(source: ModuleSource): RouterExpressionImports {
  return {
    router: () => source.importNamespace("Router", "@typed/router"),
    fx: () => source.importNamespace("Fx", "@typed/fx/Fx"),
    constant: () => {
      source.importNamed("constant", "effect/Function");
      return "constant";
    },
    refSubject: () => {
      source.importTypeNamed("RefSubject", "@typed/fx/RefSubject/RefSubject");
      return "RefSubject";
    },
    effect: () => source.importNamespace("Effect", "effect/Effect"),
    cause: () => source.importNamespace("Cause", "effect/Cause"),
    result: () => source.importNamespace("Result", "effect/Result"),
    layer: () => source.importNamespace("Layer", "effect/Layer"),
  };
}
