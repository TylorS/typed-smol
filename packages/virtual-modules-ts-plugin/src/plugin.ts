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
 * Loads typed.config.ts for router/api options and merges vmc.config.ts plugins (same as vmc CLI).
 */
import {
  type ArtifactStoreFingerprints,
  attachLanguageServiceAdapter,
  collectTypeTargetSpecsFromPlugins,
  createParsedTsconfigFingerprint,
  createPluginConfigFingerprint,
  createPluginModuleFingerprint,
  createPluginPackageFingerprint,
  createTypeInfoApiSession,
  createTypeScriptFingerprint,
  createVirtualArtifactStore,
  ensureTypeTargetBootstrapFile,
  getProgramWithTypeTargetBootstrap,
  getTypeTargetBootstrapPath,
  hashVirtualArtifactContent,
  hashVirtualArtifactJson,
  type LoadedVmcPluginModule,
  loadResolverFromVmcConfig,
  PluginManager,
  type VirtualArtifactFingerprint,
  type VirtualArtifactStoreFactory,
  type VirtualModuleRecord,
  type VirtualModulePlugin,
  type VirtualModuleResolver,
  // @ts-expect-error It's ESM being imported by CJS
} from "@typed/virtual-modules";
import {
  loadTypedConfig,
  createBrowserVirtualModulePlugin,
  createConfigVirtualModulePlugin,
  createEnvVirtualModulePlugin,
  createHtmlVirtualModulePlugin,
  createRouterVirtualModulePlugin,
  createHttpApiVirtualModulePlugin,
  createServerVirtualModulePlugin,
  // @ts-expect-error It's ESM being imported by CJS
} from "@typed/app";
import {
  getTemplateDiagnostics,
  // @ts-expect-error It's ESM being imported by CJS
} from "@typed/compiler";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts, { DirectoryWatcherCallback, FileWatcherCallback } from "typescript";
import type { PluginCreateInfo } from "./types.js";

interface VirtualModulesTsPluginConfig {
  readonly debounceMs?: number;
  /** Path to typed.config.ts (relative to project root or absolute). */
  readonly configPath?: string;
  /** Path to vmc.config.ts (relative to project root or absolute); default file name when omitted. */
  readonly vmcConfigPath?: string;
}

type LoadedVirtualResolver = import(
  "@typed/virtual-modules",
  { with: { "resolution-mode": "import" } }
).VirtualModuleResolver;

type LoadTypedConfigResult = ReturnType<typeof loadTypedConfig>;
type VmcLoadResult = ReturnType<typeof loadResolverFromVmcConfig>;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

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

function createTsPluginArtifactStoreFactory(options: {
  readonly ts: typeof import("typescript");
  readonly projectRoot: string;
  readonly languageServiceHost: import("typescript").LanguageServiceHost;
  readonly configPath?: string;
  readonly vmcConfigPath?: string;
  readonly tsconfigPath?: string;
  readonly typeTargetSpecs: ReadonlyArray<
    import("@typed/virtual-modules", { with: { "resolution-mode": "import" } }).TypeTargetSpec
  >;
  readonly loadedConfig: LoadTypedConfigResult;
  readonly typedConfig: unknown;
  readonly vmcLoad: VmcLoadResult;
  readonly resolver: VirtualModuleResolver;
  readonly mergedPlugins: readonly VirtualModulePlugin[];
}): {
  readonly artifactStoreFactory: VirtualArtifactStoreFactory;
  readonly shouldReuseRecord: (record: VirtualModuleRecord) => boolean;
  readonly onRecordResolved: (record: VirtualModuleRecord) => void;
} {
  const tokenByVirtualKey = new Map<string, string>();
  const dependencyTokenByVirtualKey = new Map<string, string>();
  const loadedTypedConfigToken = createTypedConfigComparisonToken(
    options.projectRoot,
    options.loadedConfig,
  );
  const loadedVmcConfigToken = createVmcConfigComparisonToken(options.projectRoot, options.vmcLoad);
  const createFingerprints = (): ArtifactStoreFingerprints =>
    createTsPluginArtifactFingerprints({
      ...options,
      loadedTypedConfigToken,
      loadedVmcConfigToken,
    });
  const createArtifactStoreContext = () => {
    const fingerprints = createFingerprints();
    return {
      fingerprints,
      resolverInputDriftReason: getResolverInputDriftReason(fingerprints),
      token: hashVirtualArtifactJson(fingerprints),
    };
  };
  return {
    artifactStoreFactory: ({ pluginName, virtualKey, projectRoot }) => {
      const context = createArtifactStoreContext();
      if (context.resolverInputDriftReason) {
        throw new Error(context.resolverInputDriftReason);
      }
      tokenByVirtualKey.set(virtualKey, context.token);
      return createVirtualArtifactStore({
        projectRoot,
        pluginName,
        virtualKey,
        fingerprints: context.fingerprints,
      });
    },
    shouldReuseRecord: (record) => {
      const context = createArtifactStoreContext();
      const dependencyToken = createDependencySnapshotToken(
        options.languageServiceHost,
        record.dependencies,
      );
      const previousDependencyToken = dependencyTokenByVirtualKey.get(record.key);
      if (previousDependencyToken === undefined) {
        dependencyTokenByVirtualKey.set(record.key, dependencyToken);
      }
      return (
        !context.resolverInputDriftReason &&
        tokenByVirtualKey.get(record.key) === context.token &&
        (previousDependencyToken === undefined || previousDependencyToken === dependencyToken)
      );
    },
    onRecordResolved: (record) => {
      dependencyTokenByVirtualKey.set(
        record.key,
        createDependencySnapshotToken(options.languageServiceHost, record.dependencies),
      );
    },
  };
}

