import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
// @ts-expect-error ESM
import { NodeModulePluginLoader, PluginManager } from "@typed/virtual-modules";
// @ts-expect-error ESM
import type { VirtualModulePlugin } from "@typed/virtual-modules";

const toPosixPath = (path: string) => path.replaceAll("\\", "/");
const sanitizeSegment = (value: string) => value.replaceAll(/[^a-zA-Z0-9._-]/g, "-");
const stableHash = (input: string) =>
  createHash("sha1").update(input).digest("hex").slice(0, 16);

function createVirtualFileName(
  projectRoot: string,
  pluginName: string,
  virtualKey: string,
): string {
  const safePluginName = sanitizeSegment(pluginName);
  const hash = stableHash(virtualKey);
  return toPosixPath(
    posix.join(toPosixPath(projectRoot), ".typed", "virtual", safePluginName, `${hash}.d.ts`),
  );
}

const TSPLUGIN_NAME = "@typed/virtual-modules-ts-plugin";

interface TsPluginConfig {
  name?: string;
  plugins?: readonly string[];
  debounceMs?: number;
}

export interface ResolverResult {
  sourceText: string;
  pluginName: string;
  virtualFileName: string;
}

/**
 * Find tsconfig.json from a directory upward.
 */
function findTsconfig(fromDir: string): string | undefined {
  let dir = resolve(fromDir);
  const root = resolve(dir, "/");
  while (dir !== root) {
    const candidate = join(dir, "tsconfig.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/**
 * Parse tsconfig.json and extract plugin config for @typed/virtual-modules-ts-plugin.
 */
function getPluginConfig(tsconfigPath: string): TsPluginConfig | undefined {
  try {
    const content = readFileSync(tsconfigPath, "utf8");
    const parsed = JSON.parse(content) as {
      compilerOptions?: { plugins?: readonly unknown[] };
    };
    const plugins = parsed.compilerOptions?.plugins;
    if (!Array.isArray(plugins)) return undefined;
    const entry = plugins.find(
      (p): p is TsPluginConfig =>
        typeof p === "object" &&
        p !== null &&
        (p as TsPluginConfig).name === TSPLUGIN_NAME,
    );
    return entry as TsPluginConfig | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Create a resolver for a workspace folder.
 * Loads plugins from tsconfig and returns a resolve function.
 */
export function createResolver(projectRoot: string): {
  resolve: (id: string, importer: string) => ResolverResult | undefined;
  getPluginSpecifiers: () => readonly string[];
} {
  const tsconfigPath = findTsconfig(projectRoot);
  const config = tsconfigPath ? getPluginConfig(tsconfigPath) : undefined;
  const pluginSpecifiers = config?.plugins ?? [];

  if (pluginSpecifiers.length === 0) {
    return {
      resolve: () => undefined,
      getPluginSpecifiers: () => [],
    };
  }

  const loader = new NodeModulePluginLoader();
  const loadResults = loader.loadMany(
    pluginSpecifiers.map((spec) => ({ specifier: spec, baseDir: projectRoot })),
  );

  const plugins: VirtualModulePlugin[] = [];
  for (const result of loadResults) {
    if (result.status === "loaded") {
      plugins.push(result.plugin);
    }
  }

  if (plugins.length === 0) {
    return {
      resolve: () => undefined,
      getPluginSpecifiers: () => pluginSpecifiers,
    };
  }

  const resolver = new PluginManager(plugins);

  return {
    resolve(id: string, importer: string): ResolverResult | undefined {
      const resolution = resolver.resolveModule({ id, importer });
      if (resolution.status === "resolved") {
        const virtualKey = `${importer}::${id}`;
        return {
          sourceText: resolution.sourceText,
          pluginName: resolution.pluginName,
          virtualFileName: createVirtualFileName(projectRoot, resolution.pluginName, virtualKey),
        };
      }
      return undefined;
    },
    getPluginSpecifiers: () => pluginSpecifiers,
  };
}

