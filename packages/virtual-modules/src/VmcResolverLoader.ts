import { dirname } from "node:path";
import { NodeModulePluginLoader } from "./NodeModulePluginLoader.js";
import { PluginManager } from "./PluginManager.js";
import { loadVmcConfig } from "./VmcConfigLoader.js";
import type { VmcPluginEntry } from "./VmcConfigLoader.js";
import type {
  NodeModulePluginLoadError,
  VirtualModulePlugin,
  VirtualModuleResolver,
} from "./types.js";

export interface LoadPluginsFromEntriesResult {
  readonly plugins: readonly VirtualModulePlugin[];
  readonly pluginSpecifiers: readonly string[];
  readonly errors: readonly NodeModulePluginLoadError[];
}

export function loadPluginsFromEntries(
  entries: readonly VmcPluginEntry[],
  baseDir: string,
): LoadPluginsFromEntriesResult {
  const loader = new NodeModulePluginLoader();
  const plugins: VirtualModulePlugin[] = [];
  const pluginSpecifiers: string[] = [];
  const errors: NodeModulePluginLoadError[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      pluginSpecifiers.push(entry);
      const loaded = loader.load({ specifier: entry, baseDir });
      if (loaded.status === "loaded") {
        plugins.push(loaded.plugin);
      } else {
        errors.push(loaded);
      }
      continue;
    }

    plugins.push(entry);
  }

  return {
    plugins,
    pluginSpecifiers,
    errors,
  };
}

export type LoadResolverFromVmcConfigResult =
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly path?: string; readonly message: string }
  | {
      readonly status: "loaded";
      readonly path: string;
      readonly resolver?: VirtualModuleResolver;
      readonly pluginSpecifiers: readonly string[];
      readonly pluginLoadErrors: readonly NodeModulePluginLoadError[];
    };

export interface LoadResolverFromVmcConfigOptions {
  readonly projectRoot: string;
  readonly ts: typeof import("typescript");
  readonly configPath?: string;
}

export function loadResolverFromVmcConfig(
  options: LoadResolverFromVmcConfigOptions,
): LoadResolverFromVmcConfigResult {
  const loadedVmcConfig = loadVmcConfig(options);
  if (loadedVmcConfig.status === "not-found") {
    return loadedVmcConfig;
  }
  if (loadedVmcConfig.status === "error") {
    return loadedVmcConfig;
  }

  const vmcPlugins = loadedVmcConfig.config.plugins ?? [];
  const pluginSpecifiers = vmcPlugins.filter((entry): entry is string => typeof entry === "string");

  if (loadedVmcConfig.config.resolver) {
    return {
      status: "loaded",
      path: loadedVmcConfig.path,
      resolver: loadedVmcConfig.config.resolver,
      pluginSpecifiers,
      pluginLoadErrors: [],
    };
  }

  const loadedPlugins = loadPluginsFromEntries(vmcPlugins, dirname(loadedVmcConfig.path));
  return {
    status: "loaded",
    path: loadedVmcConfig.path,
    ...(loadedPlugins.plugins.length > 0
      ? { resolver: new PluginManager(loadedPlugins.plugins) }
      : {}),
    pluginSpecifiers: loadedPlugins.pluginSpecifiers,
    pluginLoadErrors: loadedPlugins.errors,
  };
}
