import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import type { Module } from "node:module";
import { runInThisContext } from "node:vm";
import { pathIsUnderBase, resolvePathUnderBase } from "./internal/path.js";
import { sanitizeErrorMessage } from "./internal/sanitize.js";
import { validatePathSegment } from "./internal/validation.js";
import type { VirtualModulePlugin, VirtualModuleResolver } from "./types.js";

const VMC_CONFIG_NAMES = ["vmc.config.ts"] as const;

export type VmcPluginEntry = VirtualModulePlugin | string;

export interface VmcConfig {
  readonly resolver?: VirtualModuleResolver;
  readonly plugins?: readonly VmcPluginEntry[];
}

export interface LoadVmcConfigOptions {
  readonly projectRoot: string;
  /**
   * TypeScript module used to transpile vmc.config.ts on the fly.
   * Required only when loading .ts configs.
   */
  readonly ts?: typeof import("typescript");
  /**
   * Optional explicit config file path (absolute or relative to projectRoot).
   */
  readonly configPath?: string;
}

export type LoadVmcConfigResult =
  | { readonly status: "not-found" }
  | {
      readonly status: "loaded";
      readonly path: string;
      readonly config: VmcConfig;
      readonly dependencyPaths: readonly string[];
    }
  | { readonly status: "error"; readonly path?: string; readonly message: string };

const toMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const isPluginLike = (value: unknown): value is VirtualModulePlugin => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.shouldResolve === "function" &&
    typeof candidate.build === "function"
  );
};

const isResolverLike = (value: unknown): value is VirtualModuleResolver => {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { resolveModule?: unknown }).resolveModule === "function";
};

const normalizePluginEntries = (
  value: unknown,
): { readonly ok: true; readonly plugins: readonly VmcPluginEntry[] } | { readonly ok: false } => {
  if (value === undefined) return { ok: true, plugins: [] };
  if (!Array.isArray(value)) return { ok: false };

  const plugins: VmcPluginEntry[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim().length > 0) {
      plugins.push(entry.trim());
      continue;
    }
    if (isPluginLike(entry)) {
      plugins.push(entry);
      continue;
    }
    return { ok: false };
  }
  return { ok: true, plugins };
};

function validateProjectRoot(projectRoot: unknown): LoadVmcConfigResult | string {
  const projectRootResult = validatePathSegment(projectRoot, "projectRoot");
  if (!projectRootResult.ok) {
    return {
      status: "error",
      message: projectRootResult.reason,
    };
  }
  const resolvedProjectRoot = resolve(projectRootResult.value);
  if (!existsSync(resolvedProjectRoot)) {
    return {
      status: "error",
      path: resolvedProjectRoot,
      message: `projectRoot does not exist: ${resolvedProjectRoot}`,
    };
  }
  if (!statSync(resolvedProjectRoot).isDirectory()) {
    return {
      status: "error",
      path: resolvedProjectRoot,
      message: `projectRoot must be a directory: ${resolvedProjectRoot}`,
    };
  }
  return resolvedProjectRoot;
}

