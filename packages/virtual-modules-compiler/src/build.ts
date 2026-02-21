import { dirname } from "node:path";
import type * as ts from "typescript";
import type { VirtualModuleResolver } from "@typed/virtual-modules";
import { attachCompilerHostAdapter } from "@typed/virtual-modules";

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
    const adapter = attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver,
      projectRoot: root,
    });
    try {
      return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
        rootNames ?? [],
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
