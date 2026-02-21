import type * as ts from "typescript";
import type { VirtualModuleResolver } from "@typed/virtual-modules";
import { attachCompilerHostAdapter } from "@typed/virtual-modules";

export interface WatchParams {
  readonly ts: typeof import("typescript");
  readonly commandLine: ts.ParsedCommandLine;
  readonly resolver: VirtualModuleResolver;
  readonly reportDiagnostic: ts.DiagnosticReporter;
  readonly reportWatchStatus?: ts.WatchStatusReporter;
}

/**
 * Run the compiler in watch mode. Mirrors tsc --watch.
 */
export function runWatch(params: WatchParams): void {
  const { ts, commandLine, resolver, reportDiagnostic, reportWatchStatus } = params;
  const { options, fileNames, projectReferences, watchOptions } = commandLine;

  const sys = ts.sys;
  if (!sys) {
    reportDiagnostic(
      createDiagnostic(ts, ts.DiagnosticCategory.Error, 0, 0, "ts.sys is not available."),
    );
    process.exit(1);
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
      host = ts.createCompilerHost(opts ?? options);
    }
    const adapter = attachCompilerHostAdapter({
      ts,
      compilerHost: host,
      resolver,
      projectRoot,
    });
    try {
      return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
        rootNames ?? fileNames,
        opts ?? options,
        host,
        oldProgram,
        configFileParsingDiagnostics,
        refs ?? projectReferences,
      );
    } finally {
      adapter.dispose();
    }
  };

  const host = ts.createWatchCompilerHost(
    fileNames,
    options,
    sys,
    createProgram,
    reportDiagnostic,
    reportWatchStatus,
    projectReferences,
    watchOptions,
  );

  ts.createWatchProgram(host);
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
