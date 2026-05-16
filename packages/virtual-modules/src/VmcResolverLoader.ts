import { dirname } from "node:path";
import { collectTypeTargetSpecsFromPlugins } from "./collectTypeTargetSpecs.js";
import { NodeModulePluginLoader } from "./NodeModulePluginLoader.js";
import { PluginManager } from "./PluginManager.js";
import { loadVmcConfig } from "./VmcConfigLoader.js";
import type { VmcPluginEntry } from "./VmcConfigLoader.js";
import type {
  NodeModulePluginLoadError,
  TypeTargetSpec,
  VirtualModulePlugin,
  VirtualModuleResolver,
} from "./types.js";

function collectFromResolver(
  resolver: VirtualModuleResolver,
): readonly TypeTargetSpec[] | undefined {
  const pm = resolver as { plugins?: readonly VirtualModulePlugin[] };
  if (!Array.isArray(pm.plugins) || pm.plugins.length === 0) return undefined;
  const merged = collectTypeTargetSpecsFromPlugins(pm.plugins);
  return merged.length > 0 ? merged : undefined;
}

export interface LoadPluginsFromEntriesResult {
  readonly plugins: readonly VirtualModulePlugin[];
  readonly pluginSpecifiers: readonly string[];
  readonly pluginModules: readonly LoadedVmcPluginModule[];
  readonly errors: readonly NodeModulePluginLoadError[];
}

export interface LoadedVmcPluginModule {
  readonly specifier: string;
  readonly pluginName: string;
  readonly resolvedPath: string;
  readonly dependencyPaths: readonly string[];
}

export function loadPluginsFromEntries(
  entries: readonly VmcPluginEntry[],
  baseDir: string,
): LoadPluginsFromEntriesResult {
  const loader = new NodeModulePluginLoader();
  const plugins: VirtualModulePlugin[] = [];
  const pluginSpecifiers: string[] = [];
  const pluginModules: LoadedVmcPluginModule[] = [];
  const errors: NodeModulePluginLoadError[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      pluginSpecifiers.push(entry);
      const loaded = loader.load({ specifier: entry, baseDir });
      if (loaded.status === "loaded") {
        plugins.push(loaded.plugin);
        pluginModules.push({
          specifier: entry,
          pluginName: loaded.plugin.name,
          resolvedPath: loaded.resolvedPath,
          dependencyPaths: loaded.dependencyPaths,
        });
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
    pluginModules,
    errors,
  };
}

export type LoadResolverFromVmcConfigResult =
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly path?: string; readonly message: string }
  | {
      readonly status: "loaded";
      readonly path: string;
      readonly configDependencyPaths: readonly string[];
      readonly resolver?: VirtualModuleResolver;
      readonly pluginSpecifiers: readonly string[];
      readonly pluginModules: readonly LoadedVmcPluginModule[];
      readonly pluginLoadErrors: readonly NodeModulePluginLoadError[];
      /** Type target specs from config for structural assignability in TypeInfo API. */
      readonly typeTargetSpecs?: readonly TypeTargetSpec[];
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
    const resolver = loadedVmcConfig.config.resolver;
    const typeTargetSpecs = collectFromResolver(resolver);
    return {
      status: "loaded",
      path: loadedVmcConfig.path,
      configDependencyPaths: loadedVmcConfig.dependencyPaths,
      resolver,
      pluginSpecifiers,
      pluginModules: [],
      pluginLoadErrors: [],
      ...(typeTargetSpecs ? { typeTargetSpecs } : {}),
    };
  }

  const loadedPlugins = loadPluginsFromEntries(vmcPlugins, dirname(loadedVmcConfig.path));
  const resolver =
    loadedPlugins.plugins.length > 0 ? new PluginManager(loadedPlugins.plugins) : undefined;
  const typeTargetSpecs = resolver ? collectFromResolver(resolver) : undefined;
  return {
    status: "loaded",
    path: loadedVmcConfig.path,
    configDependencyPaths: loadedVmcConfig.dependencyPaths,
    ...(resolver ? { resolver } : {}),
    pluginSpecifiers: loadedPlugins.pluginSpecifiers,
    pluginModules: loadedPlugins.pluginModules,
    pluginLoadErrors: loadedPlugins.errors,
    ...(typeTargetSpecs ? { typeTargetSpecs } : {}),
  };
}
