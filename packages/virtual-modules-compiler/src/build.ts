import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type * as ts from "typescript";
import type {
  LoadedVmcPluginModule,
  TypeTargetSpec,
  VirtualModuleAdapterHandle,
  VirtualModuleResolver,
} from "@typed/virtual-modules";
import { attachCompilerHostAdapter, ensureTypeTargetBootstrapFile } from "@typed/virtual-modules";
import { createVmcArtifactStoreFactory } from "./artifactStore.js";
import {
  attachSourceTransformExtensions,
  collectExtensionDiagnostics,
  createProgramContext,
  extensionTypeTargetSpecs,
  runBeforeProgramCreate,
  type VmcCompilerExtension,
} from "./extensions.js";
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
  readonly extensions?: readonly VmcCompilerExtension[];
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
    extensions,
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
    const effectiveTypeTargetSpecs = extensionTypeTargetSpecs(typeTargetSpecs, extensions);
    if (effectiveTypeTargetSpecs && effectiveTypeTargetSpecs.length > 0) {
      const bootstrapPath = ensureTypeTargetBootstrapFile(root, effectiveTypeTargetSpecs, {
        mkdirSync,
        writeFile: (path, content) => sys.writeFile(path, content),
      });
      effectiveRootNames = effectiveRootNames.includes(bootstrapPath)
        ? [...effectiveRootNames]
        : [...effectiveRootNames, bootstrapPath];
    }
    const context = createProgramContext({
      options: opts ?? {},
      projectReferences: refs,
      projectRoot: root,
      rootNames: effectiveRootNames,
      ts,
    });
    runBeforeProgramCreate(extensions, context);
    attachSourceTransformExtensions({ ts, compilerHost: host, context, extensions, reportDiagnostic });
    const createTypeInfoApiSession = createLazyTypeInfoApiSession({
      ts,
      createProgram: () => createProgramForSession(effectiveRootNames, opts ?? {}),
      ...(effectiveTypeTargetSpecs?.length ? { typeTargetSpecs: effectiveTypeTargetSpecs } : {}),
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
      ...(effectiveTypeTargetSpecs?.length ? { typeTargetSpecs: effectiveTypeTargetSpecs } : {}),
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
    const builder = ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      effectiveRootNames,
      opts ?? {},
      host,
      oldProgram,
      configFileParsingDiagnostics,
      refs,
    );
    const program = builder.getProgram();
    for (const diagnostic of collectExtensionDiagnostics(extensions, { ...context, program })) {
      reportDiagnostic(diagnostic);
    }
    return builder;
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
