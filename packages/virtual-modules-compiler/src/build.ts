import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type * as ts from "typescript";
import type { TypeTargetSpec, VirtualModuleResolver } from "@typed/virtual-modules";
import {
  attachCompilerHostAdapter,
  createTypeInfoApiSessionFactory,
  ensureTypeTargetBootstrapFile,
} from "@typed/virtual-modules";

function inferProjectRoot(
  sys: ts.System,
  rootNames: readonly string[] | undefined,
  fallback: string,
): string {
  if (rootNames && rootNames.length > 0) {
    return dirname(rootNames[0]);
  }
  return fallback;
}

export interface BuildParams {
  readonly ts: typeof import("typescript");
  readonly buildCommand: ts.ParsedBuildCommand;
  readonly resolver: VirtualModuleResolver;
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
    const root = inferProjectRoot(sys, rootNames, projectRoot);
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
    const preliminaryProgram = createProgramForSession(effectiveRootNames, opts ?? {});
    const createTypeInfoApiSession = createTypeInfoApiSessionFactory({
      ts,
      program: preliminaryProgram,
      ...(typeTargetSpecs?.length ? { typeTargetSpecs } : {}),
    });
    const adapter = attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver,
      projectRoot: root,
      createTypeInfoApiSession,
      reportDiagnostic,
    });
    try {
      return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
        effectiveRootNames,
        opts ?? {},
        host,
        oldProgram,
        configFileParsingDiagnostics,
        refs,
      );
    } finally {
      adapter.dispose();
    }
  };

  const host = ts.createSolutionBuilderHost(
    sys,
    createProgram,
    reportDiagnostic,
    reportSolutionBuilderStatus,
  );

  const builder = ts.createSolutionBuilder(host, projects, buildOptions);
  const exitCode = builder.build();
  return exitCode === ts.ExitStatus.Success ? 0 : 1;
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
