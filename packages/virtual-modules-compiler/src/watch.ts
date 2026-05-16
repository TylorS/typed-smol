import { mkdirSync } from "node:fs";
import type * as ts from "typescript";
import type {
  CreateTypeInfoApiSession,
  LanguageServiceWatchHost,
  LoadedVmcPluginModule,
  TypeTargetSpec,
  VirtualArtifactStoreFactory,
  VirtualModuleAdapterHandle,
  VirtualModuleResolver,
} from "@typed/virtual-modules";
import {
  attachCompilerHostAdapter,
  createTypeInfoApiSessionFactory,
  ensureTypeTargetBootstrapFile,
} from "@typed/virtual-modules";
import { createVmcArtifactStoreFactory } from "./artifactStore.js";

export interface WatchParams {
  readonly ts: typeof import("typescript");
  readonly commandLine: ts.ParsedCommandLine;
  readonly resolver: VirtualModuleResolver;
  readonly vmcConfigPath?: string;
  readonly vmcConfigDependencyPaths?: readonly string[];
  readonly pluginModules?: readonly LoadedVmcPluginModule[];
  readonly reloadResolver?: () => WatchResolverState;
  readonly reportDiagnostic: ts.DiagnosticReporter;
  readonly reportWatchStatus?: ts.WatchStatusReporter;
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

export interface WatchResolverState {
  readonly resolver: VirtualModuleResolver;
  readonly vmcConfigPath?: string;
  readonly vmcConfigDependencyPaths?: readonly string[];
  readonly pluginModules?: readonly LoadedVmcPluginModule[];
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

/**
 * Run the compiler in watch mode. Mirrors tsc --watch.
 */
export function runWatch(params: WatchParams): void {
  const {
    ts,
    commandLine,
    resolver,
    vmcConfigPath,
    vmcConfigDependencyPaths,
    pluginModules,
    reloadResolver,
    reportDiagnostic,
    reportWatchStatus,
    typeTargetSpecs,
  } = params;
  const { options, fileNames, projectReferences, watchOptions } = commandLine;

  const sys = ts.sys;
  if (!sys) {
    reportDiagnostic(
      createDiagnostic(ts, ts.DiagnosticCategory.Error, 0, 0, "ts.sys is not available."),
    );
    process.exit(1);
  }

  const projectRoot = sys.getCurrentDirectory();
  const watchHost = createAdapterWatchHost(sys);

  let effectiveFileNames = fileNames;
  if (typeTargetSpecs && typeTargetSpecs.length > 0) {
    const bootstrapPath = ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs, {
      mkdirSync,
      writeFile: (path, content) => sys.writeFile(path, content),
    });
    effectiveFileNames = fileNames.includes(bootstrapPath)
      ? fileNames
      : [...fileNames, bootstrapPath];
  }

  let activeAdapter: VirtualModuleAdapterHandle | undefined;
  let activeHost: ts.CompilerHost | undefined;
  let currentTypeInfoFactory: CreateTypeInfoApiSession | undefined;
  let currentArtifactStoreFactory: VirtualArtifactStoreFactory | undefined;
  let currentResolver = resolver;
  let currentVmcConfigPath = vmcConfigPath;
  let currentVmcConfigDependencyPaths = vmcConfigDependencyPaths;
  let currentPluginModules = pluginModules;
  let currentTypeTargetSpecs = typeTargetSpecs;
  const resolverProxy: VirtualModuleResolver = {
    resolveModule: (resolveOptions) => currentResolver.resolveModule(resolveOptions),
    resolvePluginName: (resolveOptions) =>
      currentResolver.resolvePluginName?.(resolveOptions) ?? { status: "unresolved" },
  };
  const inputWatchers = new Map<string, ts.FileWatcher>();
  let watchProgram:
    | ts.WatchOfFilesAndCompilerOptions<ts.EmitAndSemanticDiagnosticsBuilderProgram>
    | undefined;

  const triggerInputChangeRebuild = (): void => {
    activeAdapter?.invalidateAll?.();
    watchProgram?.updateRootFileNames([...effectiveFileNames]);
  };

  const syncInputWatchers = (): void => {
    const nextPaths = new Set(
      getWatchInputPaths(
        currentVmcConfigPath,
        currentVmcConfigDependencyPaths,
        currentPluginModules,
      ),
    );

    for (const [path, watcher] of inputWatchers) {
      if (!nextPaths.has(path)) {
        watcher.close();
        inputWatchers.delete(path);
      }
    }

    if (!sys.watchFile) return;
    for (const path of nextPaths) {
      if (inputWatchers.has(path)) continue;
      inputWatchers.set(
        path,
        sys.watchFile(
          path,
          () => {
            triggerInputChangeRebuild();
          },
          undefined,
          watchOptions,
        ),
      );
    }
  };

