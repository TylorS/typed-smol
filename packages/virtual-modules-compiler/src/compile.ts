import { mkdirSync } from "node:fs";
import type * as ts from "typescript";
import type { TypeTargetSpec, VirtualModuleResolver } from "@typed/virtual-modules";
import {
  attachCompilerHostAdapter,
  createTypeInfoApiSessionFactory,
  ensureTypeTargetBootstrapFile,
} from "@typed/virtual-modules";

export interface CompileParams {
  readonly ts: typeof import("typescript");
  readonly commandLine: ts.ParsedCommandLine;
  readonly resolver: VirtualModuleResolver;
  readonly reportDiagnostic: ts.DiagnosticReporter;
  /** Type target specs for structural assignability in TypeInfo API. From vmc.config when using loadResolver. */
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

/**
 * Perform a single compile pass using the adapted compiler host.
 * Mirrors tsc behavior: create program, emit, report diagnostics, return exit code.
 */
export function compile(params: CompileParams): number {
  const { ts, commandLine, resolver, reportDiagnostic, typeTargetSpecs } = params;
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

  // Preliminary program for TypeInfo API (plugins that use api.file()/api.directory() need it).
  const preliminaryProgram = ts.createProgram({
    rootNames: effectiveRootNames,
    options,
    host,
    projectReferences,
    configFileParsingDiagnostics: allConfigErrors,
  });
  const createTypeInfoApiSession = createTypeInfoApiSessionFactory({
    ts,
    program: preliminaryProgram,
    ...(typeTargetSpecs?.length ? { typeTargetSpecs } : {}),
  });

  const adapter = attachCompilerHostAdapter({
    ts,
    compilerHost: host,
    resolver,
    projectRoot,
    createTypeInfoApiSession,
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
    // oxlint-disable-next-line typescript/unbound-method
    const emitResult = program.emit(undefined, sys.writeFile);
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
