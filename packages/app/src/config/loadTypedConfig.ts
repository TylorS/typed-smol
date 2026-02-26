/**
 * Synchronous loader for typed.config.ts.
 *
 * Uses ts.transpileModule + CJS eval (same pattern as VmcConfigLoader)
 * so it works in the TS Language Service plugin (sync-only host).
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { runInThisContext } from "node:vm";
import type { TypedConfig } from "./TypedConfig.js";

const CONFIG_NAME = "typed.config.ts";

export interface LoadTypedConfigOptions {
  readonly projectRoot: string;
  /**
   * TypeScript module for on-the-fly transpilation.
   * When omitted the loader attempts `require("typescript")`.
   */
  readonly ts?: typeof import("typescript");
  /** Explicit config file path (absolute or relative to projectRoot). */
  readonly configPath?: string;
}

export type LoadTypedConfigResult =
  | { readonly status: "not-found" }
  | { readonly status: "loaded"; readonly path: string; readonly config: TypedConfig }
  | { readonly status: "error"; readonly path?: string; readonly message: string };

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function resolveProjectRoot(projectRoot: string): string | LoadTypedConfigResult {
  const resolved = resolve(projectRoot);
  if (!existsSync(resolved)) {
    return { status: "error", message: `projectRoot does not exist: ${resolved}` };
  }
  if (!statSync(resolved).isDirectory()) {
    return { status: "error", message: `projectRoot must be a directory: ${resolved}` };
  }
  return resolved;
}

function findConfigPath(
  projectRoot: string,
  configPath?: string,
): string | LoadTypedConfigResult {
  if (configPath !== undefined) {
    const resolved = isAbsolute(configPath) ? configPath : resolve(projectRoot, configPath);
    if (!existsSync(resolved)) {
      return { status: "error", path: resolved, message: `Config file not found: ${resolved}` };
    }
    if (!statSync(resolved).isFile()) {
      return { status: "error", path: resolved, message: `Config path is not a file: ${resolved}` };
    }
    return resolved;
  }

  const candidate = join(projectRoot, CONFIG_NAME);
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }
  return { status: "not-found" };
}

function tryRequireTs(): typeof import("typescript") | undefined {
  try {
    return require("typescript");
  } catch {
    return undefined;
  }
}

function transpileAndEval(
  tsMod: typeof import("typescript"),
  configPath: string,
): unknown {
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
  const moduleObj = { exports: {} as unknown };
  const evaluate = runInThisContext(
    `(function (exports, require, module, __filename, __dirname) {${transpiled}\n})`,
    { filename: configPath },
  ) as (
    exportsObject: unknown,
    requireFn: NodeJS.Require,
    moduleObject: { exports: unknown },
    filename: string,
    dirpath: string,
  ) => void;

  evaluate(moduleObj.exports, localRequire, moduleObj, configPath, dirname(configPath));
  return moduleObj.exports;
}

function normalizeExport(loadedModule: unknown): TypedConfig | undefined {
  const withDefault =
    loadedModule && typeof loadedModule === "object" && "default" in loadedModule
      ? (loadedModule as { default: unknown }).default
      : loadedModule;

  if (!withDefault || typeof withDefault !== "object") return undefined;
  return withDefault as TypedConfig;
}

export function loadTypedConfig(options: LoadTypedConfigOptions): LoadTypedConfigResult {
  let attemptedPath: string | undefined;
  try {
    const rootResult = resolveProjectRoot(options.projectRoot);
    if (typeof rootResult !== "string") return rootResult;
    const projectRoot = rootResult;

    const pathResult = findConfigPath(projectRoot, options.configPath);
    if (typeof pathResult !== "string") return pathResult;
    const configPath = pathResult;
    attemptedPath = configPath;

    const tsMod = options.ts ?? tryRequireTs();
    if (!tsMod) {
      return {
        status: "error",
        path: configPath,
        message: "TypeScript is required to load typed.config.ts but was not found",
      };
    }

    const loaded = transpileAndEval(tsMod, configPath);
    const config = normalizeExport(loaded);
    if (!config) {
      return {
        status: "error",
        path: configPath,
        message: `Invalid config export in ${configPath} — expected an object`,
      };
    }

    return { status: "loaded", path: configPath, config };
  } catch (error) {
    return {
      status: "error",
      ...(attemptedPath ? { path: attemptedPath } : {}),
      message: `Failed to load config${attemptedPath ? ` "${attemptedPath}"` : ""}: ${toMessage(error)}`,
    };
  }
}
