import ts from "typescript";
import type { VirtualModuleResolver, VmcPluginEntry } from "@typed/virtual-modules";
import {
  loadResolverFromVmcConfig,
  PluginManager,
} from "@typed/virtual-modules";

export interface VmcConfig {
  readonly resolver?: VirtualModuleResolver;
  readonly plugins?: readonly VmcPluginEntry[];
}

/**
 * Load the resolver from vmc.config.* in projectRoot, or return an empty PluginManager.
 */
export function loadResolver(projectRoot: string): VirtualModuleResolver {
  const loaded = loadResolverFromVmcConfig({ projectRoot, ts });
  if (loaded.status === "not-found") {
    return new PluginManager();
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

  return loaded.resolver ?? new PluginManager();
}
