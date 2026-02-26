// oxlint-disable typescript/unbound-method
/**
 * TypeScript Language Service plugin that integrates @typed/virtual-modules.
 * Resolves virtual modules (e.g. virtual:foo) during editor type-checking.
 *
 * Preferred setup:
 * 1) Define options in typed.config.ts in the project root.
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
 * Use the package name; path-style names (e.g. "../") often fail when the workspace
 * root is a monorepo parent.
 *
 * Plugin definitions are loaded from typed.config.ts.
 */
import {
  attachLanguageServiceAdapter,
  collectTypeTargetSpecsFromPlugins,
  createTypeInfoApiSession,
  ensureTypeTargetBootstrapFile,
  getProgramWithTypeTargetBootstrap,
  getTypeTargetBootstrapPath,
  PluginManager,
  // @ts-expect-error It's ESM being imported by CJS
} from "@typed/virtual-modules";
import {
  loadTypedConfig,
  createRouterVirtualModulePlugin,
  createHttpApiVirtualModulePlugin,
  // @ts-expect-error It's ESM being imported by CJS
} from "@typed/app";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts, { DirectoryWatcherCallback, FileWatcherCallback } from "typescript";
import type { PluginCreateInfo } from "./types.js";

interface VirtualModulesTsPluginConfig {
  readonly debounceMs?: number;
  readonly configPath?: string;
}

type LoadedVirtualResolver = import(
  "@typed/virtual-modules",
  { with: { "resolution-mode": "import" } }
).VirtualModuleResolver;

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

