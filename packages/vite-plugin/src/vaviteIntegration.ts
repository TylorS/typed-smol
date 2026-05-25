import { vavite } from "vavite";
import type { VaviteRunnableHandlerEntry } from "vavite";
import { createRunnableDevEnvironment } from "vite";
import type { ConfigEnv, Plugin, ResolvedConfig, UserConfig } from "vite";

export interface TypedVaviteIntegrationOptions {
  readonly serverEntry: string;
}

export function createTypedVavitePlugin(options: TypedVaviteIntegrationOptions): Plugin[] {
  const plugins = vavite({
    entries: [createTypedVaviteEntry(options)],
  });
  const normalized = Array.isArray(plugins) ? (plugins as Plugin[]) : [plugins as Plugin];
  return [ssrRunnableEnvironmentPlugin, ...normalized.map(disableInTestMode)];
}

export function createTypedVaviteEntry(
  options: TypedVaviteIntegrationOptions,
): VaviteRunnableHandlerEntry {
  return {
    entry: options.serverEntry,
    type: "runnable-handler",
    order: "post",
  };
}

export const ssrRunnableEnvironmentPlugin: Plugin = {
  name: "typed-vavite:ssr-runnable-environment",
  enforce: "pre",
  config(config) {
    config.appType ??= "custom";
    config.environments ??= {};
    config.environments.ssr ??= {};
    config.environments.ssr.dev ??= {};
    config.environments.ssr.dev.createEnvironment ??= createSsrRunnableEnvironment;
  },
};

export const createSsrRunnableEnvironment = (
  name: string,
  config: ResolvedConfig,
  _context: unknown,
) => createRunnableDevEnvironment(name, config);

const disableInTestMode = (plugin: Plugin): Plugin => {
  const apply = plugin.apply;
  return {
    ...plugin,
    apply(config: UserConfig, env: ConfigEnv) {
      if (env.mode === "test") return false;
      if (apply === undefined) return true;
      if (typeof apply === "function") return apply(config, env);
      return apply === env.command;
    },
  };
};
