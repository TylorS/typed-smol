import { readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
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

/** Strip the extension from a path using path.extname; returns path unchanged if no extension. */
const stripScriptExtension = (path: string): string => {
  const ext = extname(path);
  return ext ? path.slice(0, -ext.length) : path;
};

/** Extensions that count as route/script files when checking if a directory should resolve (used with extname() result). */
const SCRIPT_EXTENSION_SET = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
]);

/** Glob patterns for discovering route files. We include any file that has a Route + compatible handler export (no filename pattern). */
const ROUTE_FILE_GLOBS: readonly string[] = [
  "**/*.ts",
  "**/*.tsx",
  "**/*.js",
  "**/*.jsx",
  "**/*.mts",
  "**/*.cts",
  "**/*.mjs",
  "**/*.cjs",
];

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

/** Which concerns (layout, dependencies, catch, guard) are exported from the route file itself. */
type InFileConcerns = Partial<Record<ConcernKind, true>>;

type RouteDescriptor = {
  readonly filePath: string;
  readonly entrypointExport: EntryPointExport;
  readonly runtimeKind: RuntimeKind;
  /** True when the entrypoint export's type is a function (e.g. (params) => Fx). */
  readonly entrypointIsFunction: boolean;
  readonly composedConcerns: ComposedConcerns;
  /** Concerns exported by the route module itself; in-file wins over companion, and both together trigger a warning. */
  readonly inFileConcerns: InFileConcerns;
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
    | "RVM-GUARD-001"
    | "RVM-INFILE-COMPANION-001";
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

  let relativeDirectory = id.slice(prefix.length);
  // Normalize so "router:routes" and "router:./routes" both resolve (Node resolve treats them the same; explicit ./ is clearer).
  if (
    relativeDirectory.length > 0 &&
    relativeDirectory !== "." &&
    relativeDirectory !== ".." &&
    !relativeDirectory.startsWith("./") &&
    !relativeDirectory.startsWith("../") &&
    !relativeDirectory.startsWith("/")
  ) {
    relativeDirectory = `./${relativeDirectory}`;
  }
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

const directoryHasScriptFiles = (dir: string): boolean => {
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const e of items) {
      if (
        e.isFile() &&
        SCRIPT_EXTENSION_SET.has(extname(e.name).toLowerCase()) &&
        !e.name.toLowerCase().endsWith(".d.ts")
      )
        return true;
      if (e.isDirectory() && directoryHasScriptFiles(join(dir, e.name))) return true;
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

/** Path relative to baseDir → import specifier relative to importerDir (script ext → .js for ESM). */
const toImportSpecifier = (
  importerDir: string,
  targetDir: string,
  relativeFilePath: string,
): string => {
  const absPath = join(targetDir, relativeFilePath);
  const rel = toPosixPath(relative(importerDir, absPath));
  const specifier = rel.startsWith(".") ? rel : `./${rel}`;
  return stripScriptExtension(specifier) + ".js";
};

/**
 * Sanitize a path segment for use in a JS identifier: strip _ and brackets, keep only [a-zA-Z0-9], capitalize.
 * Empty after sanitization is skipped (returns "").
 */
const segmentToIdentifierPart = (seg: string): string => {
  let name = seg.trim().startsWith("_") ? seg.trim().slice(1) : seg.trim();
  // Remove all bracket chars so [id], [[id]], [ id ] all become a single token; then strip non-alphanumeric
  name = name.replace(/[[\]]/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/** Path relative to baseDir → valid JS identifier. Safe for special chars in filenames; never emits invalid identifiers. */
const pathToIdentifier = (relativeFilePath: string): string => {
  const posix = toPosixPath(relativeFilePath);
  const withoutExt = stripScriptExtension(posix);
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

/** Final guard: ensure a string is a valid JS identifier (no spaces, brackets, or leading digit). */
const toSafeIdentifier = (s: string): string => {
  const cleaned = s.replace(/[\s[\]]/g, "").replace(/[^a-zA-Z0-9_$]/g, "");
  if (!cleaned) return "Module";
  if (/^\d/.test(cleaned)) return `M${cleaned}`;
  return cleaned;
};

const RESERVED_NAMES = new Set(["Router", "Fx", "Effect", "Stream"]);
/** Route module identifier: prefix with M to avoid clashing with Router/Fx/Effect/Stream. */
const routeModuleIdentifier = (relativeFilePath: string): string => {
  const base = pathToIdentifier(relativeFilePath);
  return RESERVED_NAMES.has(base) ? `M${base}` : base;
};

/** True if the path has a dynamic segment (bracket). */
const pathHasParamSegment = (relativePath: string): boolean => /\[[^\]]*\]/.test(relativePath);

/**
 * Assign unique var names when proposed names collide (e.g. users/[id].ts and users/id.ts both → UsersId).
 * First occurrence keeps the base name; others get base + "Param" (if path has [x]), "Literal", or numeric suffix.
 */
const makeUniqueVarNames = (
  entries: readonly { path: string; proposedName: string }[],
): Map<string, string> => {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const nameToPaths = new Map<string, string[]>();
  for (const { path, proposedName } of sorted) {
    const base = toSafeIdentifier(proposedName);
    const list = nameToPaths.get(base) ?? [];
    list.push(path);
    nameToPaths.set(base, list);
  }
  const pathToUnique = new Map<string, string>();
  const used = new Set<string>();
  for (const [base, paths] of nameToPaths) {
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      let name: string;
      if (paths.length === 1) {
        name = base;
      } else if (i === 0) {
        name = base;
      } else {
        const suffix = pathHasParamSegment(path) ? "Param" : "Literal";
        let candidate = base + suffix;
        let n = 0;
        while (used.has(candidate)) {
          n += 1;
          candidate = base + String(n);
        }
        name = candidate;
      }
      used.add(name);
      pathToUnique.set(path, name);
    }
  }
  return pathToUnique;
};

/** Sibling companion path for a leaf file (e.g. "nested/Y.tsx" + "layout" → "nested/Y.layout.ts"). */
const siblingCompanionPath = (leafFilePath: string, kind: ConcernKind): string => {
  const dir = dirname(leafFilePath);
  const base = basename(stripScriptExtension(leafFilePath));
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

    // Include any file that has a Route export + compatible handler (no filename pattern; [id].ts and id.ts are both valid).
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
    const composedConcerns = resolveComposedConcernsForLeaf(relPath, existingPaths);
    const inFileConcerns: InFileConcerns = {};
    for (const name of ["layout", "dependencies", "catch", "guard"] as const) {
      if (snapshot.exports.some((e) => e.name === name)) inFileConcerns[name] = true;
    }
    descriptors.push({
      filePath: relPath,
      entrypointExport: getEntryPointName(entrypoint),
      runtimeKind,
      entrypointIsFunction,
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

  const allViolations = [...violations, ...ambiguousViolations, ...guardViolations, ...infileCompanionViolations].sort(
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
  kind: ConcernKind,
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

/** True iff the companion path is directory-level (e.g. api/_layout.ts), not sibling (e.g. route.layout.ts). */
const isDirectoryCompanion = (p: string) => basename(p).startsWith("_");

/**
 * Build match options for a single route: handler plus layout/dependencies/catch/guard from in-file (route module)
 * or sibling companion only. In-file wins; directory companions are never in match opts (they wrap the directory matcher).
 * Guard can also come from a directory _guard.ts when the route has no in-file or sibling guard.
 */
const matchOptsForRoute = (
  d: RouteDescriptor,
  varName: string,
  varNameByPath: Map<string, string>,
  guardExportByPath: GuardExportByPath,
): string[] => {
  const exportName = d.entrypointExport;
  const isFn = d.entrypointIsFunction;
  const handlerExpr = handlerExprFor(d.runtimeKind, isFn, varName, exportName);
  const opts: string[] = [`handler: ${handlerExpr}`];

  const add = (kind: ConcernKind, fromModule: string, exportKey: keyof typeof d.inFileConcerns) => {
    opts.push(`${kind}: ${fromModule}.${exportKey}`);
  };
  const sibling = (kind: ConcernKind) => siblingCompanionPath(d.filePath, kind);
  const hasSibling = (kind: ConcernKind) => d.composedConcerns[kind].includes(sibling(kind));
  const dirGuardPath = d.composedConcerns.guard.find(isDirectoryCompanion);

  if (d.inFileConcerns.dependencies) add("dependencies", varName, "dependencies");
  else if (hasSibling("dependencies")) opts.push(`dependencies: ${varNameByPath.get(sibling("dependencies"))}`);

  if (d.inFileConcerns.layout) add("layout", varName, "layout");
  else if (hasSibling("layout")) opts.push(`layout: ${varNameByPath.get(sibling("layout"))}`);

  if (d.inFileConcerns.guard) add("guard", varName, "guard");
  else if (hasSibling("guard")) {
    const g = varNameByPath.get(sibling("guard"))!;
    opts.push(`guard: ${g}.${guardExportByPath[sibling("guard")] ?? "guard"}`);
  } else if (dirGuardPath) {
    const g = varNameByPath.get(dirGuardPath)!;
    opts.push(`guard: ${g}.${guardExportByPath[dirGuardPath] ?? "guard"}`);
  }

  if (d.inFileConcerns.catch) add("catch", varName, "catch");
  else if (hasSibling("catch")) opts.push(`catch: ${varNameByPath.get(sibling("catch"))}`);

  return opts;
};

/** Directory path -> companion paths for that directory (only _layout, _dependencies, _catch; guard is per-route). */
const directoryCompanionPaths = (
  descriptors: readonly RouteDescriptor[],
): Map<string, { layout?: string; dependencies?: string; catch?: string }> => {
  const map = new Map<string, { layout?: string; dependencies?: string; catch?: string }>();
  for (const d of descriptors) {
    for (const kind of ["layout", "dependencies", "catch"] as const) {
      for (const p of d.composedConcerns[kind]) {
        if (!isDirectoryCompanion(p)) continue;
        const dir = dirname(p);
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
};

/**
 * Emit Router.merge(...) of directory matchers. Each route compiles to .match(route, { handler, ...opts })
 * with opts only from in-file or sibling. Directory companions (_layout, _dependencies, _catch) apply to
 * all routes in that directory and are added once per directory via .layout(), .provide(), .catchCause().
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
  const catchPaths = collectOrderedCompanionPaths(descriptors, "catch");

  const nameEntries: { path: string; proposedName: string }[] = [
    ...descriptors.map((d) => ({ path: d.filePath, proposedName: routeModuleIdentifier(d.filePath) })),
    ...depPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...layoutPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...guardPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...catchPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
  ];
  const varNameByPath = makeUniqueVarNames(nameEntries);

  const importLines: string[] = [
    `import * as Router from "@typed/router";`,
    `import * as Fx from "@typed/fx";`,
  ];

  for (const d of descriptors) {
    const spec = toImportSpecifier(importerDir, targetDirectory, d.filePath);
    const varName = varNameByPath.get(d.filePath)!;
    importLines.push(`import * as ${varName} from ${JSON.stringify(spec)};`);
  }
  for (const p of depPaths) {
    importLines.push(`import ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of layoutPaths) {
    importLines.push(`import ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of guardPaths) {
    importLines.push(`import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of catchPaths) {
    importLines.push(`import ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }

  const dirToCompanions = directoryCompanionPaths(descriptors);
  const allDirs = new Set(descriptors.map((d) => dirname(d.filePath)));
  for (const [dir] of dirToCompanions) allDirs.add(dir);
  if (allDirs.size > 0) allDirs.add("");
  const sortedDirs = [...allDirs].sort(
    (a, b) => b.split("/").filter(Boolean).length - a.split("/").filter(Boolean).length,
  );

  const leafMatchExprByPath = new Map<string, string>();
  for (const d of descriptors) {
    const varName = varNameByPath.get(d.filePath)!;
    const opts = matchOptsForRoute(d, varName, varNameByPath, guardExportByPath);
    leafMatchExprByPath.set(d.filePath, `Router.match(${varName}.route, { ${opts.join(", ")} })`);
  }

  const dirMatcherExpr = new Map<string, string>();
  for (const dir of sortedDirs) {
    const directRoutes = descriptors.filter((d) => dirname(d.filePath) === dir);
    const isImmediateChild = (s: string) =>
      s !== dir && (dir === "" ? s.indexOf("/") === -1 : s.startsWith(dir + "/") && s.slice((dir + "/").length).indexOf("/") === -1);
    const childDirs = sortedDirs.filter(isImmediateChild);
    const parts: string[] = [];
    for (const d of directRoutes) parts.push(leafMatchExprByPath.get(d.filePath)!);
    for (const s of childDirs) parts.push(dirMatcherExpr.get(s)!);
    let expr = parts.length === 0 ? "Router.merge()" : parts.length === 1 ? parts[0]! : `Router.merge(\n  ${parts.join(",\n  ")}\n)`;
    const companions = dirToCompanions.get(dir);
    if (companions) {
      if (companions.layout) expr += `\n  .layout(${varNameByPath.get(companions.layout)})`;
      if (companions.catch) expr += `\n  .catchCause(${varNameByPath.get(companions.catch)})`;
      if (companions.dependencies) expr += `\n  .provide(${varNameByPath.get(companions.dependencies)})`;
    }
    dirMatcherExpr.set(dir, expr);
  }

  let rootExpr = dirMatcherExpr.get("") ?? "Router.merge()";
  if (rootExpr === "Router.merge()" && descriptors.length > 0) {
    const flatParts = descriptors.map((d) => leafMatchExprByPath.get(d.filePath)!);
    rootExpr =
      flatParts.length === 1
        ? flatParts[0]!
        : `Router.merge(\n  ${flatParts.join(",\n  ")}\n)`;
  }

  return `${importLines.join("\n")}

export default ${rootExpr};
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
      return directoryHasScriptFiles(resolved.targetDirectory);
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

      const snapshots = api.directory(ROUTE_FILE_GLOBS, {
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