function createFallbackProgram(
  tsMod: typeof import("typescript"),
  projectRoot: string,
  log: (msg: string) => void,
  tsconfigPath?: string,
  typeTargetSpecs?: ReadonlyArray<
    import("@typed/virtual-modules", { with: { "resolution-mode": "import" } }).TypeTargetSpec
  >,
): import("typescript").Program | undefined {
  const configPath = tsconfigPath ?? findTsconfig(projectRoot);
  if (!configPath) {
    log(`fallback program: no tsconfig found from ${projectRoot}`);
    return undefined;
  }
  try {
    const configFile = tsMod.readConfigFile(configPath, tsMod.sys.readFile);
    if (configFile.error) {
      log(`fallback program: tsconfig read error: ${configFile.error.messageText}`);
      return undefined;
    }
    const configDir = dirname(configPath);
    const parsed = tsMod.parseJsonConfigFileContent(
      configFile.config,
      tsMod.sys,
      configDir,
      undefined,
      configPath,
    );
    if (parsed.errors.length > 0) {
      log(
        `fallback program: tsconfig parse errors: ${parsed.errors.map((e) => e.messageText).join(", ")}`,
      );
      return undefined;
    }
    let rootNames = parsed.fileNames;
    if (typeTargetSpecs && typeTargetSpecs.length > 0) {
      ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs);
      const bootstrapPath = getTypeTargetBootstrapPath(projectRoot);
      rootNames = [...rootNames, bootstrapPath];
      log(`fallback program: added bootstrap ${bootstrapPath}`);
    }
    const program = tsMod.createProgram(
      rootNames,
      parsed.options,
      tsMod.createCompilerHost(parsed.options),
    );
    log(`fallback program: created with ${rootNames.length} root files`);
    return program;
  } catch (err) {
    log(`fallback program: exception: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}

function init(modules: { typescript: typeof import("typescript") }): {
  create: (info: PluginCreateInfo) => import("typescript").LanguageService;
} {
  const ts = modules.typescript;

  function create(info: PluginCreateInfo) {
    const config = (info.config ?? {}) as VirtualModulesTsPluginConfig;
    const logger = (
      info.project as { projectService?: { logger?: { info?: (s: string) => void } } }
    )?.projectService?.logger;
    const log = (msg: string) => logger?.info?.(`[@typed/virtual-modules-ts-plugin] ${msg}`);

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

    log(`create: projectRoot=${projectRoot}`);

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
      log("Ignoring invalid debounceMs; expected finite number");
    }
    const configPath =
      typeof config.configPath === "string" && config.configPath.trim().length > 0
        ? config.configPath
        : undefined;

    const loadedConfig = loadTypedConfig({
      projectRoot,
      ts,
      ...(configPath ? { configPath } : {}),
    });
    log(`typed.config: status=${loadedConfig.status}`);
    if (loadedConfig.status === "error") {
      log(`config error: ${loadedConfig.message}`);
    }

    const typedConfig = loadedConfig.status === "loaded" ? loadedConfig.config : undefined;

    const plugins = [
      createRouterVirtualModulePlugin(
        typedConfig?.router ? { prefix: typedConfig.router.prefix } : {},
      ),
      createHttpApiVirtualModulePlugin(
        typedConfig?.api
          ? { prefix: typedConfig.api.prefix, pathPrefix: typedConfig.api.pathPrefix }
          : {},
      ),
    ];
    const resolver: LoadedVirtualResolver = new PluginManager(
      plugins,
    ) as unknown as LoadedVirtualResolver;

    log("Virtual module resolver initialized from typed.config.ts");

    const typeTargetSpecs = collectTypeTargetSpecsFromPlugins(plugins);
    log(`typeTargetSpecs: ${typeTargetSpecs.length} specs`);

    const projectConfigPath = (info.project as { configFilePath?: string }).configFilePath;
    const tsconfigPath =
      typeof projectConfigPath === "string" && projectConfigPath.length > 0
        ? projectConfigPath
        : undefined;

    let cachedFallbackProgram: ts.Program | undefined = createFallbackProgram(
      ts,
      projectRoot,
      log,
      tsconfigPath,
      typeTargetSpecs,
    );

    // Pre-validate that TypeInfoApiSession can be created from the fallback program.
    // This catches issues early (missing type targets, checker errors) and caches the result.
    let preCreatedSession: ReturnType<typeof createTypeInfoApiSession> | undefined;
    if (cachedFallbackProgram) {
      try {
        const programWithBootstrap = getProgramWithTypeTargetBootstrap(
          ts,
          cachedFallbackProgram,
          projectRoot,
          typeTargetSpecs,
        );
        preCreatedSession = createTypeInfoApiSession({
          ts,
          program: programWithBootstrap,
          ...(typeTargetSpecs.length > 0
            ? { typeTargetSpecs, failWhenNoTargetsResolved: false }
            : {}),
        });
        log("pre-created TypeInfoApiSession OK");
      } catch (err) {
        log(
          `pre-created TypeInfoApiSession failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const getProgramForTypeInfo = (): ts.Program | undefined => {
      const fromLS = info.languageService.getProgram();
      if (fromLS !== undefined) return fromLS;
      const projectLike = info.project as { getProgram?: () => ts.Program };
      const fromProject = projectLike.getProgram?.();
      if (fromProject !== undefined) return fromProject;
      if (cachedFallbackProgram !== undefined) return cachedFallbackProgram;
      const fallback = createFallbackProgram(ts, projectRoot, log, tsconfigPath, typeTargetSpecs);
      if (fallback !== undefined) cachedFallbackProgram = fallback;
      return fallback;
    };

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

        // Prefer the LS/project program once available, but fall back to the
        // pre-created session from the fallback program.
        const program = getProgramForTypeInfo();
        if (program === undefined) {
          if (preCreatedSession) {
            session = preCreatedSession;
            return session;
          }
          log(`getSession: no program available for ${_id}`);
          throw new Error(
            "TypeInfo session creation failed: Program not yet available. Retry when project is loaded.",
          );
        }

        try {
          const programWithBootstrap = getProgramWithTypeTargetBootstrap(
            ts,
            program,
            projectRoot,
            typeTargetSpecs,
          );
          session = createTypeInfoApiSession({
            ts,
            program: programWithBootstrap,
            ...(typeTargetSpecs.length > 0
              ? { typeTargetSpecs, failWhenNoTargetsResolved: false }
              : {}),
          });
        } catch (err) {
          // If session creation from the real program fails, fall back to the
          // pre-created session (from the fallback program).
          if (preCreatedSession) {
            log(
              `getSession: real program session failed, using pre-created session: ${err instanceof Error ? err.message : String(err)}`,
            );
            session = preCreatedSession;
            return session;
          }
          throw err;
        }
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
          resolveExport: (baseDir: string, filePath: string, exportName: string) => {
            apiUsed = true;
            return getSession().api.resolveExport(baseDir, filePath, exportName);
          },
          isAssignableTo: (node: unknown, targetId: string, projection?: readonly unknown[]) => {
            apiUsed = true;
            return getSession().api.isAssignableTo(node as never, targetId, projection as never);
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

    // Force program rebuild so resolution uses our patched host.
    const projectWithDirty = info.project as {
      markAsDirty?: () => void;
      invalidateResolutionsOfFailedLookupLocations?: () => void;
    };
    if (typeof projectWithDirty.invalidateResolutionsOfFailedLookupLocations === "function") {
      projectWithDirty.invalidateResolutionsOfFailedLookupLocations();
    } else if (typeof projectWithDirty.markAsDirty === "function") {
      projectWithDirty.markAsDirty();
    }

    // Schedule a deferred invalidation: if any virtual modules failed during the initial
    // graph build (e.g., TypeInfoApi not ready yet), this second pass picks them up after
    // the program is fully built.
    setTimeout(() => {
      log("deferred retry: invalidating failed lookups");
      if (typeof projectWithDirty.invalidateResolutionsOfFailedLookupLocations === "function") {
        projectWithDirty.invalidateResolutionsOfFailedLookupLocations();
      }
      if (typeof projectWithDirty.markAsDirty === "function") {
        projectWithDirty.markAsDirty();
      }
    }, 200);

    return info.languageService;
  }

  return { create };
}

module.exports = init;