function getResolverInputDriftReason(fingerprints: ArtifactStoreFingerprints): string | undefined {
  const driftFingerprint = (fingerprints.pluginFingerprints ?? []).find(
    (fingerprint) =>
      fingerprint.unavailableReason !== undefined &&
      (fingerprint.name === "typed.config.ts:current-state" ||
        fingerprint.name === "vmc.config.ts:current-state"),
  );
  return driftFingerprint?.unavailableReason
    ? `TS plugin resolver inputs changed after startup: ${driftFingerprint.unavailableReason}. Restart TypeScript or recreate the language service before materializing virtual artifacts.`
    : undefined;
}

function createTsPluginArtifactFingerprints(options: {
  readonly ts: typeof import("typescript");
  readonly projectRoot: string;
  readonly languageServiceHost: import("typescript").LanguageServiceHost;
  readonly configPath?: string;
  readonly vmcConfigPath?: string;
  readonly tsconfigPath?: string;
  readonly typeTargetSpecs: ReadonlyArray<
    import("@typed/virtual-modules", { with: { "resolution-mode": "import" } }).TypeTargetSpec
  >;
  readonly loadedConfig: LoadTypedConfigResult;
  readonly typedConfig: unknown;
  readonly vmcLoad: VmcLoadResult;
  readonly resolver: VirtualModuleResolver;
  readonly mergedPlugins: readonly VirtualModulePlugin[];
  readonly loadedTypedConfigToken: string;
  readonly loadedVmcConfigToken: string;
}): ArtifactStoreFingerprints {
  const parsedTsconfig = parseTsconfigForFingerprint(options);
  const currentTypedConfig = loadTypedConfig({
    projectRoot: options.projectRoot,
    ts: options.ts,
    ...(options.configPath ? { configPath: options.configPath } : {}),
  });
  const currentVmcLoad = loadResolverFromVmcConfig({
    projectRoot: options.projectRoot,
    ts: options.ts,
    ...(options.vmcConfigPath
      ? { configPath: options.vmcConfigPath }
      : options.vmcLoad.status === "loaded"
        ? { configPath: options.vmcLoad.path }
        : {}),
  });
  return {
    sourceInputFingerprints: [createDependencyScopedSourceInputFingerprint()],
    pluginFingerprints: [
      ...createTypedConfigFingerprints(
        options.projectRoot,
        currentTypedConfig,
        options.loadedTypedConfigToken,
      ),
      ...createVmcConfigFingerprints(
        options.projectRoot,
        currentVmcLoad,
        options.loadedVmcConfigToken,
      ),
      ...createVmcConfigDependencyFingerprints(currentVmcLoad),
      ...createPluginModuleFingerprints(options.projectRoot, currentVmcLoad),
      createPluginConfigFingerprint("ts-plugin-resolver", createResolverSnapshot(options)),
    ],
    compilerFingerprints: [
      createTypeScriptFingerprint(options.ts.version),
      parsedTsconfig.fingerprint,
    ],
  };
}

