import type * as ts from "typescript";
import { runBuild, type BuildParams } from "./build.js";
import { compile, type CompileParams } from "./compile.js";
import { resolveCommandLine } from "./commandLine.js";
import type { VmcCompilerExtension } from "./extensions.js";
import { runInit } from "./init.js";
import { loadResolver, type LoadResolverResult } from "./resolverLoader.js";
import { runWatch, type WatchParams } from "./watch.js";

export interface RunVmcCliParams {
  readonly ts: typeof import("typescript");
  readonly args: readonly string[];
  readonly commandName?: string;
  readonly extensions?: readonly VmcCompilerExtension[];
  readonly sys?: ts.System;
  readonly loadResolver?: (projectRoot: string) => LoadResolverResult;
  readonly compile?: (params: CompileParams) => number;
  readonly runBuild?: (params: BuildParams) => number;
  readonly runWatch?: (params: WatchParams) => void;
  readonly runInit?: typeof runInit;
}

export function runVmcCli(params: RunVmcCliParams): number | undefined {
  const sys = params.sys ?? params.ts.sys;
  if (!sys) {
    writeUnavailableSys(params);
    return 1;
  }

  if (params.args[0] === "init") return runInitCommand(params, sys);
  if (buildIndex(params.args) >= 0) return runBuildCommand(params, sys);
  return runCompileOrWatchCommand(params, sys);
}

function runInitCommand(params: RunVmcCliParams, sys: ts.System): number {
  const result = (params.runInit ?? runInit)({
    force: params.args.includes("--force"),
    projectRoot: sys.getCurrentDirectory(),
  });
  sys.write(result.message + sys.newLine);
  return result.ok ? 0 : 1;
}

function runBuildCommand(params: RunVmcCliParams, sys: ts.System): number {
  const args = params.args.filter((_, index) => index !== buildIndex(params.args));
  const parsed = params.ts.parseBuildCommand([...args]);
  const reportDiagnostic = diagnosticReporter(params.ts, sys);
  for (const diagnostic of parsed.errors) reportDiagnostic(diagnostic);
  if (parsed.errors.length > 0) return 1;
  const loaded = resolveCliResolver(params, sys);
  return (params.runBuild ?? runBuild)({
    ...loaded,
    buildCommand: parsed,
    extensions: params.extensions,
    reportDiagnostic,
    reportSolutionBuilderStatus: reportDiagnostic,
    ts: params.ts,
  });
}

function runCompileOrWatchCommand(
  params: RunVmcCliParams,
  sys: ts.System,
): number | undefined {
  const watch = watchIndex(params.args);
  const args = watch >= 0 ? params.args.filter((_, index) => index !== watch) : params.args;
  const reportDiagnostic = diagnosticReporter(params.ts, sys);
  const commandLine = resolvedCommandLine(params.ts, sys, args);
  for (const diagnostic of commandLine.errors) reportDiagnostic(diagnostic);
  if (commandLine.errors.length > 0) return 1;
  const loaded = resolveCliResolver(params, sys);
  if (watch >= 0) return runWatchCommand(params, sys, commandLine, loaded, reportDiagnostic);
  return runCompileCommand(params, commandLine, loaded, reportDiagnostic);
}

function runWatchCommand(
  params: RunVmcCliParams,
  sys: ts.System,
  commandLine: ts.ParsedCommandLine,
  loaded: LoadResolverResult,
  reportDiagnostic: ts.DiagnosticReporter,
): undefined {
  (params.runWatch ?? runWatch)({
    ...loaded,
    commandLine,
    extensions: params.extensions,
    reloadResolver: () => resolveCliResolver(params, sys),
    reportDiagnostic,
    reportWatchStatus: watchStatusReporter(params.ts, sys),
    ts: params.ts,
  });
  return undefined;
}

function runCompileCommand(
  params: RunVmcCliParams,
  commandLine: ts.ParsedCommandLine,
  loaded: LoadResolverResult,
  reportDiagnostic: ts.DiagnosticReporter,
): number {
  return (params.compile ?? compile)({
    ...loaded,
    commandLine,
    extensions: params.extensions,
    reportDiagnostic,
    ts: params.ts,
  });
}

function resolvedCommandLine(
  tsMod: typeof import("typescript"),
  sys: ts.System,
  args: readonly string[],
): ts.ParsedCommandLine {
  // oxlint-disable-next-line typescript/unbound-method
  return resolveCommandLine(tsMod, tsMod.parseCommandLine([...args], sys.readFile), sys);
}

function resolveCliResolver(params: RunVmcCliParams, sys: ts.System): LoadResolverResult {
  return (params.loadResolver ?? loadResolver)(sys.getCurrentDirectory());
}

function diagnosticReporter(
  tsMod: typeof import("typescript"),
  sys: ts.System,
): ts.DiagnosticReporter {
  return (diagnostic) => {
    sys.write(tsMod.formatDiagnostic(diagnostic, formatHost(sys, sys.newLine)));
  };
}

function watchStatusReporter(
  tsMod: typeof import("typescript"),
  sys: ts.System,
): ts.WatchStatusReporter {
  return (diagnostic, newLine) => {
    sys.write(tsMod.formatDiagnostic(diagnostic, formatHost(sys, newLine)));
  };
}

function formatHost(sys: ts.System, newLine: string): ts.FormatDiagnosticsHost {
  return {
    getCanonicalFileName: (fileName) => fileName,
    // oxlint-disable-next-line typescript/unbound-method
    getCurrentDirectory: sys.getCurrentDirectory,
    getNewLine: () => newLine,
  };
}

function writeUnavailableSys(params: RunVmcCliParams): void {
  const commandName = params.commandName ?? "vmc";
  // eslint-disable-next-line no-console
  console.error(`${commandName}: ts.sys is not available.`);
}

function buildIndex(args: readonly string[]): number {
  return args.findIndex((arg) => arg === "--build" || arg === "-b");
}

function watchIndex(args: readonly string[]): number {
  return args.findIndex((arg) => arg === "--watch" || arg === "-w");
}
