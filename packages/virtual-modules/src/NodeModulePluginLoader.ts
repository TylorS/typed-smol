import { createRequire } from "node:module";
import { resolve } from "node:path";
import type {
  NodeModulePluginLoadError,
  NodeModulePluginLoadInput,
  NodeModulePluginLoadResult,
  NodeModulePluginRequest,
  VirtualModulePlugin,
} from "./types.js";
export type { NodeModulePluginLoadInput };
import { pathIsUnderBase } from "./internal/path.js";
import { sanitizeErrorMessage } from "./internal/sanitize.js";

const toMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const isPluginLike = (value: unknown): value is VirtualModulePlugin => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.shouldResolve === "function" &&
    typeof candidate.build === "function"
  );
};

const invalidPluginError = (
  request: NodeModulePluginRequest,
  message: string,
): NodeModulePluginLoadError => ({
  status: "error",
  specifier: request.specifier,
  baseDir: request.baseDir,
  code: "invalid-plugin-export",
  message,
});

const loadFailedError = (
  request: NodeModulePluginRequest,
  message: string,
): NodeModulePluginLoadError => ({
  status: "error",
  specifier: request.specifier,
  baseDir: request.baseDir,
  code: "module-load-failed",
  message,
});

const notFoundError = (
  request: NodeModulePluginRequest,
  message: string,
): NodeModulePluginLoadError => ({
  status: "error",
  specifier: request.specifier,
  baseDir: request.baseDir,
  code: "module-not-found",
  message,
});

const pathEscapesError = (
  request: NodeModulePluginRequest,
  message: string,
): NodeModulePluginLoadError => ({
  status: "error",
  specifier: request.specifier,
  baseDir: request.baseDir,
  code: "path-escapes-base",
  message,
});

const MAX_PATH_LENGTH = 4096;

const invalidRequestError = (message: string): NodeModulePluginLoadError => ({
  status: "error",
  specifier: "",
  baseDir: "",
  code: "invalid-request",
  message,
});

export class NodeModulePluginLoader {
  load(input: NodeModulePluginLoadInput): NodeModulePluginLoadResult {
    if (isPluginLike(input)) {
      return {
        status: "loaded",
        plugin: input,
        resolvedPath: "<preloaded>",
      };
    }

    const request = input;
    if (typeof request.baseDir !== "string" || request.baseDir.trim() === "") {
      return invalidRequestError("baseDir must be a non-empty string");
    }
    if (typeof request.specifier !== "string" || request.specifier.trim() === "") {
      return invalidRequestError("specifier must be a non-empty string");
    }
    if (request.baseDir.length > MAX_PATH_LENGTH || request.specifier.length > MAX_PATH_LENGTH) {
      return invalidRequestError(`baseDir and specifier must be at most ${MAX_PATH_LENGTH} characters`);
    }

    const require = createRequire(resolve(request.baseDir, "__typed_virtual_modules_loader__.cjs"));
    let resolvedPath: string;

    try {
      resolvedPath = require.resolve(request.specifier, { paths: [request.baseDir] });
    } catch (error) {
      return notFoundError(
        request,
        `Could not resolve plugin "${request.specifier}" from "${request.baseDir}": ${sanitizeErrorMessage(toMessage(error))}`,
      );
    }

    if (!pathIsUnderBase(request.baseDir, resolvedPath)) {
      return pathEscapesError(
        request,
        sanitizeErrorMessage(`Resolved plugin path "${resolvedPath}" is not under baseDir "${request.baseDir}"`),
      );
    }

    try {
      const mod = require(resolvedPath) as unknown;
      const normalizedPlugin = this.#normalizeModuleExport(mod);
      if (!normalizedPlugin) {
        return invalidPluginError(
          request,
          sanitizeErrorMessage(`Resolved module "${resolvedPath}" does not export a valid VirtualModulePlugin`),
        );
      }

      return {
        status: "loaded",
        plugin: normalizedPlugin,
        resolvedPath,
      };
    } catch (error) {
      return loadFailedError(
        request,
        `Could not load plugin module "${resolvedPath}": ${sanitizeErrorMessage(toMessage(error))}`,
      );
    }
  }

  loadMany(inputs: readonly NodeModulePluginLoadInput[]): readonly NodeModulePluginLoadResult[] {
    return inputs.map((input) => this.load(input));
  }

  #normalizeModuleExport(mod: unknown): VirtualModulePlugin | undefined {
    if (isPluginLike(mod)) {
      return mod;
    }

    if (!mod || typeof mod !== "object") {
      return undefined;
    }

    const candidate = mod as {
      default?: unknown;
      plugin?: unknown;
    };

    if (isPluginLike(candidate.default)) {
      return candidate.default;
    }

    if (isPluginLike(candidate.plugin)) {
      return candidate.plugin;
    }

    return undefined;
  }
}
