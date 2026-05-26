import process from "node:process";
import type {
  VirtualModuleBuildError,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import ts from "typescript";
import type { LoadTypedConfigResult } from "./config/index.js";
import { findTypedConfigRoot, loadTypedConfig } from "./config/index.js";
import { emitConfigSource } from "./internal/emitConfigSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";

const DEFAULT_PLUGIN_NAME = "typed-config-virtual-module";

export interface ConfigVirtualModulePluginOptions {
  readonly config?: Readonly<Record<string, unknown>>;
  readonly loadConfig?: () => LoadTypedConfigResult;
  readonly name?: string;
}

export function createConfigVirtualModulePlugin(
  options: ConfigVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(id);
      return parsed.ok && parsed.kind === "config";
    },
    build(id, importer, _api, context) {
      const parsed = parseTypedVirtualModuleId(id);
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "config") return buildError("TVM-ID-001", "expected typed:config", name);
      const config = resolveConfig(options, importer);
      if (!config.ok) return buildError("TVM-CONFIG-001", config.message, name);
      return emitConfigSource(config.value, name, context);
    },
  };
}

function resolveConfig(options: ConfigVirtualModulePluginOptions, importer: string) {
  if (options.config) return { ok: true as const, value: options.config };
  const result = options.loadConfig?.() ?? defaultLoadConfig(importer);
  if (result.status === "loaded") return { ok: true as const, value: result.config };
  if (result.status === "not-found") return { ok: true as const, value: {} };
  return { ok: false as const, message: result.message };
}

function defaultLoadConfig(importer: string): LoadTypedConfigResult {
  return loadTypedConfig({ projectRoot: projectRootForImporter(importer), ts });
}

function projectRootForImporter(importer: string): string {
  return findTypedConfigRoot(importer) ?? process.cwd();
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