function parseTsconfigForFingerprint(options: {
  readonly ts: typeof import("typescript");
  readonly projectRoot: string;
  readonly tsconfigPath?: string;
}): {
  readonly fingerprint: VirtualArtifactFingerprint;
} {
  if (!options.tsconfigPath) {
    return {
      fingerprint: createUnavailableFingerprint(
        "tsconfig",
        "parsed-tsconfig",
        "Parsed tsconfig is unavailable: no tsconfig path was available from the TS project",
      ),
    };
  }

  const configFile = options.ts.readConfigFile(options.tsconfigPath, options.ts.sys.readFile);
  if (configFile.error) {
    return {
      fingerprint: createUnavailableFingerprint(
        "tsconfig",
        "parsed-tsconfig",
        `Parsed tsconfig is unavailable: ${String(configFile.error.messageText)}`,
      ),
    };
  }

  const parsed = options.ts.parseJsonConfigFileContent(
    configFile.config,
    options.ts.sys,
    dirname(options.tsconfigPath),
    undefined,
    options.tsconfigPath,
  );
  if (parsed.errors.length > 0) {
    return {
      fingerprint: createUnavailableFingerprint(
        "tsconfig",
        "parsed-tsconfig",
        `Parsed tsconfig is unavailable: ${parsed.errors.map((e) => String(e.messageText)).join(", ")}`,
      ),
    };
  }

  return {
    fingerprint: createParsedTsconfigFingerprint({
      fileNames: parsed.fileNames.map((file) => relative(options.projectRoot, file)).sort(),
      options: toJsonValue(parsed.options),
      projectReferences: toJsonValue(parsed.projectReferences ?? []),
      watchOptions: toJsonValue(parsed.watchOptions ?? {}),
      raw: toJsonValue(parsed.raw ?? {}),
    }),
  };
}

function createDependencyScopedSourceInputFingerprint(): VirtualArtifactFingerprint {
  return {
    kind: "source",
    name: "ts-plugin-source-inputs",
    hash: hashVirtualArtifactContent("dependency-descriptor-scoped"),
  };
}

function createDependencySnapshotToken(
  languageServiceHost: import("typescript").LanguageServiceHost,
  dependencies: VirtualModuleRecord["dependencies"],
): string {
  return hashVirtualArtifactJson(
    dependencies.map((dependency) => {
      if (dependency.type !== "file") return dependency;
      const snapshot = languageServiceHost.getScriptSnapshot?.(dependency.path);
      if (snapshot) {
        return {
          ...dependency,
          hash: hashVirtualArtifactContent(snapshot.getText(0, snapshot.getLength())),
        };
      }
      try {
        return {
          ...dependency,
          hash: hashVirtualArtifactContent(readFileSync(dependency.path)),
        };
      } catch {
        return {
          ...dependency,
          unavailableReason: "dependency source unavailable",
        };
      }
    }),
  );
}

function createTypedConfigFingerprints(
  projectRoot: string,
  currentConfig: LoadTypedConfigResult,
  loadedConfigToken: string,
): readonly VirtualArtifactFingerprint[] {
  const currentFingerprint = createTypedConfigStateFingerprint(
    projectRoot,
    currentConfig,
    "current",
  );
  const changedFingerprint =
    loadedConfigToken !== createTypedConfigComparisonToken(projectRoot, currentConfig)
      ? [
          createUnavailableFingerprint(
            "config",
            "typed.config.ts:current-state",
            "typed.config.ts changed after the TS plugin resolver was created",
          ),
        ]
      : [];

  if (currentConfig.status === "loaded") {
    return [
      currentFingerprint,
      createUnavailableFingerprint(
        "config",
        "typed.config.ts:dependencies",
        "typed.config.ts dependency module fingerprints are unavailable in the TS plugin",
      ),
      ...changedFingerprint,
    ];
  }
  return [currentFingerprint, ...changedFingerprint];
}

function createTypedConfigComparisonToken(
  projectRoot: string,
  config: LoadTypedConfigResult,
): string {
  return hashVirtualArtifactJson(createTypedConfigStateFingerprint(projectRoot, config, "compare"));
}

