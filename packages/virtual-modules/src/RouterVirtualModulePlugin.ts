import { readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import {
  pathIsUnderBase,
  resolvePathUnderBase,
  resolveRelativePath,
  toPosixPath,
} from "./internal/path.js";
import { validateNonEmptyString, validatePathSegment } from "./internal/validation.js";
import type { ExportedTypeInfo, TypeInfoFileSnapshot, VirtualModulePlugin } from "./types.js";

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
type RuntimeKind = "fx" | "effect" | "stream" | "plain";

type RouteDescriptor = {
  readonly filePath: string;
  readonly entrypointExport: EntryPointExport;
  readonly runtimeKind: RuntimeKind;
  readonly needsLift: boolean;
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
    | "RVM-AMBIGUOUS-001";
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

const isRouteExportCompatible = (routeExport: ExportedTypeInfo): boolean => {
  const searchText = `${routeExport.type.text} ${routeExport.declarationText ?? ""}`;
  return /(^|[^A-Za-z0-9_])Route([^A-Za-z0-9_]|$)/.test(searchText);
};

const classifyEntrypointKind = (entrypoint: ExportedTypeInfo): RuntimeKind => {
  const searchText = `${entrypoint.type.text} ${entrypoint.declarationText ?? ""}`;
  if (/(\b|\.|")Fx(\b|\.|"|<|[A-Z])/.test(searchText)) {
    return "fx";
  }
  if (/(\b|\.|")Effect(\b|\.|"|<|[A-Z])/.test(searchText)) {
    return "effect";
  }
  if (/(\b|\.|")Stream(\b|\.|"|<|[A-Z])/.test(searchText)) {
    return "stream";
  }
  return "plain";
};

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
    for (const d of ancestorDirs) {
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

const buildRouteDescriptors = (
  snapshots: readonly TypeInfoFileSnapshot[],
  baseDir: string,
): {
  readonly descriptors: readonly RouteDescriptor[];
  readonly violations: readonly RouteContractViolation[];
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
        message: `route export is not compatible with Route contract in ${snapshot.filePath}`,
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
    descriptors.push({
      filePath: relPath,
      entrypointExport: getEntryPointName(entrypoint),
      runtimeKind,
      needsLift: runtimeKind === "plain",
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
    const key = d.routeTypeText.replace(/\s+/g, " ").trim();
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

  const allViolations = [...violations, ...ambiguousViolations].sort((left, right) =>
    left.message.localeCompare(right.message),
  );

  return {
    descriptors: dedupedDescriptors,
    violations: allViolations,
  };
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
        throw new Error(`[RVM-ID-001] ${resolved.reason}`);
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        throw new Error(
          `[RVM-DISC-001] target directory does not exist: ${resolveRelativePath(dirname(importer), resolved.targetDirectory)}`,
        );
      }

      const snapshots = api.directory("**/*.ts", {
        baseDir: resolved.targetDirectory,
        recursive: true,
        watch: true,
      });
      const { descriptors, violations } = buildRouteDescriptors(snapshots, resolved.targetDirectory);

      const ambiguous = violations.filter((v) => v.code === "RVM-AMBIGUOUS-001");
      if (ambiguous.length > 0) {
        throw new Error(`[${ambiguous[0].code}] ${ambiguous[0].message}`);
      }

      if (descriptors.length === 0) {
        if (violations.length > 0) {
          const first = violations[0];
          throw new Error(`[${first.code}] ${first.message}`);
        }
        throw new Error(`[RVM-LEAF-001] no valid route leaves discovered in ${resolved.targetDirectory}`);
      }

      const emittedDescriptors = descriptors.map(
        ({ filePath, entrypointExport, runtimeKind, needsLift, composedConcerns }) => ({
          filePath,
          entrypointExport,
          runtimeKind,
          needsLift,
          composedConcerns,
        }),
      );

      return `/* router virtual module scaffold */
export const routerDirectory = ${JSON.stringify(resolved.targetDirectory)};
export const routeModules = ${JSON.stringify(emittedDescriptors, null, 2)} as const;
export const routes = [] as const;
export default routes;
`;
    },
  };
};
