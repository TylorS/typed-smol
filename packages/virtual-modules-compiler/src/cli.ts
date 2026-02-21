#!/usr/bin/env node

import ts from "typescript";
import { resolveCommandLine } from "./commandLine.js";
import { loadResolver } from "./resolverLoader.js";
import { compile } from "./compile.js";
import { runWatch } from "./watch.js";
import { runBuild } from "./build.js";

const args = process.argv.slice(2);
const sys = ts.sys;

if (!sys) {
  console.error("vmc: ts.sys is not available.");
  process.exit(1);
}

const reportDiagnostic: ts.DiagnosticReporter = (diagnostic) => {
  const message = ts.formatDiagnostic(diagnostic, {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: sys.getCurrentDirectory,
    getNewLine: () => sys.newLine,
  });
  if (diagnostic.category === ts.DiagnosticCategory.Error) {
    sys.write(message);
  } else {
    sys.write(message);
  }
};

function main(): number {
  const buildIndex = args.findIndex((a) => a === "--build" || a === "-b");
  const watchIndex = args.findIndex((a) => a === "--watch" || a === "-w");

  if (buildIndex >= 0) {
    const buildArgs = args.filter((_, i) => i !== buildIndex);
    const parsed = ts.parseBuildCommand(buildArgs);
    for (const d of parsed.errors) {
      reportDiagnostic(d);
    }
    if (parsed.errors.length > 0) {
      return 1;
    }
    const projectRoot = sys.getCurrentDirectory();
    const resolver = loadResolver(projectRoot);
    return runBuild({
      ts,
      buildCommand: parsed,
      resolver,
      reportDiagnostic,
      reportSolutionBuilderStatus: reportDiagnostic,
    });
  }

  const watchArgs = watchIndex >= 0 ? args.filter((_, i) => i !== watchIndex) : args;
  let commandLine = ts.parseCommandLine(watchArgs, sys.readFile);
  commandLine = resolveCommandLine(ts, commandLine, sys);

  for (const d of commandLine.errors) {
    reportDiagnostic(d);
  }
  if (commandLine.errors.length > 0) {
    return 1;
  }

  const projectRoot = sys.getCurrentDirectory();
  const resolver = loadResolver(projectRoot);

  if (watchIndex >= 0) {
    runWatch({
      ts,
      commandLine,
      resolver,
      reportDiagnostic,
      reportWatchStatus: (diag, newLine, _opts, _errorCount) => {
        sys.write(ts.formatDiagnostic(diag, {
          getCanonicalFileName: (f) => f,
          getCurrentDirectory: sys.getCurrentDirectory,
          getNewLine: () => newLine,
        }));
      },
    });
    return 0;
  }

  return compile({
    ts,
    commandLine,
    resolver,
    reportDiagnostic,
  });
}

process.exit(main());
