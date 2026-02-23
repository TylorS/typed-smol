// oxlint-disable typescript/unbound-method
/**
 * TypeScript Language Service plugin that integrates @typed/virtual-modules.
 * Resolves virtual modules (e.g. virtual:foo) during editor type-checking.
 *
 * Configure in tsconfig.json:
 * {
 *   "compilerOptions": {
 *     "plugins": [{
 *       "name": "@typed/virtual-modules-ts-plugin",
 *       "plugins": ["./virtual/foo.cjs"],
 *       "debounceMs": 50
 *     }]
 *   }
 * }
 *
 * The "plugins" array contains specifiers (paths or package names) loaded via
 * NodeModulePluginLoader from the project root.
 */
import {
  attachLanguageServiceAdapter,
  createTypeInfoApiSession,
  NodeModulePluginLoader,
  PluginManager,
  // @ts-expect-error It's ESM being imported by CJS
} from "@typed/virtual-modules";
import { dirname } from "node:path";
import ts, { DirectoryWatcherCallback, FileWatcherCallback } from "typescript";
import type { PluginCreateInfo } from "./types.js";

interface VirtualModulesTsPluginConfig {
  readonly plugins?: readonly string[];
  readonly debounceMs?: number;
}

function init(modules: { typescript: typeof import("typescript") }): {
  create: (info: PluginCreateInfo) => import("typescript").LanguageService;
} {
  const ts = modules.typescript;

  function create(info: PluginCreateInfo) {
    const config = (info.config ?? {}) as VirtualModulesTsPluginConfig;
    const pluginSpecifiers = config.plugins ?? [];
    const debounceMs = config.debounceMs ?? 50;

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

    const loader = new NodeModulePluginLoader();
    const loadResults = loader.loadMany(
      pluginSpecifiers.map((spec) => ({ specifier: spec, baseDir: projectRoot })),
    );

    const plugins: import(
      "@typed/virtual-modules",
      { with: { "resolution-mode": "import" } }
    ).VirtualModulePlugin[] = [];
    for (const result of loadResults) {
      if (result.status === "loaded") {
        plugins.push(result.plugin);
      } else {
        const logger = (
          info.project as { projectService?: { logger?: { info?: (s: string) => void } } }
        )?.projectService?.logger;
        logger?.info?.(
          `[@typed/virtual-modules-ts-plugin] Failed to load plugin "${result.specifier}": ${result.message}`,
        );
      }
    }

    if (plugins.length === 0) {
      return info.languageService;
    }

    const logger = (
      info.project as { projectService?: { logger?: { info?: (s: string) => void } } }
    )?.projectService?.logger;
    logger?.info?.(
      `[@typed/virtual-modules-ts-plugin] Loaded ${plugins.length} virtual module plugin(s)`,
    );

    const resolver = new PluginManager(plugins);

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
