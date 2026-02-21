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

    const projectRoot =
      typeof (info.project as { getCurrentDirectory?: () => string }).getCurrentDirectory ===
      "function"
        ? (info.project as { getCurrentDirectory: () => string }).getCurrentDirectory()
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
        const program = info.languageService.getProgram();
        if (!program) {
          return {
            api: {
              file: () => {
                throw new Error(
                  "TypeInfoApi is not available: program not yet created during resolution",
                );
              },
              directory: () => [],
            },
            consumeDependencies: () => [] as const,
          };
        }
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
    const watchHost =
      typeof projectWithWatch.watchFile === "function"
        ? {
            watchFile: (path: string, callback: FileWatcherCallback) =>
              projectWithWatch.watchFile!(path, callback),
            watchDirectory:
              typeof projectWithWatch.watchDirectory === "function"
                ? (path: string, callback: DirectoryWatcherCallback, recursive?: boolean) =>
                    projectWithWatch.watchDirectory!(path, callback, recursive)
                : undefined,
          }
        : undefined;

    const _handle = attachLanguageServiceAdapter({
      ts,
      languageService: info.languageService,
      languageServiceHost: info.project as import("typescript").LanguageServiceHost,
      resolver,
      projectRoot,
      createTypeInfoApiSession: createTypeInfoApiSessionFactory,
      watchHost,
      debounceMs,
    });

    const proxy = Object.create(null) as import("typescript").LanguageService;
    for (const k of Object.keys(info.languageService) as Array<
      keyof import("typescript").LanguageService
    >) {
      const x = info.languageService[k];
      if (typeof x === "function") {
        (proxy as unknown as Record<string, unknown>)[k] = (...args: unknown[]) =>
          (x as (...a: unknown[]) => unknown).apply(info.languageService, args);
      }
    }

    return proxy;
  }

  return { create };
}

module.exports = init;
