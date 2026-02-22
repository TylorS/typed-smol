import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import {
  typeNodeIsEffectOptionReturn,
  typeNodeIsRouteCompatible,
  typeNodeToRuntimeKind,
} from "./internal/routeTypeNode.js";
import {
  pathIsUnderBase,
  resolvePathUnderBase,
  resolveRelativePath,
  toPosixPath,
} from "./internal/path.js";
import { validateNonEmptyString, validatePathSegment } from "./internal/validation.js";
import type {
  ExportedTypeInfo,
  TypeInfoFileSnapshot,
  VirtualModuleBuildError,
  VirtualModulePlugin,
} from "@typed/virtual-modules";

const DEFAULT_PREFIX = "router:";
const DEFAULT_PLUGIN_NAME = "router-virtual-module";
const ENTRYPOINT_EXPORTS = ["handler", "template", "default"] as const;
const COMPANION_SUFFIXES = [".guard.ts", ".dependencies.ts", ".layout.ts", ".catch.ts"] as const;
const DIRECTORY_COMPANIONS = new Set(["_guard.ts", "_dependencies.ts", "_layout.ts", "_catch.ts"]);

type ConcernKind = "guard" | "dependencies" | "layout" | "catch";

type ComposedConcerns = {
  readonly guard: readonly string[];
  readonly dependencies: readonly string[];
  readonly layout: readonly string[];
  readonly catch: readonly string[];
};

export interface RouterVirtualModulePluginOptions {
  readonly prefix?: string;
  readonly name?: string;
}

type EntryPointExport = (typeof ENTRYPOINT_EXPORTS)[number];
type RuntimeKind = import("./internal/routeTypeNode.js").RuntimeKind;

type RouteDescriptor = {
  readonly filePath: string;
  readonly entrypointExport: EntryPointExport;
  readonly runtimeKind: RuntimeKind;
  /** True when the entrypoint export's type is a function (e.g. (params) => Fx). */
  readonly entrypointIsFunction: boolean;
  readonly composedConcerns: ComposedConcerns;
  readonly routeTypeText: string;
};

type RouteContractViolation = {
  readonly code:
    | "RVM-ROUTE-001"
    | "RVM-ROUTE-002"
    | "RVM-ENTRY-001"
    | "RVM-ENTRY-002"
    | "RVM-LEAF-001"
    | "RVM-AMBIGUOUS-001"
    | "RVM-GUARD-001";
  readonly message: string;
};

export type ParseRouterVirtualModuleIdResult =
  | {
      readonly ok: true;
      readonly relativeDirectory: string;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    };

export function parseRouterVirtualModuleId(
  id: string,
  prefix: string = DEFAULT_PREFIX,
): ParseRouterVirtualModuleIdResult {
  const idResult = validateNonEmptyString(id, "id");
  if (!idResult.ok) {
    return { ok: false, reason: idResult.reason };
  }
  const prefixResult = validateNonEmptyString(prefix, "prefix");
  if (!prefixResult.ok) {
    return { ok: false, reason: prefixResult.reason };
  }
  if (!id.startsWith(prefix)) {
    return {
      ok: false,
      reason: `id must start with "${prefix}"`,
    };
  }

  const relativeDirectory = id.slice(prefix.length);
  const relativeResult = validatePathSegment(relativeDirectory, "relativeDirectory");
  if (!relativeResult.ok) {
    return { ok: false, reason: relativeResult.reason };
  }

  return {
    ok: true,
    relativeDirectory: relativeResult.value,
  };
}

export type ResolveRouterTargetDirectoryResult =
  | {
      readonly ok: true;
      readonly targetDirectory: string;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    };

export function resolveRouterTargetDirectory(
  id: string,
  importer: string,
  prefix: string = DEFAULT_PREFIX,
): ResolveRouterTargetDirectoryResult {
  const parsed = parseRouterVirtualModuleId(id, prefix);
  if (!parsed.ok) {
    return parsed;
  }

  const importerResult = validatePathSegment(importer, "importer");
  if (!importerResult.ok) {
    return { ok: false, reason: importerResult.reason };
  }

  const importerDir = dirname(toPosixPath(importerResult.value));
  const resolved = resolvePathUnderBase(importerDir, parsed.relativeDirectory);
  if (!resolved.ok) {
    return {
      ok: false,
      reason: "resolved target directory escapes importer base directory",
    };
  }
  if (!pathIsUnderBase(importerDir, resolved.path)) {
    return {
      ok: false,
      reason: "resolved target directory is outside importer base directory",
    };
  }

  return {
    ok: true,
    targetDirectory: toPosixPath(resolved.path),
  };
}

