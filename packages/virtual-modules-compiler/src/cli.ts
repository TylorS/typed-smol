#!/usr/bin/env node

import ts from "typescript";
import { resolveCommandLine } from "./commandLine.js";
import { loadResolver } from "./resolverLoader.js";
import { compile } from "./compile.js";
import { runWatch } from "./watch.js";
import { runBuild } from "./build.js";
import { runInit } from "./init.js";

const args = process.argv.slice(2);
const sys = ts.sys;

if (!sys) {
  console.error("vmc: ts.sys is not available.");
  process.exit(1);
}

const reportDiagnostic: ts.DiagnosticReporter = (diagnostic) => {
  const message = ts.formatDiagnostic(diagnostic, {
    getCanonicalFileName: (f) => f,
    // oxlint-disable-next-line typescript/unbound-method
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
  if (args[0] === "init") {
    const force = args.includes("--force");
    const result = runInit({
      projectRoot: sys.getCurrentDirectory(),
      force,
    });
    if (result.ok) {
      sys.write(result.message + sys.newLine);
      return 0;
    }
    sys.write(result.message + sys.newLine);
    return 1;
  }

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
  const { resolver, typeTargetSpecs } = loadResolver(projectRoot);
  return runBuild({
    ts,
    buildCommand: parsed,
    resolver,
    typeTargetSpecs,
      reportDiagnostic,
      reportSolutionBuilderStatus: reportDiagnostic,
    });
  }

  const watchArgs = watchIndex >= 0 ? args.filter((_, i) => i !== watchIndex) : args;
  // oxlint-disable-next-line typescript/unbound-method
  let commandLine = ts.parseCommandLine(watchArgs, sys.readFile);
  commandLine = resolveCommandLine(ts, commandLine, sys);

  for (const d of commandLine.errors) {
    reportDiagnostic(d);
  }
  if (commandLine.errors.length > 0) {
    return 1;
  }

  const projectRoot = sys.getCurrentDirectory();
  const { resolver, typeTargetSpecs } = loadResolver(projectRoot);

  if (watchIndex >= 0) {
    runWatch({
      ts,
      commandLine,
      resolver,
      typeTargetSpecs,
      reportDiagnostic,
      reportWatchStatus: (diag, newLine, _opts, _errorCount) => {
        sys.write(
          ts.formatDiagnostic(diag, {
            getCanonicalFileName: (f) => f,
            // oxlint-disable-next-line typescript/unbound-method
            getCurrentDirectory: sys.getCurrentDirectory,
            getNewLine: () => newLine,
          }),
        );
      },
    });
    return 0;
  }

  return compile({
    ts,
    commandLine,
    resolver,
    reportDiagnostic,
    typeTargetSpecs,
  });
}

process.exit(main());
