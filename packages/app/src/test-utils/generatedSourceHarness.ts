import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ts from "typescript";

export type GeneratedSourceTypeCheckInput = {
  readonly rootDir: string;
  readonly generatedPath: string;
  readonly sourceText: string;
  readonly rootFiles: readonly string[];
  readonly moduleFallbacks?: Readonly<Record<string, string>>;
};

export type GeneratedSourceTypeCheckResult = {
  readonly diagnostics: readonly string[];
};

export function typeCheckGeneratedSource(
  input: GeneratedSourceTypeCheckInput,
): GeneratedSourceTypeCheckResult {
  const generatedAbs = writeGeneratedSource(input);
  const options = createCompilerOptions();
  const defaultHost = ts.createCompilerHost(options);
  const host = createCompilerHost(input, options, defaultHost);
  const program = ts.createProgram([...input.rootFiles, generatedAbs], options, host);
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));

  return { diagnostics };
}

function writeGeneratedSource(input: GeneratedSourceTypeCheckInput): string {
  const generatedAbs = join(input.rootDir, input.generatedPath);
  mkdirSync(dirname(generatedAbs), { recursive: true });
  writeFileSync(generatedAbs, input.sourceText, "utf8");
  return generatedAbs;
}

function createCompilerOptions(): ts.CompilerOptions {
  return {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
    allowJs: true,
  };
}

function createCompilerHost(
  input: GeneratedSourceTypeCheckInput,
  options: ts.CompilerOptions,
  defaultHost: ts.CompilerHost,
): ts.CompilerHost {
  const moduleResolutionHost = createModuleResolutionHost(input.rootDir, defaultHost);

  return {
    ...defaultHost,
    getCurrentDirectory: () => input.rootDir,
    resolveModuleNames: (moduleNames, containingFile) =>
      moduleNames.map((moduleName) =>
        resolveModuleName(moduleName, containingFile, input, options, moduleResolutionHost),
      ),
  };
}

function createModuleResolutionHost(
  rootDir: string,
  defaultHost: ts.CompilerHost,
): ts.ModuleResolutionHost {
  return {
    getCurrentDirectory: () => rootDir,
    fileExists: defaultHost.fileExists.bind(defaultHost),
    readFile: defaultHost.readFile.bind(defaultHost),
    useCaseSensitiveFileNames: () => defaultHost.useCaseSensitiveFileNames(),
  };
}

function resolveModuleName(
  moduleName: string,
  containingFile: string,
  input: GeneratedSourceTypeCheckInput,
  options: ts.CompilerOptions,
  moduleResolutionHost: ts.ModuleResolutionHost,
): ts.ResolvedModule | undefined {
  const resolved = ts.resolveModuleName(moduleName, containingFile, options, moduleResolutionHost);
  if (resolved.resolvedModule) return resolved.resolvedModule;

  const fallback = input.moduleFallbacks?.[moduleName];
  if (!fallback || !moduleResolutionHost.fileExists(fallback)) return undefined;

  return {
    resolvedFileName: fallback,
    extension: extensionForPath(fallback),
    isExternalLibraryImport: false,
  };
}

function extensionForPath(path: string): ts.Extension {
  if (path.endsWith(".d.ts")) return ts.Extension.Dts;
  if (path.endsWith(".ts")) return ts.Extension.Ts;
  return ts.Extension.Js;
}