const isExistingDirectory = (absolutePath: string): boolean => {
  try {
    return statSync(absolutePath).isDirectory();
  } catch {
    return false;
  }
};

const directoryHasTsFiles = (dir: string): boolean => {
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const e of items) {
      if (e.name.endsWith(".ts") && !e.name.endsWith(".d.ts")) return true;
      if (e.isDirectory() && directoryHasTsFiles(join(dir, e.name))) return true;
    }
    return false;
  } catch {
    return false;
  }
};

const isCompanionModulePath = (absolutePath: string): boolean => {
  const fileName = basename(toPosixPath(absolutePath));
  if (DIRECTORY_COMPANIONS.has(fileName)) {
    return true;
  }
  return COMPANION_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
};

const listEntrypointExports = (snapshot: TypeInfoFileSnapshot): readonly ExportedTypeInfo[] =>
  snapshot.exports.filter((value) =>
    ENTRYPOINT_EXPORTS.some((entrypointName) => entrypointName === value.name),
  );

const isRouteExportCompatible = (routeExport: ExportedTypeInfo): boolean =>
  typeNodeIsRouteCompatible(routeExport.type);

const classifyEntrypointKind = (entrypoint: ExportedTypeInfo): RuntimeKind =>
  typeNodeToRuntimeKind(entrypoint.type);

const getEntryPointName = (entrypoint: ExportedTypeInfo): EntryPointExport =>
  entrypoint.name as EntryPointExport;

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

const resolveComposedConcernsForLeaf = (
  leafFilePath: string,
  existingPaths: ReadonlySet<string>,
): ComposedConcerns => {
  const leafDir = dirname(leafFilePath);
  const leafBaseName = basename(leafFilePath, ".ts");
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
      const dirPath = d === "." ? COMPANION_KIND_TO_DIRECTORY_FILE[kind] : join(d, COMPANION_KIND_TO_DIRECTORY_FILE[kind]);
      const normal = toPosixPath(dirPath);
      if (existingPaths.has(normal)) result.push(normal);
    }
    const siblingPath = leafDir === "."
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
};

/** Path relative to baseDir (e.g. "nested/X.ts") → import specifier relative to importerDir (e.g. "./routes/nested/X.js"). */
const toImportSpecifier = (
  importerDir: string,
  targetDir: string,
  relativeFilePath: string,
): string => {
  const absPath = join(targetDir, relativeFilePath);
  const rel = toPosixPath(relative(importerDir, absPath));
  const specifier = rel.startsWith(".") ? rel : `./${rel}`;
  return specifier.replace(/\.ts$/i, ".js");
};

/**
 * Sanitize a path segment for use in a JS identifier: strip _ and brackets, keep only [a-zA-Z0-9], capitalize.
 * Empty after sanitization is skipped (returns "").
 */
