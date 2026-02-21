import type * as ts from "typescript";

/**
 * Resolve the parsed command line. When fileNames is empty (e.g. "tsc" with no args),
 * find tsconfig.json and use getParsedCommandLineOfConfigFile to populate fileNames.
 * This mirrors tsc behavior.
 */
export function resolveCommandLine(
  ts: typeof import("typescript"),
  commandLine: ts.ParsedCommandLine,
  sys: ts.System,
): ts.ParsedCommandLine {
  if (commandLine.fileNames.length > 0) {
    return commandLine;
  }

  const project = (commandLine.options as { project?: string }).project;
  const cwd = sys.getCurrentDirectory();
  let configPath: string | undefined;
  if (project) {
    configPath = sys.fileExists(project)
      ? project
      : ts.findConfigFile(project, (p) => sys.fileExists(p));
  } else {
    configPath = ts.findConfigFile(cwd, (p) => sys.fileExists(p));
  }

  if (!configPath) {
    return commandLine;
  }

  const configHost: ts.ParseConfigFileHost = {
    getCurrentDirectory: () => sys.getCurrentDirectory(),
    useCaseSensitiveFileNames: sys.useCaseSensitiveFileNames,
    readDirectory: sys.readDirectory,
    fileExists: sys.fileExists,
    readFile: (p) => sys.readFile(p),
    onUnRecoverableConfigFileDiagnostic: (_d) => {
      // Will be reported by caller
    },
  };

  const resolved = ts.getParsedCommandLineOfConfigFile(configPath, commandLine.options, configHost);

  if (!resolved) {
    return commandLine;
  }

  return {
    ...commandLine,
    ...resolved,
    options: { ...commandLine.options, ...resolved.options },
  };
}
