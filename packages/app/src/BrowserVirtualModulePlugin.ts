import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitBrowserSource } from "./internal/emitBrowserSource.js";
import {
  parseTypedVirtualModuleId,
  type BrowserMode,
} from "./internal/frameworkVirtualModuleId.js";
import { resolveBrowserCompanion } from "./internal/browserCompanions.js";

const DEFAULT_PLUGIN_NAME = "typed-browser-virtual-module";

export interface BrowserVirtualModulePluginOptions {
  readonly name?: string;
  readonly runtimeDefaults?: BrowserRuntimeDefaults;
}

export interface BrowserRuntimeDefaults {
  readonly routes?: readonly string[];
  readonly root?: string;
  readonly base?: string;
  readonly mode?: BrowserMode;
  readonly name?: string;
  readonly devtools?: boolean;
}

export function createBrowserVirtualModulePlugin(
  options: BrowserVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(applyBrowserDefaults(id, options.runtimeDefaults));
      return parsed.ok && parsed.kind === "browser";
    },
    build(id, importer) {
      const parsed = parseTypedVirtualModuleId(applyBrowserDefaults(id, options.runtimeDefaults));
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "browser") {
        return buildError("TVM-ID-001", "expected typed:browser", name);
      }
      const companion = resolveBrowserCompanion(importer);
      return emitBrowserSource({ parsed, companions: companion.imports });
    },
  };
}

function applyBrowserDefaults(id: string, defaults: BrowserRuntimeDefaults | undefined): string {
  if (!defaults || (id !== "typed:browser" && !id.startsWith("typed:browser?"))) return id;
  const params = new URLSearchParams(id.includes("?") ? id.slice(id.indexOf("?") + 1) : "");
  if (!params.has("routes")) appendAll(params, "routes", defaults.routes);
  setMissing(params, "root", defaults.root);
  setMissing(params, "base", defaults.base);
  setMissing(params, "mode", defaults.mode);
  setMissing(params, "name", defaults.name);
  if (!params.has("devtools") && defaults.devtools === true) params.set("devtools", "1");
  const query = params.toString();
  return query ? `typed:browser?${query}` : id;
}

function appendAll(
  params: URLSearchParams,
  key: string,
  values: readonly string[] | undefined,
): void {
  for (const value of values ?? []) params.append(key, value);
}

function setMissing(params: URLSearchParams, key: string, value: string | undefined): void {
  if (!params.has(key) && value !== undefined) params.set(key, value);
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