function createTypedConfigStateFingerprint(
  projectRoot: string,
  config: LoadTypedConfigResult,
  label: "compare" | "current" | "loaded",
): VirtualArtifactFingerprint {
  if (config.status === "loaded") {
    return createConfigFileFingerprint(
      `typed.config.ts:${label}`,
      config.path,
      `Unable to read typed.config.ts: ${config.path}`,
    );
  }
  return createPluginConfigFingerprint(`typed.config.ts:${label}`, {
    status: config.status,
    path:
      config.status === "error" && config.path
        ? relative(projectRoot, config.path)
        : "typed.config.ts",
    message: config.status === "error" ? config.message : undefined,
  });
}

function createVmcConfigFingerprints(
  projectRoot: string,
  vmcLoad: VmcLoadResult,
  loadedConfigToken: string,
): readonly VirtualArtifactFingerprint[] {
  const currentFingerprint = createVmcConfigStateFingerprint(projectRoot, vmcLoad, "current");
  const changedFingerprint =
    loadedConfigToken !== createVmcConfigComparisonToken(projectRoot, vmcLoad)
      ? [
          createUnavailableFingerprint(
            "config",
            "vmc.config.ts:current-state",
            "vmc.config.ts or loaded VMC plugin modules changed after the TS plugin resolver was created",
          ),
        ]
      : [];
  return [currentFingerprint, ...changedFingerprint];
}

function createVmcConfigComparisonToken(projectRoot: string, vmcLoad: VmcLoadResult): string {
  return hashVirtualArtifactJson([
    createVmcConfigStateFingerprint(projectRoot, vmcLoad, "compare"),
    ...createVmcConfigDependencyFingerprints(vmcLoad),
    ...createPluginModuleFingerprints(projectRoot, vmcLoad),
    createPluginConfigFingerprint("vmc.config.ts:load-snapshot", createVmcLoadSnapshot(vmcLoad)),
  ]);
}

function createVmcConfigStateFingerprint(
  projectRoot: string,
  vmcLoad: VmcLoadResult,
  label: "compare" | "current" | "loaded",
): VirtualArtifactFingerprint {
  if (vmcLoad.status === "loaded") {
    return createConfigFileFingerprint(
      `vmc.config.ts:${label}`,
      vmcLoad.path,
      `Unable to read vmc.config.ts: ${vmcLoad.path}`,
    );
  }
  return createPluginConfigFingerprint(`vmc.config.ts:${label}`, {
    status: vmcLoad.status,
    path:
      vmcLoad.status === "error" && vmcLoad.path
        ? relative(projectRoot, vmcLoad.path)
        : "vmc.config.ts",
    message: vmcLoad.status === "error" ? vmcLoad.message : undefined,
  });
}

function createConfigFileFingerprint(
  name: string,
  filePath: string,
  unavailableReason: string,
): VirtualArtifactFingerprint {
  try {
    return {
      kind: "config",
      name,
      hash: hashVirtualArtifactContent(readFileSync(filePath)),
    };
  } catch {
    return createUnavailableFingerprint("config", name, unavailableReason);
  }
}

function createVmcConfigDependencyFingerprints(
  vmcLoad: VmcLoadResult,
): readonly VirtualArtifactFingerprint[] {
  return vmcLoad.status === "loaded"
    ? vmcLoad.configDependencyPaths.map((dependencyPath) =>
        createPluginModuleFingerprint(`vmc.config:${dependencyPath}`, dependencyPath),
      )
    : [];
}

function createPluginModuleFingerprints(
  projectRoot: string,
  vmcLoad: VmcLoadResult,
): readonly VirtualArtifactFingerprint[] {
  return vmcLoad.status === "loaded"
    ? vmcLoad.pluginModules.flatMap((pluginModule) => [
        createPluginModuleFingerprint(pluginModule.pluginName, pluginModule.resolvedPath),
        ...pluginModule.dependencyPaths.map((dependencyPath) =>
          createPluginModuleFingerprint(
            `${pluginModule.pluginName}:${dependencyPath}`,
            dependencyPath,
          ),
        ),
        ...createPluginPackageFingerprints(projectRoot, pluginModule),
      ])
    : [];
}

function createPluginPackageFingerprints(
  projectRoot: string,
  pluginModule: LoadedVmcPluginModule,
): readonly VirtualArtifactFingerprint[] {
  const packageJsonPath = findPackageJson(projectRoot, dirname(pluginModule.resolvedPath));
  if (!packageJsonPath) return [];

  const metadata = readPackageMetadata(packageJsonPath);
  if (!metadata?.version) return [];

  return [createPluginPackageFingerprint(metadata.name, metadata.version)];
}

