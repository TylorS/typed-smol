import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import * as ts from "typescript";
import {
  createRouterVirtualModulePlugin,
  createHttpApiVirtualModulePlugin,
  loadTypedConfig,
} from "@typed/app";
import {
  collectTypeTargetSpecsFromPlugins,
  createTypeInfoApiSession,
  createVirtualFileName,
  createVirtualKey,
  getProgramWithTypeTargetBootstrap,
  loadPluginsFromEntries,
  loadResolverFromVmcConfig,
  PluginManager,
} from "@typed/virtual-modules";
import type { VirtualModuleResolver } from "@typed/virtual-modules";

const TSPLUGIN_NAME = "@typed/virtual-modules-ts-plugin";

interface TsPluginConfig {
  name?: string;
  plugins?: readonly string[];
  debounceMs?: number;
  vmcConfigPath?: string;
}

export interface ResolverResult {
  sourceText: string;
  pluginName: string;
  virtualFileName: string;
}

/**
 * Find tsconfig.json from a directory upward.
 */
export function findTsconfig(fromDir: string): string | undefined {
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
 * Project root for a file: directory of the nearest tsconfig that contains it.
 * Use this so virtual module resolution uses the correct tsconfig (e.g. sample-project, not monorepo root).
 */
export function getProjectRootForFile(filePath: string): string | undefined {
  const tsconfigPath = findTsconfig(dirname(resolve(filePath)));
  return tsconfigPath ? dirname(tsconfigPath) : undefined;
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
        typeof p === "object" && p !== null && (p as TsPluginConfig).name === TSPLUGIN_NAME,
    );
    return entry as TsPluginConfig | undefined;
  } catch {
    return undefined;
  }
}

function getVmcConfigPath(config: TsPluginConfig | undefined): string | undefined {
  const vmcConfigPath = config?.vmcConfigPath;
  return typeof vmcConfigPath === "string" && vmcConfigPath.trim().length > 0
    ? vmcConfigPath.trim()
    : undefined;
}

export const programCache = new Map<string, ts.Program>();

/**
 * Clear the program cache for a project. Call when source files change so plugins
 * re-read fresh content on next resolve.
 */
export function clearProgramCache(projectRoot: string): void {
  programCache.delete(projectRoot);
}

/**
 * Create a TypeScript Program for the project so plugins that need type info (e.g. router)
 * can use the TypeInfo API. Cached per project root.
 * Does not include the type-target bootstrap; call getProgramWithTypeTargetBootstrap when building the session.
 */
function getProgramForProject(projectRoot: string): ts.Program | undefined {
  const cached = programCache.get(projectRoot);
  if (cached !== undefined) return cached;

  const tsconfigPath = findTsconfig(projectRoot);
  if (!tsconfigPath) return undefined;

  try {
    // oxlint-disable-next-line typescript/unbound-method
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (configFile.error) return undefined;

    const configDir = dirname(tsconfigPath);
    const parsed = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      configDir,
      undefined,
      tsconfigPath,
    );
    if (parsed.fileNames.length === 0) return undefined;

    const baseHost = ts.createCompilerHost(parsed.options, true);
    const host = {
      ...baseHost,
      getCurrentDirectory: () => configDir,
    };

    const program = ts.createProgram(
      parsed.fileNames,
      parsed.options,
      host,
    );
    programCache.set(projectRoot, program);
    return program;
  } catch {
    return undefined;
  }
}

/**
 * Create a resolver for a workspace folder.
 * Prefers vmc config loading, with legacy tsconfig plugin fallback.
 */
