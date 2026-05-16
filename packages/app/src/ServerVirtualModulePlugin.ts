import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitServerSource } from "./internal/emitServerSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";
import { resolveServerCompanion } from "./internal/serverCompanions.js";

const DEFAULT_PLUGIN_NAME = "typed-server-virtual-module";

export interface ServerVirtualModulePluginOptions {
  readonly name?: string;
}

export function createServerVirtualModulePlugin(
  options: ServerVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(id);
      return parsed.ok && parsed.kind === "server";
    },
    build(id, importer) {
      const parsed = parseTypedVirtualModuleId(id);
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "server") return buildError("TVM-ID-001", "expected typed:server", name);
      const companion = resolveServerCompanion(importer);
      return emitServerSource({ parsed, id, companions: companion.imports });
    },
  };
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