function findPackageJson(projectRoot: string, startDir: string): string | undefined {
  let current = startDir;
  while (current.startsWith(projectRoot)) {
    const candidate = join(current, "package.json");
    if (existsSync(candidate)) return candidate;

    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
  return undefined;
}

function readPackageMetadata(
  packageJsonPath: string,
): { readonly name: string; readonly version?: string } | undefined {
  try {
    const metadata = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      readonly name?: unknown;
      readonly version?: unknown;
    };
    return typeof metadata.name === "string" && metadata.name.length > 0
      ? {
          name: metadata.name,
          ...(typeof metadata.version === "string" ? { version: metadata.version } : {}),
        }
      : undefined;
  } catch {
    return undefined;
  }
}

function createResolverSnapshot(options: {
  readonly typedConfig: unknown;
  readonly vmcLoad: VmcLoadResult;
  readonly resolver: VirtualModuleResolver;
  readonly mergedPlugins: readonly VirtualModulePlugin[];
  readonly typeTargetSpecs: ReadonlyArray<
    import("@typed/virtual-modules", { with: { "resolution-mode": "import" } }).TypeTargetSpec
  >;
}): JsonValue {
  return {
    typedConfig: createTypedConfigSnapshot(options.typedConfig),
    vmcConfig: createVmcLoadSnapshot(options.vmcLoad),
    plugins: options.mergedPlugins.map((plugin) => ({
      name: plugin.name,
      shouldResolve: plugin.shouldResolve.toString(),
      build: plugin.build.toString(),
      typeTargetSpecs: toJsonValue(plugin.typeTargetSpecs ?? []),
    })),
    hasResolveModule: typeof options.resolver.resolveModule === "function",
    hasResolvePluginName: typeof options.resolver.resolvePluginName === "function",
    typeTargetSpecs: toJsonValue(options.typeTargetSpecs),
  };
}

function createTypedConfigSnapshot(typedConfig: unknown): JsonValue {
  const config = typedConfig as
    | {
        readonly router?: { readonly prefix?: unknown };
        readonly api?: { readonly prefix?: unknown; readonly pathPrefix?: unknown };
      }
    | undefined;
  return {
    router: { prefix: toJsonValue(config?.router?.prefix) },
    api: {
      prefix: toJsonValue(config?.api?.prefix),
      pathPrefix: toJsonValue(config?.api?.pathPrefix),
    },
  };
}

function mergePluginsByName(
  primary: readonly VirtualModulePlugin[],
  fallback: readonly VirtualModulePlugin[],
): readonly VirtualModulePlugin[] {
  const seen = new Set<string>();
  const result: VirtualModulePlugin[] = [];
  for (const plugin of [...primary, ...fallback]) {
    if (seen.has(plugin.name)) continue;
    seen.add(plugin.name);
    result.push(plugin);
  }
  return result;
}

function createVmcLoadSnapshot(vmcLoad: VmcLoadResult): JsonValue {
  if (vmcLoad.status !== "loaded") {
    return {
      status: vmcLoad.status,
      path: vmcLoad.status === "error" ? (vmcLoad.path ?? null) : null,
      message: vmcLoad.status === "error" ? vmcLoad.message : null,
    };
  }
  return {
    status: vmcLoad.status,
    path: vmcLoad.path,
    pluginSpecifiers: vmcLoad.pluginSpecifiers,
    pluginModules: vmcLoad.pluginModules.map((pluginModule) => ({
      specifier: pluginModule.specifier,
      pluginName: pluginModule.pluginName,
      resolvedPath: pluginModule.resolvedPath,
      dependencyPaths: pluginModule.dependencyPaths,
    })),
    pluginLoadErrors: vmcLoad.pluginLoadErrors.map((error) => ({
      specifier: error.specifier,
      code: error.code,
      message: error.message,
    })),
  };
}

function createUnavailableFingerprint(
  kind: VirtualArtifactFingerprint["kind"],
  name: string,
  unavailableReason: string,
): VirtualArtifactFingerprint {
  return { kind, name, unavailableReason };
}

