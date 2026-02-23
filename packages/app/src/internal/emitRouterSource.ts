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
import { catchExprFor, depsExprFor, handlerExprFor } from "./emitRouterHelpers.js";
import { makeUniqueVarNames, pathToIdentifier, routeModuleIdentifier } from "./routeIdentifiers.js";
import { stripScriptExtension, toPosixPath } from "./path.js";

/** Path relative to baseDir → import specifier relative to importerDir (script ext → .js for ESM). */
function toImportSpecifier(
  importerDir: string,
  targetDir: string,
  relativeFilePath: string,
): string {
  const absPath = join(targetDir, relativeFilePath);
  const rel = toPosixPath(relative(importerDir, absPath));
  const specifier = rel.startsWith(".") ? rel : `./${rel}`;
  return stripScriptExtension(specifier) + ".js";
}

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
): string {
  const importerDir = dirname(toPosixPath(importer));
  const needsFnErrorImports = Object.values(catchFormByPath).some((f) => f.form === "fn-error");
  const needsLayerImport = Object.values(depsFormByPath).includes("servicemap");
  const depPaths = collectOrderedCompanionPaths(descriptors, "dependencies");
  const layoutPaths = collectOrderedCompanionPaths(descriptors, "layout");
  const guardPaths = collectOrderedCompanionPaths(descriptors, "guard");
  const catchPaths = collectOrderedCompanionPaths(descriptors, "catch");

  const nameEntries: { path: string; proposedName: string }[] = [
    ...descriptors.map((d) => ({
      path: d.filePath,
      proposedName: routeModuleIdentifier(d.filePath),
    })),
    ...depPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...layoutPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...guardPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...catchPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
  ];
  const varNameByPath = makeUniqueVarNames(nameEntries);

  const importLines: string[] = [
    `import * as Router from "@typed/router";`,
    `import * as Fx from "@typed/fx";`,
    `import { constant } from "effect/Function";`,
    ...(needsFnErrorImports
      ? [
          `import * as Effect from "effect";`,
          `import * as Cause from "effect/Cause";`,
          `import * as Result from "effect/Result";`,
        ]
      : []),
    ...(needsLayerImport ? [`import * as Layer from "effect/Layer";`] : []),
  ];

  for (const d of descriptors) {
    const spec = toImportSpecifier(importerDir, targetDirectory, d.filePath);
    const varName = varNameByPath.get(d.filePath)!;
    importLines.push(`import * as ${varName} from ${JSON.stringify(spec)};`);
  }
  for (const p of depPaths) {
    importLines.push(
      `import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`,
    );
  }
  for (const p of layoutPaths) {
    importLines.push(
      `import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`,
    );
  }
  for (const p of guardPaths) {
    importLines.push(
      `import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`,
    );
  }
  for (const p of catchPaths) {
    importLines.push(
      `import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`,
    );
  }

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
    );
  const rootSource = renderRouterDescriptorTree(descriptorTree, {
    varNameByPath,
    guardExportByPath,
    catchExportByPath,
    catchFormByPath,
    depsFormByPath,
    handlerExprFor: handlerExprForMatch,
    catchExprFor,
    depsExprFor,
  });

  return `${importLines.join("\n")}

const router = ${rootSource};
export default router;
`;
}
