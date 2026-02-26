import { basename, dirname, join, relative } from "node:path";
import type { ExportedTypeInfo, TypeInfoApi, TypeInfoFileSnapshot } from "@typed/virtual-modules";
import { stripScriptExtension, toPosixPath } from "./path.js";
import {
  type CatchForm,
  type DepsExportKind,
  type RuntimeKind,
  classifyCatchForm,
  classifyDepsExport,
  getCallableReturnType,
  isCallableNode,
  typeNodeExpectsRefSubjectParam,
  typeNodeIsEffectOptionReturn,
  typeNodeIsRouteCompatible,
  typeNodeToRuntimeKind,
} from "./routeTypeNode.js";

export type ConcernKind = "guard" | "dependencies" | "layout" | "catch";

export type ComposedConcerns = {
  readonly guard: readonly string[];
  readonly dependencies: readonly string[];
  readonly layout: readonly string[];
  readonly catch: readonly string[];
};

/** Which concerns (layout, dependencies, catch, guard) are exported from the route file itself. */
export type InFileConcerns = Partial<Record<ConcernKind, true>>;

const ENTRYPOINT_EXPORTS = ["handler", "template", "default"] as const;
const COMPANION_SUFFIXES = [".guard.ts", ".dependencies.ts", ".layout.ts", ".catch.ts"] as const;
const DIRECTORY_COMPANIONS = new Set(["_guard.ts", "_dependencies.ts", "_layout.ts", "_catch.ts"]);

const GUARD_EXPORT_NAMES = ["default", "guard"] as const;
const CATCH_EXPORT_NAMES = ["catch", "catchFn"] as const;

type EntryPointExport = (typeof ENTRYPOINT_EXPORTS)[number];
type GuardExportName = (typeof GUARD_EXPORT_NAMES)[number];
type CatchExportName = (typeof CATCH_EXPORT_NAMES)[number];

function isEntryPointExport(name: string): name is EntryPointExport {
  return (ENTRYPOINT_EXPORTS as readonly string[]).includes(name);
}

function isGuardExportName(name: string): name is GuardExportName {
  return (GUARD_EXPORT_NAMES as readonly string[]).includes(name);
}

function isCatchExportName(name: string): name is CatchExportName {
  return (CATCH_EXPORT_NAMES as readonly string[]).includes(name);
}

const COMPANION_KIND_TO_SUFFIX: Record<ConcernKind, string> = {
  guard: ".guard.ts",
  dependencies: ".dependencies.ts",
  layout: ".layout.ts",
  catch: ".catch.ts",
};

const COMPANION_KIND_TO_DIRECTORY_FILE: Record<ConcernKind, string> = {
  guard: "_guard.ts",
  dependencies: "_dependencies.ts",
  layout: "_layout.ts",
  catch: "_catch.ts",
};

export type RouteDescriptor = {
  readonly filePath: string;
  readonly entrypointExport: EntryPointExport;
  readonly runtimeKind: RuntimeKind;
  readonly entrypointIsFunction: boolean;
  readonly entrypointExpectsRefSubject: boolean;
  readonly composedConcerns: ComposedConcerns;
  readonly inFileConcerns: InFileConcerns;
  readonly routeTypeText: string;
};

export type RouteContractViolation = {
  readonly code:
    | "RVM-ROUTE-001"
    | "RVM-ROUTE-002"
    | "RVM-ENTRY-001"
    | "RVM-ENTRY-002"
    | "RVM-ENTRY-003"
    | "RVM-LEAF-001"
    | "RVM-AMBIGUOUS-001"
    | "RVM-GUARD-001"
    | "RVM-CATCH-001"
    | "RVM-DEPS-001"
    | "RVM-INFILE-COMPANION-001"
    | "RVM-KIND-001";
  readonly message: string;
};

export type GuardExportByPath = Readonly<Record<string, "default" | "guard">>;
export type CatchExportByPath = Readonly<Record<string, "catch" | "catchFn">>;
export type CatchFormByPath = Readonly<Record<string, CatchForm>>;
export type DepsFormByPath = Readonly<Record<string, DepsExportKind>>;