function toJsonValue(value: unknown): JsonValue {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value !== "object") return String(value);

  const entries = Object.entries(value)
    .filter(([, item]) => typeof item !== "function" && typeof item !== "symbol")
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries.map(([key, item]) => [key, toJsonValue(item)]));
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

    const builtInPlugins = [
      createRouterVirtualModulePlugin(
        typedConfig?.router ? { prefix: typedConfig.router.prefix } : {},
      ),
      createHttpApiVirtualModulePlugin(
        typedConfig?.api
          ? { prefix: typedConfig.api.prefix, pathPrefix: typedConfig.api.pathPrefix }
          : {},
      ),
      createEnvVirtualModulePlugin(),
      createConfigVirtualModulePlugin({
        loadConfig: () => loadedConfig,
      }),
      createHtmlVirtualModulePlugin(),
      createServerVirtualModulePlugin(),
      createBrowserVirtualModulePlugin(),
    ];

    const vmcConfigPathOpt =
      typeof config.vmcConfigPath === "string" && config.vmcConfigPath.trim().length > 0
        ? config.vmcConfigPath.trim()
        : undefined;

    const vmcLoad = loadResolverFromVmcConfig({
      projectRoot,
      ts,
      ...(vmcConfigPathOpt ? { configPath: vmcConfigPathOpt } : {}),
    });

    if (vmcLoad.status === "loaded" && vmcLoad.pluginLoadErrors.length > 0) {
      for (const err of vmcLoad.pluginLoadErrors) {
        log(`vmc plugin load error: ${err.specifier}: ${err.message}`);
      }
    }

    const vmcPlugins =
      vmcLoad.status === "loaded" && vmcLoad.resolver instanceof PluginManager
        ? [...vmcLoad.resolver.plugins]
        : [];

    const mergedPlugins = mergePluginsByName(vmcPlugins, builtInPlugins);
    const resolver: LoadedVirtualResolver = new PluginManager(
      mergedPlugins,
    ) as unknown as LoadedVirtualResolver;

    log(
      `Virtual module resolver: vmc.config=${vmcLoad.status}, vmcPlugins=${vmcPlugins.length}, builtIns=${builtInPlugins.length}`,
    );

    const typeTargetSpecs = collectTypeTargetSpecsFromPlugins(mergedPlugins);
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
    const artifactStore = createTsPluginArtifactStoreFactory({
      ts,
      projectRoot,
      languageServiceHost: info.project as import("typescript").LanguageServiceHost,
      ...(configPath ? { configPath } : {}),
      ...(vmcConfigPathOpt ? { vmcConfigPath: vmcConfigPathOpt } : {}),
      tsconfigPath,
      typeTargetSpecs,
      loadedConfig,
      typedConfig,
      vmcLoad,
      resolver,
      mergedPlugins,
    });

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
      artifactStoreFactory: artifactStore.artifactStoreFactory,
      shouldReuseRecord: artifactStore.shouldReuseRecord,
      onRecordResolved: artifactStore.onRecordResolved,
      watchHost,
      debounceMs,
    });
    attachTemplateDiagnostics({
      ts,
      languageService: info.languageService,
      languageServiceHost: info.project as import("typescript").LanguageServiceHost,
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

function attachTemplateDiagnostics(options: {
  readonly ts: typeof import("typescript");
  readonly languageService: import("typescript").LanguageService;
  readonly languageServiceHost: import("typescript").LanguageServiceHost;
}): void {
  const originalGetSemanticDiagnostics =
    options.languageService.getSemanticDiagnostics.bind(options.languageService);
  options.languageService.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
    const diagnostics = originalGetSemanticDiagnostics(fileName);
    const sourceFile = options.languageService.getProgram()?.getSourceFile(fileName);
    const sourceText = getSourceText(options.languageServiceHost, fileName, sourceFile);
    if (sourceText === undefined) return diagnostics;
    return [
      ...diagnostics,
      ...getTemplateDiagnostics({
        moduleId: fileName,
        sourceFile,
        sourceText,
        ts: options.ts,
      }),
    ];
  };
}

function getSourceText(
  languageServiceHost: import("typescript").LanguageServiceHost,
  fileName: string,
  sourceFile: import("typescript").SourceFile | undefined,
): string | undefined {
  if (sourceFile) return sourceFile.text;
  const snapshot = languageServiceHost.getScriptSnapshot?.(fileName);
  return snapshot?.getText(0, snapshot.getLength());
}
