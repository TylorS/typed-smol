import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitBrowserSource } from "./internal/emitBrowserSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";
import { resolveBrowserCompanion } from "./internal/browserCompanions.js";

const DEFAULT_PLUGIN_NAME = "typed-browser-virtual-module";

export interface BrowserVirtualModulePluginOptions {
  readonly name?: string;
}

export function createBrowserVirtualModulePlugin(
  options: BrowserVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(id);
      return parsed.ok && parsed.kind === "browser";
    },
    build(id, importer) {
      const parsed = parseTypedVirtualModuleId(id);
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "browser") {
        return buildError("TVM-ID-001", "expected typed:browser", name);
      }
      const companion = resolveBrowserCompanion(importer);
      return emitBrowserSource({ parsed, companions: companion.imports });
    },
  };
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
