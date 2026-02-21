import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type {
  VirtualModuleResolver,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import { PluginManager } from "@typed/virtual-modules";

const CONFIG_NAMES = ["vmc.config.js", "vmc.config.mjs", "vmc.config.cjs"];

export interface VmcConfig {
  readonly resolver?: VirtualModuleResolver;
  readonly plugins?: readonly VirtualModulePlugin[];
}

/**
 * Load the resolver from vmc.config.* in projectRoot, or return an empty PluginManager.
 */
export function loadResolver(projectRoot: string): VirtualModuleResolver {
  for (const name of CONFIG_NAMES) {
    const path = join(projectRoot, name);
    if (!existsSync(path)) {
      continue;
    }

    try {
      const config = loadConfig(path);
      if (config.resolver) {
        return config.resolver;
      }
      if (config.plugins && config.plugins.length > 0) {
        return new PluginManager([...config.plugins]);
      }
      return new PluginManager();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[vmc] Failed to load ${path}: ${msg}`);
      process.exit(1);
    }
  }

  return new PluginManager();
}

function loadConfig(configPath: string): VmcConfig {
  const baseDir = dirname(configPath);
  const require = createRequire(import.meta.url);
  const mod = require(resolve(baseDir, configPath));
  return normalizeConfig(mod);
}

function normalizeConfig(mod: unknown): VmcConfig {
  if (!mod || typeof mod !== "object") {
    return { plugins: [] };
  }

  const m = mod as Record<string, unknown>;
  const result: { resolver?: VirtualModuleResolver; plugins?: readonly VirtualModulePlugin[] } = {};

  if (m.resolver && typeof (m.resolver as { resolveModule: unknown }).resolveModule === "function") {
    result.resolver = m.resolver as VirtualModuleResolver;
  }
  if (Array.isArray(m.plugins)) {
    result.plugins = m.plugins as VirtualModulePlugin[];
  }

  return result;
}
