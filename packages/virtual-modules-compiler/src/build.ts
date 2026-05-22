import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type * as ts from "typescript";
import type {
  LoadedVmcPluginModule,
  TypeTargetSpec,
  VirtualModuleAdapterHandle,
  VirtualModuleResolver,
} from "@typed/virtual-modules";
import {
  attachCompilerHostAdapter,
  ensureTypeTargetBootstrapFile,
} from "@typed/virtual-modules";
import { createVmcArtifactStoreFactory } from "./artifactStore.js";
import { createLazyTypeInfoApiSession } from "./typeInfoSession.js";

function inferProjectRoot(
  sys: ts.System,
  opts: ts.CompilerOptions | undefined,
  rootNames: readonly string[] | undefined,
  fallback: string,
): string {
  const configFilePath = (opts as { readonly configFilePath?: unknown } | undefined)
    ?.configFilePath;
  if (typeof configFilePath === "string" && configFilePath.length > 0) {
    return dirname(configFilePath);
  }
  if (rootNames && rootNames.length > 0) {
    return dirname(rootNames[0]);
  }
  return fallback;
}

export interface BuildParams {
  readonly ts: typeof import("typescript");
  readonly buildCommand: ts.ParsedBuildCommand;
  readonly resolver: VirtualModuleResolver;
  readonly vmcConfigPath?: string;
  readonly vmcConfigDependencyPaths?: readonly string[];
  readonly pluginModules?: readonly LoadedVmcPluginModule[];
  readonly reportDiagnostic: ts.DiagnosticReporter;
  readonly reportSolutionBuilderStatus?: ts.DiagnosticReporter;
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

/**
 * Run the compiler in build mode (tsc -b). Mirrors tsc --build.
 */
export function runBuild(params: BuildParams): number {
  const {
    ts,
    buildCommand,
    resolver,
    vmcConfigPath,
    vmcConfigDependencyPaths,
    pluginModules,
    reportDiagnostic,
    reportSolutionBuilderStatus,
    typeTargetSpecs,
  } = params;
  const { projects, buildOptions } = buildCommand;

  const sys = ts.sys;
  if (!sys) {
    reportDiagnostic(
      createDiagnostic(ts, ts.DiagnosticCategory.Error, 0, 0, "ts.sys is not available."),
    );
    return 1;
  }

  const projectRoot = sys.getCurrentDirectory();
  const adapters: VirtualModuleAdapterHandle[] = [];

  const createProgramForSession = (
    rootNames: readonly string[],
    opts: ts.CompilerOptions,
  ): ts.Program => {
    const h = ts.createCompilerHost(opts ?? {});
    return ts.createProgram(rootNames, opts ?? {}, h);
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
      host = ts.createCompilerHost(opts ?? {});
    }
    const root = inferProjectRoot(sys, opts, rootNames, projectRoot);
    let effectiveRootNames = rootNames ?? [];
    if (typeTargetSpecs && typeTargetSpecs.length > 0) {
      const bootstrapPath = ensureTypeTargetBootstrapFile(root, typeTargetSpecs, {
        mkdirSync,
        writeFile: (path, content) => sys.writeFile(path, content),
      });
      effectiveRootNames = effectiveRootNames.includes(bootstrapPath)
        ? [...effectiveRootNames]
        : [...effectiveRootNames, bootstrapPath];
    }
    const createTypeInfoApiSession = createLazyTypeInfoApiSession({
      ts,
      createProgram: () => createProgramForSession(effectiveRootNames, opts ?? {}),
      ...(typeTargetSpecs?.length ? { typeTargetSpecs } : {}),
    });
    const artifactStoreFactory = createVmcArtifactStoreFactory({
      ts,
      commandLine: toParsedCommandLine(effectiveRootNames, opts ?? {}, refs),
      resolver,
      vmcConfigPath,
      vmcConfigDependencyPaths,
      pluginModules,
      projectRoot: root,
      rootNames: effectiveRootNames,
      ...(typeTargetSpecs?.length ? { typeTargetSpecs } : {}),
    });
    const adapter = attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver,
      projectRoot: root,
      createTypeInfoApiSession,
      artifactStoreFactory,
      reportDiagnostic,
    });
    adapters.push(adapter);
    return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      effectiveRootNames,
      opts ?? {},
      host,
      oldProgram,
      configFileParsingDiagnostics,
      refs,
    );
  };

  const host = ts.createSolutionBuilderHost(
    sys,
    createProgram,
    reportDiagnostic,
    reportSolutionBuilderStatus,
  );

  const builder = ts.createSolutionBuilder(host, projects, buildOptions);
  try {
    const exitCode = builder.build();
    return exitCode === ts.ExitStatus.Success ? 0 : 1;
  } finally {
    for (const adapter of adapters.splice(0)) {
      adapter.dispose();
    }
  }
}

function toParsedCommandLine(
  rootNames: readonly string[],
  options: ts.CompilerOptions,
  refs: readonly ts.ProjectReference[] | undefined,
): ts.ParsedCommandLine {
  return {
    fileNames: [...rootNames],
    options,
    projectReferences: refs,
    errors: [],
  };
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
