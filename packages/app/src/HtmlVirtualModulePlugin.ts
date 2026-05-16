import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitHtmlSource } from "./internal/emitHtmlSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";

const DEFAULT_PLUGIN_NAME = "typed-html-virtual-module";

export interface HtmlVirtualModulePluginOptions {
  readonly name?: string;
}

export function createHtmlVirtualModulePlugin(
  options: HtmlVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(id);
      return parsed.ok && parsed.kind === "html";
    },
    build(id) {
      const parsed = parseTypedVirtualModuleId(id);
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "html") return buildError("TVM-ID-001", "expected typed:html", name);
      return emitHtmlSource({ sourcePath: parsed.path, outlet: parsed.outlet });
    },
  };
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