function isCompanionModulePath(absolutePath: string): boolean {
  const fileName = basename(toPosixPath(absolutePath));
  if (DIRECTORY_COMPANIONS.has(fileName)) return true;
  return COMPANION_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

function listEntrypointExports(snapshot: TypeInfoFileSnapshot): readonly ExportedTypeInfo[] {
  return snapshot.exports.filter((value) =>
    ENTRYPOINT_EXPORTS.some((entrypointName) => entrypointName === value.name),
  );
}

function isRouteExportCompatible(routeExport: ExportedTypeInfo, api: TypeInfoApi): boolean {
  return typeNodeIsRouteCompatible(routeExport.type, api);
}

function classifyEntrypointKind(entrypoint: ExportedTypeInfo, api: TypeInfoApi): RuntimeKind {
  const { type } = entrypoint;
  const nodeForKind = isCallableNode(type) ? (getCallableReturnType(type) ?? type) : type;
  return typeNodeToRuntimeKind(nodeForKind, api);
}

function getEntryPointName(
  entrypoint: ExportedTypeInfo,
  relPath: string,
): { ok: true; value: EntryPointExport } | { ok: false; violation: RouteContractViolation } {
  if (!isEntryPointExport(entrypoint.name)) {
    return {
      ok: false,
      violation: {
        code: "RVM-ENTRY-003",
        message: `invalid entrypoint export name ${JSON.stringify(entrypoint.name)} in ${relPath}`,
      },
    };
  }
  return { ok: true, value: entrypoint.name };
}

function resolveComposedConcernsForLeaf(
  leafFilePath: string,
  existingPaths: ReadonlySet<string>,
): ComposedConcerns {
  const leafDir = dirname(leafFilePath);
  const leafBaseName = basename(stripScriptExtension(leafFilePath));
  const ancestorDirs: string[] = [""];
  if (leafDir !== "." && leafDir !== "") {
    const segments = leafDir.split("/").filter(Boolean);
    let acc = "";
    for (const seg of segments) {
      acc = acc ? `${acc}/${seg}` : seg;
      ancestorDirs.push(acc);
    }
  }

  const collectForKind = (kind: ConcernKind): string[] => {
    const result: string[] = [];
    for (const d of [...ancestorDirs].reverse()) {
      const dirPath =
        d === "."
          ? COMPANION_KIND_TO_DIRECTORY_FILE[kind]
          : join(d, COMPANION_KIND_TO_DIRECTORY_FILE[kind]);
      const normal = toPosixPath(dirPath);
      if (existingPaths.has(normal)) result.push(normal);
    }
    const siblingPath =
      leafDir === "."
        ? `${leafBaseName}${COMPANION_KIND_TO_SUFFIX[kind]}`
        : toPosixPath(join(leafDir, `${leafBaseName}${COMPANION_KIND_TO_SUFFIX[kind]}`));
    if (existingPaths.has(siblingPath)) result.push(siblingPath);
    return result;
  };

  return {
    guard: collectForKind("guard"),
    dependencies: collectForKind("dependencies"),
    layout: collectForKind("layout"),
    catch: collectForKind("catch"),
  };
}

/**
 * Sibling companion path for a leaf file (e.g. "nested/Y.tsx" + "layout" → "nested/Y.layout.ts").
 */
export function siblingCompanionPath(leafFilePath: string, kind: ConcernKind): string {
  const dir = dirname(leafFilePath);
  const base = basename(stripScriptExtension(leafFilePath));
  const file = kind === "dependencies" ? `${base}.dependencies.ts` : `${base}.${kind}.ts`;
  return dir ? toPosixPath(join(dir, file)) : file;
}

/**
 * Build route descriptors and validate guards, catches, and dependencies from type info snapshots.
 */
export function buildRouteDescriptors(
  snapshots: readonly TypeInfoFileSnapshot[],
  baseDir: string,
  api: TypeInfoApi,
): {
  readonly descriptors: readonly RouteDescriptor[];
  readonly violations: readonly RouteContractViolation[];
  readonly guardExportByPath: GuardExportByPath;
  readonly catchExportByPath: CatchExportByPath;
  readonly catchFormByPath: CatchFormByPath;
  readonly depsFormByPath: DepsFormByPath;
} {
  const descriptors: RouteDescriptor[] = [];
  const violations: RouteContractViolation[] = [];
  const existingPaths = new Set(snapshots.map((s) => toPosixPath(relative(baseDir, s.filePath))));

  for (const snapshot of snapshots) {
    if (isCompanionModulePath(snapshot.filePath)) continue;
    const entrypoints = listEntrypointExports(snapshot);
    const routeExport = snapshot.exports.find((value) => value.name === "route");

    if (!routeExport) {
      if (entrypoints.length > 0) {
        violations.push({
          code: "RVM-ROUTE-001",
          message: `missing "route" export in ${toPosixPath(relative(baseDir, snapshot.filePath))}`,
        });
      }
      continue;
    }

    if (!isRouteExportCompatible(routeExport, api)) {
      violations.push({
        code: "RVM-ROUTE-002",
        message: `route export is not structurally compatible with Route in ${toPosixPath(relative(baseDir, snapshot.filePath))}`,
      });
      continue;
    }

    if (entrypoints.length === 0) {
      violations.push({
        code: "RVM-ENTRY-001",
        message: `expected one of handler|template|default in ${toPosixPath(relative(baseDir, snapshot.filePath))}`,
      });
      continue;
    }

    if (entrypoints.length > 1) {
      violations.push({
        code: "RVM-ENTRY-002",
        message: `multiple entrypoint exports found in ${toPosixPath(relative(baseDir, snapshot.filePath))}`,
      });
      continue;
    }

    const entrypoint = entrypoints[0]!;
    const relPath = toPosixPath(relative(baseDir, snapshot.filePath));
    const entrypointNameResult = getEntryPointName(entrypoint, relPath);
    if (!entrypointNameResult.ok) {
      violations.push(entrypointNameResult.violation);
      continue;
    }
    const runtimeKind = classifyEntrypointKind(entrypoint, api);
    if (runtimeKind === "unknown") {
      violations.push({
        code: "RVM-KIND-001",
        message: `handler/template/default runtime kind could not be determined (type targets missing). Ensure route files import from @typed/fx, effect, etc. in ${relPath}`,
      });
      continue;
    }
    const entrypointIsFunction = isCallableNode(entrypoint.type);
    const entrypointExpectsRefSubject =
      entrypointIsFunction && typeNodeExpectsRefSubjectParam(entrypoint.type, api);
    const composedConcerns = resolveComposedConcernsForLeaf(relPath, existingPaths);
    const inFileConcerns: InFileConcerns = {};
    for (const name of ["layout", "dependencies", "catch", "guard"] as const) {
      if (snapshot.exports.some((e) => e.name === name)) inFileConcerns[name] = true;
    }
    descriptors.push({
      filePath: relPath,
      entrypointExport: entrypointNameResult.value,
      runtimeKind,
      entrypointIsFunction,
      entrypointExpectsRefSubject,
      composedConcerns,
      inFileConcerns,
      routeTypeText: routeExport.type.text,
    });
  }

  const sortedDescriptors = [...descriptors].sort((left, right) =>
    left.filePath.localeCompare(right.filePath),
  );

  const seenRouteIdentity = new Map<string, string>();
  const ambiguousViolations: RouteContractViolation[] = [];
  const dedupedDescriptors: typeof sortedDescriptors = [];
  for (const d of sortedDescriptors) {
    const typeKey = d.routeTypeText.replace(/\s+/g, " ").trim();
    const key = `${d.filePath}:${typeKey}`;
    const firstSeen = seenRouteIdentity.get(key);
    if (firstSeen !== undefined) {
      ambiguousViolations.push({
        code: "RVM-AMBIGUOUS-001",
        message: `ambiguous route: same type as ${firstSeen}, also in ${d.filePath}`,
      });
      continue;
    }
    seenRouteIdentity.set(key, d.filePath);
    dedupedDescriptors.push(d);
  }

  const guardViolations: RouteContractViolation[] = [];
  const guardExportByPath: Record<string, "default" | "guard"> = {};
  const guardPaths = new Set<string>();
  for (const d of dedupedDescriptors) {
    for (const p of d.composedConcerns.guard) guardPaths.add(p);
  }
  for (const relPath of guardPaths) {
    const snapshot = snapshots.find((s) => toPosixPath(relative(baseDir, s.filePath)) === relPath);
    if (!snapshot) continue;
    const guardExport =
      snapshot.exports.find((e) => e.name === GUARD_EXPORT_NAMES[0]) ??
      snapshot.exports.find((e) => e.name === GUARD_EXPORT_NAMES[1]);
    if (!guardExport) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard file must export "guard" or default: ${relPath}`,
      });
      continue;
    }
    if (!isCallableNode(guardExport.type)) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard export must be a function (Effect<Option<*>, *, *>): ${relPath}`,
      });
      continue;
    }
    if (!typeNodeIsEffectOptionReturn(guardExport.type, api)) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard return type must be Effect<Option<*>, *, *>: ${relPath}`,
      });
      continue;
    }
    if (!isGuardExportName(guardExport.name)) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard export name ${JSON.stringify(guardExport.name)} not in [guard, default]: ${relPath}`,
      });
      continue;
    }
    guardExportByPath[relPath] = guardExport.name;
  }

  const catchExportByPath: Record<string, "catch" | "catchFn"> = {};
  const catchFormByPath: Record<string, CatchForm> = {};
  const depsFormByPath: Record<string, DepsExportKind> = {};
  const catchPaths = new Set<string>();
  const catchViolations: RouteContractViolation[] = [];
  for (const d of dedupedDescriptors) {
    for (const p of d.composedConcerns.catch) catchPaths.add(p);
  }
  for (const relPath of catchPaths) {
    const snapshot = snapshots.find((s) => toPosixPath(relative(baseDir, s.filePath)) === relPath);
    if (!snapshot) continue;
    const catchExport =
      snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[0]) ??
      snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[1]);
    if (!catchExport) {
      catchViolations.push({
        code: "RVM-CATCH-001",
        message: `catch file must export "catch" or "catchFn": ${relPath}`,
      });
      continue;
    }
    if (!isCatchExportName(catchExport.name)) {
      catchViolations.push({
        code: "RVM-CATCH-001",
        message: `catch export name ${JSON.stringify(catchExport.name)} not in [catch, catchFn]: ${relPath}`,
      });
      continue;
    }
    const catchForm = classifyCatchForm(catchExport.type, api);
    if (catchForm.returnKind === "unknown") {
      catchViolations.push({
        code: "RVM-KIND-001",
        message: `catch return kind could not be determined (type targets missing): ${relPath}`,
      });
      continue;
    }
    catchExportByPath[relPath] = catchExport.name;
    catchFormByPath[relPath] = catchForm;
  }

  for (const d of dedupedDescriptors) {
    if (!d.inFileConcerns.catch) continue;
    const snapshot = snapshots.find(
      (s) => toPosixPath(relative(baseDir, s.filePath)) === d.filePath,
    );
    if (!snapshot) continue;
    const catchExport =
      snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[0]) ??
      snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[1]);
    if (catchExport) {
      if (!isCatchExportName(catchExport.name)) {
        catchViolations.push({
          code: "RVM-CATCH-001",
          message: `catch export name ${JSON.stringify(catchExport.name)} not in [catch, catchFn]: ${d.filePath}`,
        });
        continue;
      }
      const catchForm = classifyCatchForm(catchExport.type, api);
      if (catchForm.returnKind === "unknown") {
        catchViolations.push({
          code: "RVM-KIND-001",
          message: `catch return kind could not be determined (type targets missing): ${d.filePath}`,
        });
      } else {
        catchExportByPath[d.filePath] = catchExport.name;
        catchFormByPath[d.filePath] = catchForm;
      }
    }
  }

  const depsPaths = new Set<string>();
  for (const d of dedupedDescriptors) {
    for (const p of d.composedConcerns.dependencies) {
      if (basename(p).startsWith("_")) depsPaths.add(p);
    }
  }
  const depsViolations: RouteContractViolation[] = [];
  for (const relPath of depsPaths) {
    const snapshot = snapshots.find((s) => toPosixPath(relative(baseDir, s.filePath)) === relPath);
    if (!snapshot) continue;
    const defaultExport = snapshot.exports.find((e) => e.name === "default");
    if (!defaultExport) {
      depsViolations.push({
        code: "RVM-DEPS-001",
        message: `${relPath} is used as directory dependencies but has no default export. Export a default of type Layer, ServiceMap, or Array.`,
      });
      continue;
    }
    const kind = classifyDepsExport(defaultExport.type, api);
    if (kind === "unknown") {
      depsViolations.push({
        code: "RVM-DEPS-001",
        message: `${relPath} default export type could not be determined. Must be Layer, ServiceMap, or Array.`,
      });
      continue;
    }
    depsFormByPath[relPath] = kind;
  }

  const infileCompanionViolations: RouteContractViolation[] = [];
  for (const d of dedupedDescriptors) {
    for (const kind of ["layout", "dependencies", "catch", "guard"] as const) {
      if (!d.inFileConcerns[kind]) continue;
      const siblingPath = siblingCompanionPath(d.filePath, kind);
      if (d.composedConcerns[kind].includes(siblingPath)) {
        infileCompanionViolations.push({
          code: "RVM-INFILE-COMPANION-001",
          message: `${d.filePath} exports "${kind}" in-file and has companion ${siblingPath}; in-file wins but this is ambiguous. Remove one.`,
        });
      }
    }
  }

  const allViolations = [
    ...violations,
    ...ambiguousViolations,
    ...guardViolations,
    ...catchViolations,
    ...depsViolations,
    ...infileCompanionViolations,
  ].sort((left, right) => left.message.localeCompare(right.message));

  return {
    descriptors: dedupedDescriptors,
    violations: allViolations,
    guardExportByPath,
    catchExportByPath,
    catchFormByPath,
    depsFormByPath,
  };
}
