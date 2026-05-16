import process from "node:process";
import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitEnvSource } from "./internal/emitEnvSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";

const DEFAULT_PLUGIN_NAME = "typed-env-virtual-module";

export interface EnvVirtualModulePluginOptions {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly name?: string;
}

export function createEnvVirtualModulePlugin(
  options: EnvVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;
  const env = options.env ?? process.env;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(id);
      return parsed.ok && parsed.kind === "env";
    },
    build(id) {
      const parsed = parseTypedVirtualModuleId(id);
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "env") return buildError("TVM-ID-001", "expected typed:env", name);
      return emitEnvSource(env, name);
    },
  };
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
