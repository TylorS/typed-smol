// oxlint-disable typescript/unbound-method
/**
 * TypeScript Language Service plugin that integrates @typed/virtual-modules.
 * Resolves virtual modules (e.g. virtual:foo) during editor type-checking.
 *
 * Preferred setup:
 * 1) Define plugins/resolver in vmc.config.ts in the project root.
 * 2) Enable this TS plugin in tsconfig.json.
 *
 * tsconfig.json:
 * {
 *   "compilerOptions": {
 *     "plugins": [{
 *       "name": "@typed/virtual-modules-ts-plugin",
 *       "debounceMs": 50
 *     }]
 *   }
 * }
 *
 * Plugin definitions are loaded from vmc.config.ts.
 */
import {
  attachLanguageServiceAdapter,
  createTypeInfoApiSession,
  loadResolverFromVmcConfig,
  // @ts-expect-error It's ESM being imported by CJS
} from "@typed/virtual-modules";
import { dirname } from "node:path";
import ts, { DirectoryWatcherCallback, FileWatcherCallback } from "typescript";
import type { PluginCreateInfo } from "./types.js";

interface VirtualModulesTsPluginConfig {
  readonly debounceMs?: number;
  readonly vmcConfigPath?: string;
}

type LoadedVirtualResolver = import(
  "@typed/virtual-modules",
  { with: { "resolution-mode": "import" } }
).VirtualModuleResolver;

function init(modules: { typescript: typeof import("typescript") }): {
  create: (info: PluginCreateInfo) => import("typescript").LanguageService;
} {
  const ts = modules.typescript;

  function create(info: PluginCreateInfo) {
    const config = (info.config ?? {}) as VirtualModulesTsPluginConfig;

    const project = info.project as {
      getCurrentDirectory?: () => string;
      configFilePath?: string;
    };
    const projectRoot =
      typeof project.configFilePath === "string" && project.configFilePath.length > 0
        ? dirname(project.configFilePath)
        : typeof project.getCurrentDirectory === "function"
          ? project.getCurrentDirectory()
          : process.cwd();

    const logger = (
      info.project as { projectService?: { logger?: { info?: (s: string) => void } } }
    )?.projectService?.logger;

    const debounceMs =
      typeof config.debounceMs === "number" &&
      Number.isFinite(config.debounceMs) &&
      config.debounceMs >= 0
        ? config.debounceMs
        : 50;
    if (
      config.debounceMs !== undefined &&
      (typeof config.debounceMs !== "number" || !Number.isFinite(config.debounceMs))
    ) {
      logger?.info?.(
        "[@typed/virtual-modules-ts-plugin] Ignoring invalid debounceMs; expected finite number",
      );
    }
    const vmcConfigPath =
      typeof config.vmcConfigPath === "string" && config.vmcConfigPath.trim().length > 0
        ? config.vmcConfigPath
        : undefined;
    if (config.vmcConfigPath !== undefined && vmcConfigPath === undefined) {
      logger?.info?.(
        "[@typed/virtual-modules-ts-plugin] Ignoring invalid vmcConfigPath; expected non-empty string",
      );
    }

    let resolver: LoadedVirtualResolver | undefined;
    const loadedResolver = loadResolverFromVmcConfig({
      projectRoot,
      ts,
      ...(vmcConfigPath ? { configPath: vmcConfigPath } : {}),
    });
    if (loadedResolver.status === "error") {
      logger?.info?.(`[@typed/virtual-modules-ts-plugin] ${loadedResolver.message}`);
      return info.languageService;
    }

    if (loadedResolver.status === "loaded") {
      for (const pluginLoadError of loadedResolver.pluginLoadErrors) {
        logger?.info?.(
          `[@typed/virtual-modules-ts-plugin] Failed to load plugin "${pluginLoadError.specifier}": ${pluginLoadError.message}`,
        );
      }

      resolver = loadedResolver.resolver as LoadedVirtualResolver | undefined;
      if (!resolver) {
        logger?.info?.(
          `[@typed/virtual-modules-ts-plugin] ${loadedResolver.path} has no resolver/plugins`,
        );
        return info.languageService;
      }
    }

    if (!resolver || loadedResolver.status === "not-found") {
      logger?.info?.(
        "[@typed/virtual-modules-ts-plugin] vmc.config.ts not found; virtual module resolution disabled",
      );
      return info.languageService;
    }

    logger?.info?.(`[@typed/virtual-modules-ts-plugin] Virtual module resolver initialized`);

    const createTypeInfoApiSessionFactory = ({
      id: _id,
      importer: _importer,
    }: {
      id: string;
      importer: string;
    }) => {
      let session: ReturnType<typeof createTypeInfoApiSession> | null = null;
      let apiUsed = false;

      const getSession = () => {
        if (session) return session;
        const program = info.languageService.getProgram()!;
        session = createTypeInfoApiSession({ ts, program });
        return session;
      };
      return {
        api: {
          file: (
            path: string,
            opts: Parameters<ReturnType<typeof createTypeInfoApiSession>["api"]["file"]>[1],
          ) => {
            apiUsed = true;
            return getSession().api.file(path, opts);
          },
          directory: (
            glob: string | readonly string[],
            opts: Parameters<ReturnType<typeof createTypeInfoApiSession>["api"]["directory"]>[1],
          ) => {
            apiUsed = true;
            return getSession().api.directory(glob, opts);
          },
        },
        consumeDependencies: () => (apiUsed ? getSession().consumeDependencies() : ([] as const)),
      };
    };

    const projectWithWatch = info.project as {
      watchFile?: (
        path: string,
        callback: (fileName: string, eventKind: ts.FileWatcherEventKind) => void,
      ) => ts.FileWatcher;
      watchDirectory?: (
        path: string,
        callback: (fileName: string) => void,
        recursive?: boolean,
      ) => ts.FileWatcher;
    };
    const sys = ts.sys;
    const projectWatchFile = projectWithWatch.watchFile;
    const projectWatchDirectory = projectWithWatch.watchDirectory;
    const sysWatchFile = sys?.watchFile;
    const sysWatchDirectory = sys?.watchDirectory;
    const watchHost =
      typeof projectWatchFile === "function"
        ? {
            watchFile: (path: string, callback: FileWatcherCallback) =>
              projectWatchFile!(path, callback),
            watchDirectory:
              typeof projectWatchDirectory === "function"
                ? (path: string, callback: DirectoryWatcherCallback, recursive?: boolean) =>
                    projectWatchDirectory!(path, callback, recursive)
                : undefined,
          }
        : typeof sysWatchFile === "function"
          ? {
              watchFile: (path: string, callback: FileWatcherCallback) =>
                sysWatchFile!(path, callback),
              watchDirectory:
                typeof sysWatchDirectory === "function"
                  ? (path: string, callback: DirectoryWatcherCallback, recursive?: boolean) =>
                      sysWatchDirectory!(path, callback, recursive)
                  : undefined,
            }
          : undefined;

    attachLanguageServiceAdapter({
      ts,
      languageService: info.languageService,
      languageServiceHost: info.project as import("typescript").LanguageServiceHost,
      resolver,
      projectRoot,
      createTypeInfoApiSession: createTypeInfoApiSessionFactory,
      watchHost,
      debounceMs,
    });

    return info.languageService;
  }

  return { create };
}

module.exports = init;