const segmentToIdentifierPart = (seg: string): string => {
  let name = seg.startsWith("_") ? seg.slice(1) : seg;
  name = name.replace(/^\[|\]$/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/** Path relative to baseDir → valid JS identifier. Safe for special chars in filenames; never emits invalid identifiers. */
const pathToIdentifier = (relativeFilePath: string): string => {
  const withoutExt = relativeFilePath.replace(/\.ts$/i, "");
  const raw = withoutExt
    .split("/")
    .filter(Boolean)
    .map(segmentToIdentifierPart)
    .filter(Boolean)
    .join("") || "Module";
  const safe = raw.replace(/[^a-zA-Z0-9_$]/g, "");
  if (!safe) return "Module";
  if (/^\d/.test(safe)) return `M${safe}`;
  return safe;
};

const RESERVED_NAMES = new Set(["Router", "Fx", "Effect", "Stream"]);
/** Route module identifier: prefix with M to avoid clashing with Router/Fx/Effect/Stream. */
const routeModuleIdentifier = (relativeFilePath: string): string => {
  const base = pathToIdentifier(relativeFilePath);
  return RESERVED_NAMES.has(base) ? `M${base}` : base;
};

/** Sibling companion path for a leaf file (e.g. "nested/Y.ts" + "layout" → "nested/Y.layout.ts"). */
const siblingCompanionPath = (leafFilePath: string, kind: ConcernKind): string => {
  const dir = dirname(leafFilePath);
  const base = basename(leafFilePath, ".ts");
  const file = kind === "dependencies" ? `${base}.dependencies.ts` : `${base}.${kind}.ts`;
  return dir ? toPosixPath(join(dir, file)) : file;
};

/** For each validated guard path, the export name used at build time (default takes precedence over guard). */
export type GuardExportByPath = Readonly<Record<string, "default" | "guard">>;

const buildRouteDescriptors = (
  snapshots: readonly TypeInfoFileSnapshot[],
  baseDir: string,
): {
  readonly descriptors: readonly RouteDescriptor[];
  readonly violations: readonly RouteContractViolation[];
  readonly guardExportByPath: GuardExportByPath;
} => {
  const descriptors: RouteDescriptor[] = [];
  const violations: RouteContractViolation[] = [];
  const existingPaths = new Set(
    snapshots.map((s) => toPosixPath(relative(baseDir, s.filePath))),
  );

  for (const snapshot of snapshots) {
    if (isCompanionModulePath(snapshot.filePath)) {
      continue;
    }
    const entrypoints = listEntrypointExports(snapshot);
    const routeExport = snapshot.exports.find((value) => value.name === "route");

    if (!routeExport) {
      if (entrypoints.length > 0) {
        violations.push({
          code: "RVM-ROUTE-001",
          message: `missing "route" export in ${snapshot.filePath}`,
        });
      }
      continue;
    }

    if (!isRouteExportCompatible(routeExport)) {
      violations.push({
        code: "RVM-ROUTE-002",
        message: `route export is not structurally compatible with Route in ${snapshot.filePath}`,
      });
      continue;
    }

    if (entrypoints.length === 0) {
      violations.push({
        code: "RVM-ENTRY-001",
        message: `expected one of handler|template|default in ${snapshot.filePath}`,
      });
      continue;
    }

    if (entrypoints.length > 1) {
      violations.push({
        code: "RVM-ENTRY-002",
        message: `multiple entrypoint exports found in ${snapshot.filePath}`,
      });
      continue;
    }

    const entrypoint = entrypoints[0];
    const relPath = toPosixPath(relative(baseDir, snapshot.filePath));
    const runtimeKind = classifyEntrypointKind(entrypoint);
    const entrypointIsFunction = entrypoint.type.kind === "function";
    descriptors.push({
      filePath: relPath,
      entrypointExport: getEntryPointName(entrypoint),
      runtimeKind,
      entrypointIsFunction,
      composedConcerns: resolveComposedConcernsForLeaf(relPath, existingPaths),
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
    for (const p of d.composedConcerns.guard) {
      guardPaths.add(p);
    }
  }
  for (const relPath of guardPaths) {
    const snapshot = snapshots.find(
      (s) => toPosixPath(relative(baseDir, s.filePath)) === relPath,
    );
    if (!snapshot) continue;
    const guardExport =
      snapshot.exports.find((e) => e.name === "default") ??
      snapshot.exports.find((e) => e.name === "guard");
    if (!guardExport) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard file must export "guard" or default: ${join(baseDir, relPath)}`,
      });
      continue;
    }
    if (guardExport.type.kind !== "function") {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard export must be a function (Effect<Option<*>, *, *>): ${join(baseDir, relPath)}`,
      });
      continue;
    }
    if (!typeNodeIsEffectOptionReturn(guardExport.type)) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard return type must be Effect<Option<*>, *, *>: ${join(baseDir, relPath)}`,
      });
      continue;
    }
    guardExportByPath[relPath] = guardExport.name as "default" | "guard";
  }

  const allViolations = [...violations, ...ambiguousViolations, ...guardViolations].sort(
    (left, right) => left.message.localeCompare(right.message),
  );

  return {
    descriptors: dedupedDescriptors,
    violations: allViolations,
    guardExportByPath,
  };
};

/** Collect unique paths in leaf→ancestor order (closest to route first; first occurrence wins). */
const collectOrderedCompanionPaths = (
  descriptors: readonly RouteDescriptor[],
  kind: "dependencies" | "layout" | "guard",
): readonly string[] => {
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
};

/**
 * Emit the handler expression that converts to a function returning Fx.
 * - plain value: Fx.succeed(value)
 * - plain function: (params) => Fx.succeed(handler(params))
 * - Effect value: Fx.fromEffect(effect)
 * - Effect function: (params) => Fx.fromEffect(handler(params))
 * - Stream value: Fx.fromStream(stream)
 * - Stream function: (params) => Fx.fromStream(handler(params))
 * - Fx: pass-through (no conversion)
 */
const handlerExprFor = (
  runtimeKind: RuntimeKind,
  isFn: boolean,
  varName: string,
  exportName: string,
): string => {
  const ref = `${varName}.${exportName}`;
  switch (runtimeKind) {
    case "plain":
      return isFn ? `(params) => Fx.succeed(${ref}(params))` : `() => Fx.succeed(${ref})`;
    case "effect":
      return isFn ? `(params) => Fx.fromEffect(${ref}(params))` : `() => Fx.fromEffect(${ref})`;
    case "stream":
      return isFn ? `(params) => Fx.fromStream(${ref}(params))` : `() => Fx.fromStream(${ref})`;
    case "fx":
      return isFn ? ref : `() => ${ref}`;
  }
};

/**
 * Emit type-driven Router.match(...) source: imports + chain + .provide/.layout.
 * Modules that don't match contract are already excluded by buildRouteDescriptors.
 * guardExportByPath: for each guard path, the export name to use (default | guard) so we emit a single property, no ?? at runtime.
 */
const emitRouterMatchSource = (
  descriptors: readonly RouteDescriptor[],
  targetDirectory: string,
  importer: string,
  guardExportByPath: GuardExportByPath,
): string => {
  const importerDir = dirname(toPosixPath(importer));
  const depPaths = collectOrderedCompanionPaths(descriptors, "dependencies");
  const layoutPaths = collectOrderedCompanionPaths(descriptors, "layout");
  const guardPaths = collectOrderedCompanionPaths(descriptors, "guard");

  type CompanionStep = { path: string; kind: "provide" | "layout" };
  const depth = (p: string) => p.split("/").filter(Boolean).length;
  const isDirectoryCompanion = (p: string) => basename(p).startsWith("_");
  const steps: CompanionStep[] = [
    ...depPaths.map((path) => ({ path, kind: "provide" as const })),
    ...layoutPaths.map((path) => ({ path, kind: "layout" as const })),
  ].sort((a, b) => {
    const aDir = isDirectoryCompanion(a.path);
    const bDir = isDirectoryCompanion(b.path);
    if (aDir !== bDir) return aDir ? 1 : -1;
    const depthDiff = depth(b.path) - depth(a.path);
    if (depthDiff !== 0) return depthDiff;
    return a.kind === "layout" && b.kind === "provide" ? -1 : a.kind === "provide" && b.kind === "layout" ? 1 : 0;
  });

  const importLines: string[] = [
    `import * as Router from "@typed/router";`,
    `import * as Fx from "@typed/fx";`,
  ];

  for (const d of descriptors) {
    const spec = toImportSpecifier(importerDir, targetDirectory, d.filePath);
    const varName = routeModuleIdentifier(d.filePath);
    importLines.push(`import * as ${varName} from ${JSON.stringify(spec)};`);
  }

  for (const p of depPaths) {
    const spec = toImportSpecifier(importerDir, targetDirectory, p);
    const varName = pathToIdentifier(p);
    importLines.push(`import ${varName} from ${JSON.stringify(spec)};`);
  }

  for (const p of layoutPaths) {
    const spec = toImportSpecifier(importerDir, targetDirectory, p);
    const varName = pathToIdentifier(p);
    importLines.push(`import ${varName} from ${JSON.stringify(spec)};`);
  }

  for (const p of guardPaths) {
    const spec = toImportSpecifier(importerDir, targetDirectory, p);
    const varName = pathToIdentifier(p);
    importLines.push(`import * as ${varName} from ${JSON.stringify(spec)};`);
  }

  const matchParts: string[] = [];
  for (let i = 0; i < descriptors.length; i++) {
    const d = descriptors[i];
    const varName = routeModuleIdentifier(d.filePath);
    const exportName = d.entrypointExport;
    const isFn = d.entrypointIsFunction;
    const handlerExpr = handlerExprFor(d.runtimeKind, isFn, varName, exportName);

    const siblingLayoutPath = siblingCompanionPath(d.filePath, "layout");
    const hasSiblingLayout = d.composedConcerns.layout.includes(siblingLayoutPath);
    const siblingDepsPath = siblingCompanionPath(d.filePath, "dependencies");
    const hasSiblingDeps = d.composedConcerns.dependencies.includes(siblingDepsPath);
    const siblingGuardPath = siblingCompanionPath(d.filePath, "guard");
    const hasSiblingGuard = d.composedConcerns.guard.includes(siblingGuardPath);

    const opts: string[] = [`handler: ${handlerExpr}`];
    if (hasSiblingDeps) opts.push(`dependencies: ${varName}.dependencies`);
    if (hasSiblingLayout) opts.push(`layout: ${varName}.layout`);
    if (hasSiblingGuard) {
      const guardVarName = pathToIdentifier(siblingGuardPath);
      const exportName = guardExportByPath[siblingGuardPath] ?? "guard";
      opts.push(`guard: ${guardVarName}.${exportName}`);
    }

    const matchCall = `${varName}.route, { ${opts.join(", ")} }`;
    matchParts.push(i === 0 ? `Router.match(${matchCall})` : `.match(${matchCall})`);
  }

  let chain = matchParts.join("\n  ");

  for (const { path: p, kind } of steps) {
    const varName = pathToIdentifier(p);
    chain += kind === "provide" ? `\n  .provide(${varName})` : `\n  .layout(${varName})`;
  }

  return `${importLines.join("\n")}

export default ${chain};
`;
};

export const createRouterVirtualModulePlugin = (
  options: RouterVirtualModulePluginOptions = {},
): VirtualModulePlugin => {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id, importer) {
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        return false;
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        return false;
      }
      return directoryHasTsFiles(resolved.targetDirectory);
    },
    build(id, importer, api) {
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        const err: VirtualModuleBuildError = {
          errors: [{ code: "RVM-ID-001", message: resolved.reason, pluginName: name }],
        };
        return err;
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        const err: VirtualModuleBuildError = {
          errors: [
            {
              code: "RVM-DISC-001",
              message: `target directory does not exist: ${resolveRelativePath(dirname(importer), resolved.targetDirectory)}`,
              pluginName: name,
            },
          ],
        };
        return err;
      }

      const snapshots = api.directory("**/*.ts", {
        baseDir: resolved.targetDirectory,
        recursive: true,
        watch: true,
      });
      const { descriptors, violations, guardExportByPath } = buildRouteDescriptors(
        snapshots,
        resolved.targetDirectory,
      );

      const toDiagnostic = (v: RouteContractViolation) => ({
        code: v.code,
        message: v.message,
        pluginName: name,
      });

      const ambiguous = violations.filter((v) => v.code === "RVM-AMBIGUOUS-001");
      if (ambiguous.length > 0) {
        return { errors: ambiguous.map(toDiagnostic) };
      }

      const guardViolations = violations.filter((v) => v.code === "RVM-GUARD-001");
      if (guardViolations.length > 0) {
        return { errors: guardViolations.map(toDiagnostic) };
      }

      if (descriptors.length === 0) {
        if (violations.length > 0) {
          return { errors: violations.map(toDiagnostic) };
        }
        return {
          errors: [
            {
              code: "RVM-LEAF-001",
              message: `no valid route leaves discovered in ${resolved.targetDirectory}`,
              pluginName: name,
            },
          ],
        };
      }

      return emitRouterMatchSource(
        descriptors,
        resolved.targetDirectory,
        importer,
        guardExportByPath,
      );
    },
  };
};
