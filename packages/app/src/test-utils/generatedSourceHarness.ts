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
    checkJs: false,
    types: ["node"],
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
): ts.ResolvedModuleFull | undefined {
  const resolved = ts.resolveModuleName(moduleName, containingFile, options, moduleResolutionHost);
  if (resolved.resolvedModule) return resolved.resolvedModule;

  const virtualModuleFallback = writeVirtualModuleFallback(moduleName, input.rootDir);
  if (virtualModuleFallback) {
    return {
      resolvedFileName: virtualModuleFallback,
      extension: ts.Extension.Dts,
      isExternalLibraryImport: false,
    };
  }

  const fallback = input.moduleFallbacks?.[moduleName];
  if (!fallback || !moduleResolutionHost.fileExists(fallback)) return undefined;

  const resolvedModule: ts.ResolvedModuleFull = {
    resolvedFileName: fallback,
    extension: extensionForPath(fallback),
    isExternalLibraryImport: false,
  };
  return resolvedModule;
}

function writeVirtualModuleFallback(moduleName: string, rootDir: string): string | undefined {
  const source = virtualModuleFallbackSource(moduleName);
  if (!source) return undefined;

  const fallbackDir = join(rootDir, ".typed-test-shims");
  mkdirSync(fallbackDir, { recursive: true });
  const fallbackPath = join(fallbackDir, `${safeModuleName(moduleName)}.d.ts`);
  writeFileSync(fallbackPath, source, "utf8");
  return fallbackPath;
}

function virtualModuleFallbackSource(moduleName: string): string | undefined {
  if (moduleName.startsWith("typed:services?")) {
    return `
export const modules: Record<string, any>;
export const dependencyInputs: Record<string, any>;
export const dependencyLayers: Record<string, any>;
export const DependenciesLayer: any;
`;
  }
  if (moduleName.startsWith("typed:guard?")) {
    return `
export const modules: Record<string, any>;
export const guards: Record<string, any>;
`;
  }
  if (moduleName.startsWith("typed:layout?")) {
    return `
export const modules: Record<string, any>;
export const layouts: Record<string, any>;
`;
  }
  if (moduleName.startsWith("typed:catch?")) {
    return `
export const modules: Record<string, any>;
export const catchers: Record<string, any>;
`;
  }
  if (moduleName.startsWith("typed:route-template?")) {
    return `
export const route: any;
export const handler: any;
export const template: any;
export const entrypoint: any;
export const guard: any;
export const layout: any;
export const dependencies: any;
export const catcher: any;
`;
  }
  if (moduleName.startsWith("typed:headers?")) {
    return `export const modules: Record<string, any>; export const headers: Record<string, any>;`;
  }
  if (moduleName.startsWith("typed:errors?")) {
    return `export const modules: Record<string, any>; export const errors: Record<string, any>;`;
  }
  if (moduleName.startsWith("typed:middlewares?")) {
    return `export const modules: Record<string, any>; export const middlewares: Record<string, any>;`;
  }
  if (moduleName.startsWith("typed:prefix?")) {
    return `export const modules: Record<string, any>; export const prefixes: Record<string, any>;`;
  }
  if (moduleName.startsWith("typed:openapi?")) {
    return `export const modules: Record<string, any>; export const openapi: Record<string, any>;`;
  }
  if (moduleName.startsWith("typed:api-handler?")) {
    return `
export const endpoint: any;
export const route: any;
export const method: any;
export const headers: any;
export const body: any;
export const success: any;
export const error: any;
export const handler: any;
export const metadata: any;
`;
  }
  return undefined;
}

function safeModuleName(moduleName: string): string {
  return moduleName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function extensionForPath(path: string): ts.Extension {
  if (path.endsWith(".d.ts")) return ts.Extension.Dts;
  if (path.endsWith(".ts")) return ts.Extension.Ts;
  return ts.Extension.Js;
}