  const createProgram: ts.CreateProgram<ts.EmitAndSemanticDiagnosticsBuilderProgram> = (
    rootNames,
    opts,
    host,
    oldProgram,
    configFileParsingDiagnostics,
    refs,
  ) => {
    if (!host) {
      host = ts.createCompilerHost(opts ?? options);
    }
    const resolverState = reloadResolver?.();
    if (resolverState) {
      currentResolver = resolverState.resolver;
      currentVmcConfigPath = resolverState.vmcConfigPath;
      currentVmcConfigDependencyPaths = resolverState.vmcConfigDependencyPaths;
      currentPluginModules = resolverState.pluginModules;
      currentTypeTargetSpecs = resolverState.typeTargetSpecs;
    }
    syncInputWatchers();
    const currentRootNames = rootNames ?? effectiveFileNames;
    const currentOptions = opts ?? options;
    const preliminaryHost = ts.createCompilerHost(currentOptions);
    const preliminaryProgram = ts.createProgram({
      rootNames: currentRootNames,
      options: currentOptions,
      host: preliminaryHost,
      projectReferences: refs ?? projectReferences,
    });
    const createTypeInfoApiSession = createTypeInfoApiSessionFactory({
      ts,
      program: preliminaryProgram,
      ...(currentTypeTargetSpecs?.length ? { typeTargetSpecs: currentTypeTargetSpecs } : {}),
    });
    currentTypeInfoFactory = createTypeInfoApiSession;
    const artifactStoreFactory = createVmcArtifactStoreFactory({
      ts,
      commandLine,
      resolver: currentResolver,
      vmcConfigPath: currentVmcConfigPath,
      vmcConfigDependencyPaths: currentVmcConfigDependencyPaths,
      pluginModules: currentPluginModules,
      projectRoot,
      rootNames: currentRootNames,
      ...(currentTypeTargetSpecs?.length ? { typeTargetSpecs: currentTypeTargetSpecs } : {}),
    });
    currentArtifactStoreFactory = artifactStoreFactory;
    if (activeHost !== host) {
      activeAdapter?.dispose();
      activeAdapter = undefined;
      activeHost = host;
    } else {
      activeAdapter?.invalidateAll?.();
    }
    if (!activeAdapter) {
      activeAdapter = attachCompilerHostAdapter({
        ts,
        compilerHost: host,
        resolver: resolverProxy,
        projectRoot,
        createTypeInfoApiSession: (sessionParams) => currentTypeInfoFactory!(sessionParams),
        artifactStoreFactory: (context) => currentArtifactStoreFactory!(context),
        ...(watchHost ? { watchHost } : {}),
        reportDiagnostic,
      });
    }

    return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      currentRootNames,
      currentOptions,
      host,
      oldProgram,
      configFileParsingDiagnostics,
      refs ?? projectReferences,
    );
  };

  const host = ts.createWatchCompilerHost(
    effectiveFileNames,
    options,
    sys,
    createProgram,
    reportDiagnostic,
    reportWatchStatus,
    projectReferences,
    watchOptions,
  );

  watchProgram = ts.createWatchProgram(host);
  syncInputWatchers();
}

function getWatchInputPaths(
  vmcConfigPath: string | undefined,
  vmcConfigDependencyPaths: readonly string[] | undefined,
  pluginModules: readonly LoadedVmcPluginModule[] | undefined,
): readonly string[] {
  return [
    ...(vmcConfigPath ? [vmcConfigPath] : []),
    ...(vmcConfigDependencyPaths ?? []),
    ...(pluginModules ?? []).flatMap((pluginModule) => [
      pluginModule.resolvedPath,
      ...pluginModule.dependencyPaths,
    ]),
  ];
}

function createAdapterWatchHost(sys: ts.System): LanguageServiceWatchHost | undefined {
  const watchHost: LanguageServiceWatchHost = {};
  if (sys.watchFile) {
    watchHost.watchFile = sys.watchFile.bind(sys);
  }
  if (sys.watchDirectory) {
    watchHost.watchDirectory = sys.watchDirectory.bind(sys);
  }
  return watchHost.watchFile || watchHost.watchDirectory ? watchHost : undefined;
}

function createDiagnostic(
  ts: typeof import("typescript"),
  category: ts.DiagnosticCategory,
  code: number,
  length: number,
  messageText: string,
): ts.Diagnostic {
  return { category, code, file: undefined, start: 0, length, messageText };
}
