import ts from "typescript";
import type { TypeTargetSpec, VirtualModuleResolver, VmcPluginEntry } from "@typed/virtual-modules";
import { loadResolverFromVmcConfig, PluginManager } from "@typed/virtual-modules";

export interface VmcConfig {
  readonly resolver?: VirtualModuleResolver;
  readonly plugins?: readonly VmcPluginEntry[];
}

export interface LoadResolverResult {
  readonly resolver: VirtualModuleResolver;
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

/**
 * Load the resolver from vmc.config.* in projectRoot, or return an empty PluginManager.
 * Also returns typeTargetSpecs when configured for structural assignability in TypeInfo API.
 */
export function loadResolver(projectRoot: string): LoadResolverResult {
  const loaded = loadResolverFromVmcConfig({ projectRoot, ts });
  if (loaded.status === "not-found") {
    return { resolver: new PluginManager() };
  }
  if (loaded.status === "error") {
    console.error(`[vmc] ${loaded.message}`);
    process.exit(1);
  }

  if (loaded.pluginLoadErrors.length > 0) {
    for (const error of loaded.pluginLoadErrors) {
      console.error(`[vmc] Failed to load plugin "${error.specifier}": ${error.message}`);
    }
    process.exit(1);
  }

  return {
    resolver: loaded.resolver ?? new PluginManager(),
    ...(loaded.typeTargetSpecs ? { typeTargetSpecs: loaded.typeTargetSpecs } : {}),
  };
}
