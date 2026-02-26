/**
 * Resolves a complete Vite InlineConfig, making vite.config.ts optional.
 *
 * When vite.config.ts exists: passes it as configFile (standard Vite behavior).
 * When absent: constructs InlineConfig with configFile:false and injects typedVitePlugin().
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { InlineConfig } from "vite";
import { typedVitePlugin } from "@typed/vite-plugin";
import type { TypedConfig } from "@typed/app";

const VITE_CONFIG_NAMES = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mts",
  "vite.config.mjs",
] as const;

function findViteConfig(projectRoot: string): string | undefined {
  for (const name of VITE_CONFIG_NAMES) {
    const candidate = join(projectRoot, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

export interface ResolveViteConfigOptions {
  readonly projectRoot: string;
  readonly typedConfig?: TypedConfig;
  readonly baseInlineConfig: InlineConfig;
  /** Explicit --config flag from CLI. */
  readonly explicitConfigFile?: string;
}

/**
 * Merges CLI inline config with typed.config.ts and vite.config.ts discovery.
 */
export function resolveViteInlineConfig(options: ResolveViteConfigOptions): InlineConfig {
  const { projectRoot, typedConfig, baseInlineConfig, explicitConfigFile } = options;

  if (explicitConfigFile) {
    return { ...baseInlineConfig, configFile: explicitConfigFile };
  }

  const viteConfigPath = findViteConfig(projectRoot);
  if (viteConfigPath) {
    return { ...baseInlineConfig, configFile: viteConfigPath };
  }

  const pluginOptions = typedConfig
    ? {
        routerVmOptions: typedConfig.router ? { prefix: typedConfig.router.prefix } : undefined,
        apiVmOptions: typedConfig.api
          ? { prefix: typedConfig.api.prefix, pathPrefix: typedConfig.api.pathPrefix }
          : undefined,
        tsconfig: typedConfig.tsconfig,
        tsconfigPaths: typedConfig.tsconfigPaths,
        analyze: typedConfig.analyze,
        warnOnError: typedConfig.warnOnError,
        compression: typedConfig.compression,
        clients: typedConfig.clients,
      }
    : undefined;

  return {
    ...baseInlineConfig,
    configFile: false,
    plugins: [...typedVitePlugin(pluginOptions)],
    resolve: {
      ...baseInlineConfig.resolve,
      conditions: ["browser", "import", "module", "default"],
    },
    optimizeDeps: {
      ...baseInlineConfig.optimizeDeps,
      include: [
        ...(Array.isArray(baseInlineConfig?.optimizeDeps?.include)
          ? baseInlineConfig.optimizeDeps.include
          : typeof baseInlineConfig?.optimizeDeps?.include === "string"
            ? [baseInlineConfig.optimizeDeps.include]
            : []),
        "effect",
      ],
    },
  };
}
