import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitHtmlSource } from "./internal/emitHtmlSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";

const DEFAULT_PLUGIN_NAME = "typed-html-virtual-module";

export interface HtmlVirtualModulePluginOptions {
  readonly name?: string;
  readonly defaultPath?: string;
  readonly defaultOutlet?: string;
}

export function createHtmlVirtualModulePlugin(
  options: HtmlVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(applyHtmlDefaults(id, options));
      return parsed.ok && parsed.kind === "html";
    },
    build(id) {
      const parsed = parseTypedVirtualModuleId(applyHtmlDefaults(id, options));
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "html") return buildError("TVM-ID-001", "expected typed:html", name);
      return emitHtmlSource({ sourcePath: parsed.path, outlet: parsed.outlet });
    },
  };
}

function applyHtmlDefaults(id: string, options: HtmlVirtualModulePluginOptions): string {
  if (id !== "typed:html" && !id.startsWith("typed:html?")) return id;
  const params = new URLSearchParams(id.includes("?") ? id.slice(id.indexOf("?") + 1) : "");
  if (!params.has("path") && options.defaultPath) params.set("path", options.defaultPath);
  if (!params.has("outlet") && options.defaultOutlet) params.set("outlet", options.defaultOutlet);
  const query = params.toString();
  return query ? `typed:html?${query}` : id;
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
