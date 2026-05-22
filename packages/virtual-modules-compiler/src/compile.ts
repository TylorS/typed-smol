import { mkdirSync } from "node:fs";
import type * as ts from "typescript";
import type {
  LoadedVmcPluginModule,
  TypeTargetSpec,
  VirtualModuleResolver,
} from "@typed/virtual-modules";
import {
  attachCompilerHostAdapter,
  ensureTypeTargetBootstrapFile,
} from "@typed/virtual-modules";
import { createVmcArtifactStoreFactory } from "./artifactStore.js";
import { createLazyTypeInfoApiSession } from "./typeInfoSession.js";

export interface CompileParams {
  readonly ts: typeof import("typescript");
  readonly commandLine: ts.ParsedCommandLine;
  readonly resolver: VirtualModuleResolver;
  readonly vmcConfigPath?: string;
  readonly vmcConfigDependencyPaths?: readonly string[];
  readonly pluginModules?: readonly LoadedVmcPluginModule[];
  readonly reportDiagnostic: ts.DiagnosticReporter;
  /** Type target specs for structural assignability in TypeInfo API. From vmc.config when using loadResolver. */
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

/**
 * Perform a single compile pass using the adapted compiler host.
 * Mirrors tsc behavior: create program, emit, report diagnostics, return exit code.
 */
export function compile(params: CompileParams): number {
  const {
    ts,
    commandLine,
    resolver,
    vmcConfigPath,
    vmcConfigDependencyPaths,
    pluginModules,
    reportDiagnostic,
    typeTargetSpecs,
  } = params;
  const { options, fileNames, projectReferences } = commandLine;
  const configFileParsingDiagnostics = (
    commandLine as { configFileParsingDiagnostics?: readonly ts.Diagnostic[] }
  ).configFileParsingDiagnostics;

  const configParseDiags =
    (
      ts as {
        getConfigFileParsingDiagnostics?: (p: ts.ParsedCommandLine) => readonly ts.Diagnostic[];
      }
    ).getConfigFileParsingDiagnostics?.(commandLine) ?? commandLine.errors;
  const allConfigErrors = [...(configFileParsingDiagnostics ?? []), ...configParseDiags];
  for (const d of allConfigErrors) {
    reportDiagnostic(d);
  }
  if (allConfigErrors.length > 0) {
    return 1;
  }

  if (fileNames.length === 0) {
    reportDiagnostic(
      createDiagnostic(
        ts,
        ts.DiagnosticCategory.Message,
        0,
        0,
        "No inputs were found in config file.",
      ),
    );
    return 0;
  }

  const sys = ts.sys;
  if (!sys) {
    reportDiagnostic(
      createDiagnostic(ts, ts.DiagnosticCategory.Error, 0, 0, "ts.sys is not available."),
    );
    return 1;
  }

  const projectRoot = sys.getCurrentDirectory();

  let effectiveRootNames = fileNames;
  if (typeTargetSpecs && typeTargetSpecs.length > 0) {
    const bootstrapPath = ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs, {
      mkdirSync,
      writeFile: (path, content) => sys.writeFile(path, content),
    });
    effectiveRootNames = fileNames.includes(bootstrapPath)
      ? fileNames
      : [...fileNames, bootstrapPath];
  }

  const host = ts.createCompilerHost(options);

  const createTypeInfoApiSession = createLazyTypeInfoApiSession({
    ts,
    createProgram: () =>
      ts.createProgram({
        rootNames: effectiveRootNames,
        options,
        host: ts.createCompilerHost(options),
        projectReferences,
        configFileParsingDiagnostics: allConfigErrors,
      }),
    ...(typeTargetSpecs?.length ? { typeTargetSpecs } : {}),
  });
  const artifactStoreFactory = createVmcArtifactStoreFactory({
    ts,
    commandLine,
    resolver,
    vmcConfigPath,
    vmcConfigDependencyPaths,
    pluginModules,
    projectRoot,
    rootNames: effectiveRootNames,
    ...(typeTargetSpecs?.length ? { typeTargetSpecs } : {}),
  });

  const adapter = attachCompilerHostAdapter({
    ts,
    compilerHost: host,
    resolver,
    projectRoot,
    createTypeInfoApiSession,
    artifactStoreFactory,
    reportDiagnostic,
  });

  let exitCode = 0;
  try {
    const program = ts.createProgram({
      rootNames: effectiveRootNames,
      options,
      host,
      projectReferences,
      configFileParsingDiagnostics: allConfigErrors,
    });

    const preEmit = ts.getPreEmitDiagnostics(program);
    const emitResult = program.emit();
    const allDiagnostics = [...preEmit, ...emitResult.diagnostics];

    for (const d of allDiagnostics) {
      reportDiagnostic(d);
    }

    if (
      emitResult.emitSkipped ||
      allDiagnostics.some((d) => d.category === ts.DiagnosticCategory.Error)
    ) {
      exitCode = 1;
    }
  } finally {
    adapter.dispose();
  }

  return exitCode;
}

function createDiagnostic(
  ts: typeof import("typescript"),
  category: ts.DiagnosticCategory,
  code: number,
  length: number,
  messageText: string,
): ts.Diagnostic {
  return {
    category,
    code,
    file: undefined,
    start: 0,
    length,
    messageText,
  };
}