export function createResolver(projectRoot: string): {
  resolve: (id: string, importer: string) => ResolverResult | undefined;
  getPluginSpecifiers: () => readonly string[];
  clearProgramCache: () => void;
} {
  const tsconfigPath = findTsconfig(projectRoot);
  const tsPluginConfig = tsconfigPath ? getPluginConfig(tsconfigPath) : undefined;
  const vmcConfigPath = getVmcConfigPath(tsPluginConfig);
  const legacyPluginSpecifiers = tsPluginConfig?.plugins ?? [];

  let resolver: VirtualModuleResolver | undefined;
  let pluginSpecifiers: readonly string[] = [];

  const loadedResolver = loadResolverFromVmcConfig({
    projectRoot,
    ts,
    ...(vmcConfigPath ? { configPath: vmcConfigPath } : {}),
  });

  const typedConfigResult = loadTypedConfig({ projectRoot, ts });
  const typedConfig =
    typedConfigResult.status === "loaded" ? typedConfigResult.config : undefined;

  const vmcPlugins =
    loadedResolver.status === "loaded" && loadedResolver.resolver
      ? ((loadedResolver.resolver as PluginManager).plugins ?? [])
      : [];

  const builtInPlugins = [
    createRouterVirtualModulePlugin({
      ...(typedConfig?.router ? { prefix: typedConfig.router.prefix } : {}),
      lenientDepsValidation: true,
    }),
    createHttpApiVirtualModulePlugin(
      typedConfig?.api
        ? {
            prefix: typedConfig.api.prefix,
            pathPrefix: typedConfig.api.pathPrefix,
          }
        : {},
    ),
  ];

  // Built-in plugins first so router:/api: resolve with our TypeInfo session; vmc custom plugins handle virtual: etc.
  const plugins = [...builtInPlugins, ...vmcPlugins];
  resolver = new PluginManager(plugins);
  pluginSpecifiers =
    loadedResolver.status === "loaded"
      ? loadedResolver.pluginSpecifiers
      : [];

  let typeTargetSpecs = collectTypeTargetSpecsFromPlugins(plugins);
  const vmcTypeTargetSpecs =
    loadedResolver.status === "loaded" ? loadedResolver.typeTargetSpecs : undefined;
  if (vmcTypeTargetSpecs && vmcTypeTargetSpecs.length > 0) {
    typeTargetSpecs = [...vmcTypeTargetSpecs, ...typeTargetSpecs];
  }

  // Backward-compatible fallback for legacy tsconfig plugin-specifier lists when vmc has no resolver.
  if (vmcPlugins.length === 0 && legacyPluginSpecifiers.length > 0) {
    const loadedPlugins = loadPluginsFromEntries(
      legacyPluginSpecifiers,
      projectRoot,
    );
    pluginSpecifiers = legacyPluginSpecifiers;
    if (loadedPlugins.plugins.length > 0) {
      resolver = new PluginManager([...loadedPlugins.plugins, ...builtInPlugins]);
      typeTargetSpecs = [
        ...(collectTypeTargetSpecsFromPlugins(loadedPlugins.plugins) ?? []),
        ...typeTargetSpecs,
      ];
    }
  }

  if (!resolver) {
    return {
      resolve: () => undefined,
      getPluginSpecifiers: () => pluginSpecifiers,
      clearProgramCache: () => {},
    };
  }

  return {
    resolve(id: string, importer: string): ResolverResult | undefined {
      const baseProgram = getProgramForProject(projectRoot);
      const createTypeInfoApiSessionOption =
        baseProgram !== undefined
          ? () => {
              const program = getProgramWithTypeTargetBootstrap(
                ts,
                baseProgram,
                projectRoot,
                typeTargetSpecs ?? [],
              );
              return createTypeInfoApiSession({
                ts,
                program,
                ...(typeTargetSpecs && typeTargetSpecs.length > 0
                  ? {
                      typeTargetSpecs,
                      failWhenNoTargetsResolved: false,
                    }
                  : {}),
              });
            }
          : undefined;

      const resolution = resolver.resolveModule({
        id,
        importer,
        createTypeInfoApiSession: createTypeInfoApiSessionOption,
      });
      if (resolution.status === "resolved") {
        const virtualKey = createVirtualKey(id, importer);
        return {
          sourceText: resolution.sourceText,
          pluginName: resolution.pluginName,
          virtualFileName: createVirtualFileName(
            resolution.pluginName,
            virtualKey,
            { id, importer },
            { projectRoot },
          ),
        };
      }
      return undefined;
    },
    getPluginSpecifiers: () => pluginSpecifiers,
    clearProgramCache: () => clearProgramCache(projectRoot),
  };
}