function resolveConfigPath(
  projectRoot: string,
  configPath?: unknown,
): LoadVmcConfigResult | string {
  if (configPath !== undefined) {
    const configPathResult = validatePathSegment(configPath, "configPath");
    if (!configPathResult.ok) {
      return {
        status: "error",
        message: configPathResult.reason,
      };
    }

    const configPathValue = configPathResult.value;
    if (!configPathValue.endsWith(".ts")) {
      return {
        status: "error",
        message: `configPath must point to a .ts file: ${configPathValue}`,
      };
    }
    const resolvedPath = resolve(projectRoot, configPathValue);
    const underBase = resolvePathUnderBase(projectRoot, configPathValue);
    if (!underBase.ok || resolve(underBase.path) !== resolvedPath) {
      return {
        status: "error",
        message: `vmc config path escapes project root: ${configPathValue}`,
      };
    }
    if (!existsSync(resolvedPath)) {
      return {
        status: "error",
        path: resolvedPath,
        message: `vmc config not found: ${resolvedPath}`,
      };
    }
    if (!statSync(resolvedPath).isFile()) {
      return {
        status: "error",
        path: resolvedPath,
        message: `vmc config path must point to a file: ${resolvedPath}`,
      };
    }
    if (!pathIsUnderBase(projectRoot, resolvedPath)) {
      return {
        status: "error",
        path: resolvedPath,
        message: `vmc config path is outside project root after resolving symlinks: ${resolvedPath}`,
      };
    }
    return resolvedPath;
  }

  for (const name of VMC_CONFIG_NAMES) {
    const candidate = join(projectRoot, name);
    if (!existsSync(candidate)) continue;
    if (!statSync(candidate).isFile()) continue;
    if (!pathIsUnderBase(projectRoot, candidate)) {
      return {
        status: "error",
        path: candidate,
        message: `vmc config is outside project root after resolving symlinks: ${candidate}`,
      };
    }
    return candidate;
  }
  return { status: "not-found" };
}

function loadTsConfigModule(
  tsMod: typeof import("typescript"),
  projectRoot: string,
  configPath: string,
): { readonly moduleExport: unknown; readonly dependencyPaths: readonly string[] } {
  // vmc config is executable project code.
  const sourceText = readFileSync(configPath, "utf8");
  const transpiled = tsMod.transpileModule(sourceText, {
    fileName: configPath,
    compilerOptions: {
      module: tsMod.ModuleKind.CommonJS,
      target: tsMod.ScriptTarget.ES2020,
      moduleResolution: tsMod.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
    },
    reportDiagnostics: false,
  }).outputText;

  const localRequire = createRequire(configPath);
  evictCachedModulesUnderBase(localRequire, projectRoot);
  const cacheBeforeLoad = new Set(Object.keys(localRequire.cache));
  const module = { exports: {} as unknown };
  const evaluate = runInThisContext(
    `(function (exports, require, module, __filename, __dirname) {${transpiled}\n})`,
    { filename: configPath },
  ) as (
    exportsObject: unknown,
    requireFn: NodeJS.Require,
    moduleObject: { exports: unknown },
    filename: string,
    dirname: string,
  ) => void;

  evaluate(module.exports, localRequire, module, configPath, dirname(configPath));
  return {
    moduleExport: module.exports,
    dependencyPaths: collectLoadedDependencyPaths(localRequire, projectRoot, cacheBeforeLoad),
  };
}

function normalizeConfigModule(
  loadedModule: unknown,
): { readonly ok: true; readonly config: VmcConfig } | { readonly ok: false } {
  const withDefault =
    loadedModule && typeof loadedModule === "object" && "default" in loadedModule
      ? (loadedModule as { default: unknown }).default
      : loadedModule;

  if (!withDefault || typeof withDefault !== "object") {
    return { ok: false };
  }

  const candidate = withDefault as {
    resolver?: unknown;
    plugins?: unknown;
  };

  if (candidate.resolver !== undefined && !isResolverLike(candidate.resolver)) {
    return { ok: false };
  }
  const normalizedPlugins = normalizePluginEntries(candidate.plugins);
  if (!normalizedPlugins.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    config: {
      ...(candidate.resolver !== undefined
        ? { resolver: candidate.resolver as VirtualModuleResolver }
        : {}),
      ...(normalizedPlugins.plugins.length > 0 ? { plugins: normalizedPlugins.plugins } : {}),
    },
  };
}

export function loadVmcConfig(options: LoadVmcConfigOptions): LoadVmcConfigResult {
  let attemptedPath: string | undefined;
  try {
    const projectRootOrStatus = validateProjectRoot(options.projectRoot);
    if (typeof projectRootOrStatus !== "string") return projectRootOrStatus;
    const projectRoot = projectRootOrStatus;

    const resolvedPathOrStatus = resolveConfigPath(projectRoot, options.configPath);
    if (typeof resolvedPathOrStatus !== "string") return resolvedPathOrStatus;
    const resolvedPath = resolvedPathOrStatus;
    attemptedPath = resolvedPath;

    const loadedModuleResult = resolvedPath.endsWith(".ts")
      ? (() => {
          if (!options.ts) {
            return {
              __vmcConfigLoaderError: "TypeScript module is required to load vmc.config.ts",
            };
          }
          return loadTsConfigModule(options.ts, projectRoot, resolvedPath);
        })()
      : loadCjsConfigModule(projectRoot, resolvedPath);

    if (
      loadedModuleResult &&
      typeof loadedModuleResult === "object" &&
      "__vmcConfigLoaderError" in loadedModuleResult
    ) {
      return {
        status: "error",
        path: resolvedPath,
        message: (loadedModuleResult as { __vmcConfigLoaderError: string }).__vmcConfigLoaderError,
      };
    }

    const loadedModule = loadedModuleResult as {
      readonly moduleExport: unknown;
      readonly dependencyPaths: readonly string[];
    };
    const normalized = normalizeConfigModule(loadedModule.moduleExport);
    if (!normalized.ok) {
      return {
        status: "error",
        path: resolvedPath,
        message: `Invalid vmc config export in ${resolvedPath}`,
      };
    }

    return {
      status: "loaded",
      path: resolvedPath,
      config: normalized.config,
      dependencyPaths: loadedModule.dependencyPaths,
    };
  } catch (error) {
    return {
      status: "error",
      ...(attemptedPath ? { path: attemptedPath } : {}),
      message: sanitizeErrorMessage(
        `Failed to load vmc config${attemptedPath ? ` "${attemptedPath}"` : ""}: ${toMessage(error)}`,
      ),
    };
  }
}

function loadCjsConfigModule(
  projectRoot: string,
  configPath: string,
): { readonly moduleExport: unknown; readonly dependencyPaths: readonly string[] } {
  const localRequire = createRequire(configPath);
  evictCachedModulesUnderBase(localRequire, projectRoot);
  const cacheBeforeLoad = new Set(Object.keys(localRequire.cache));
  return {
    moduleExport: localRequire(configPath),
    dependencyPaths: collectLoadedDependencyPaths(localRequire, projectRoot, cacheBeforeLoad),
  };
}

function evictCachedModulesUnderBase(require: NodeJS.Require, baseDir: string): void {
  for (const cachedPath of Object.keys(require.cache)) {
    if (isCachePathUnderBase(cachedPath, baseDir)) {
      delete require.cache[cachedPath];
    }
  }
}

function collectLoadedDependencyPaths(
  require: NodeJS.Require,
  baseDir: string,
  cacheBeforeLoad: ReadonlySet<string>,
): readonly string[] {
  const dependencyPaths = new Set<string>();

  for (const loadedPath of Object.keys(require.cache)) {
    if (!cacheBeforeLoad.has(loadedPath)) {
      addDependencyPath(loadedPath, baseDir, dependencyPaths);
      collectModuleGraphPaths(require.cache[loadedPath], baseDir, dependencyPaths);
    }
  }

  return [...dependencyPaths].sort();
}

function collectModuleGraphPaths(
  module: Module | undefined,
  baseDir: string,
  dependencyPaths: Set<string>,
): void {
  if (!module) return;
  for (const child of module.children) {
    if (dependencyPaths.has(child.filename)) continue;
    if (addDependencyPath(child.filename, baseDir, dependencyPaths)) {
      collectModuleGraphPaths(child, baseDir, dependencyPaths);
    }
  }
}

function addDependencyPath(
  filePath: string,
  baseDir: string,
  dependencyPaths: Set<string>,
): boolean {
  if (!isCachePathUnderBase(filePath, baseDir)) return false;
  dependencyPaths.add(filePath);
  return true;
}

function isCachePathUnderBase(filePath: string, baseDir: string): boolean {
  try {
    return pathIsUnderBase(baseDir, filePath);
  } catch {
    return false;
  }
}
