import ts from "typescript";
import {
  analyzeDependencyHmr,
  type DependencyHmrParticipant,
  type DependencyHmrRejected,
} from "../hmr/dependencies.js";

export interface AnalyzeRouteDependencyGraphInput {
  readonly program: ts.Program;
  readonly routeModuleId: string;
  readonly moduleResolutionHost?: ts.ModuleResolutionHost;
  readonly ts?: typeof ts;
}

export interface RouteDependencyGraph {
  readonly routeModuleId: string;
  readonly participants: readonly DependencyHmrParticipant[];
  readonly rejected: readonly DependencyHmrRejected[];
  readonly cycles: readonly RouteDependencyGraphCycle[];
  readonly boundaries: readonly RouteDependencyGraphBoundary[];
  readonly dependencyFingerprints: readonly string[];
}

export interface RouteDependencyGraphCycle {
  readonly fromModuleId: string;
  readonly toModuleId: string;
}

export interface RouteDependencyGraphBoundary {
  readonly moduleId: string;
  readonly reason: "explicit-opt-out";
  readonly skippedImports: readonly string[];
}

interface GraphContext {
  readonly moduleResolutionHost: ts.ModuleResolutionHost;
  readonly options: ts.CompilerOptions;
  readonly program: ts.Program;
  readonly routeModuleId: string;
  readonly sourceFiles: ReadonlyMap<string, ts.SourceFile>;
  readonly visited: Set<string>;
  readonly participants: DependencyHmrParticipant[];
  readonly rejected: DependencyHmrRejected[];
  readonly cycles: RouteDependencyGraphCycle[];
  readonly boundaries: RouteDependencyGraphBoundary[];
}

const optOutMarker = "@typed-compiler-ignore";

export function analyzeRouteDependencyGraph(
  input: AnalyzeRouteDependencyGraphInput,
): RouteDependencyGraph {
  const tsMod = input.ts ?? ts;
  const context = createContext(input, tsMod);
  const route = context.sourceFiles.get(input.routeModuleId);
  if (route) {
    for (const imported of importsFor(context, route, tsMod)) {
      visitDependency(context, imported, [], tsMod);
    }
  }

  return {
    boundaries: context.boundaries,
    cycles: context.cycles,
    dependencyFingerprints: context.participants.map((item) => item.fingerprint).sort(),
    participants: context.participants,
    rejected: context.rejected,
    routeModuleId: input.routeModuleId,
  };
}

function createContext(
  input: AnalyzeRouteDependencyGraphInput,
  tsMod: typeof ts,
): GraphContext {
  const sourceFiles = sourceFileMap(input.program);
  return {
    boundaries: [],
    cycles: [],
    moduleResolutionHost: resolutionHost(input.moduleResolutionHost ?? tsMod.sys, sourceFiles),
    options: input.program.getCompilerOptions(),
    participants: [],
    program: input.program,
    rejected: [],
    routeModuleId: input.routeModuleId,
    sourceFiles,
    visited: new Set(),
  };
}

function sourceFileMap(program: ts.Program): ReadonlyMap<string, ts.SourceFile> {
  return new Map(program.getSourceFiles().map((sourceFile) => [sourceFile.fileName, sourceFile]));
}

function resolutionHost(
  base: ts.ModuleResolutionHost,
  sourceFiles: ReadonlyMap<string, ts.SourceFile>,
): ts.ModuleResolutionHost {
  return {
    ...base,
    directoryExists: (directoryName) =>
      sourceDirectoryExists(sourceFiles, directoryName) || base.directoryExists?.(directoryName) === true,
    fileExists: (fileName) => sourceFiles.has(fileName) || base.fileExists(fileName),
    readFile: (fileName) => sourceFiles.get(fileName)?.text ?? base.readFile?.(fileName),
  };
}

function sourceDirectoryExists(
  sourceFiles: ReadonlyMap<string, ts.SourceFile>,
  directoryName: string,
): boolean {
  const prefix = directoryName.endsWith("/") ? directoryName : `${directoryName}/`;
  return [...sourceFiles.keys()].some((fileName) => fileName.startsWith(prefix));
}

function visitDependency(
  context: GraphContext,
  moduleId: string,
  stack: readonly string[],
  tsMod: typeof ts,
): void {
  const sourceFile = context.sourceFiles.get(moduleId);
  if (!sourceFile) return;
  const fromModuleId = stack[stack.length - 1];
  if (stack.includes(moduleId)) {
    if (fromModuleId) context.cycles.push({ fromModuleId, toModuleId: moduleId });
    return;
  }
  if (context.visited.has(moduleId)) return;

  context.visited.add(moduleId);
  const imports = importsFor(context, sourceFile, tsMod);
  if (isOptOut(sourceFile)) return recordBoundary(context, sourceFile, imports);
  recordDependency(context, sourceFile);
  for (const imported of imports) {
    visitDependency(context, imported, [...stack, moduleId], tsMod);
  }
}

function recordDependency(context: GraphContext, sourceFile: ts.SourceFile): void {
  const result = analyzeDependencyHmr({
    dependencies: [
      {
        moduleId: sourceFile.fileName,
        reason: "imported",
        sourceText: sourceFile.text,
      },
    ],
    routeModuleId: context.routeModuleId,
  });
  context.participants.push(...result.participants);
  context.rejected.push(...result.rejected);
}

function recordBoundary(
  context: GraphContext,
  sourceFile: ts.SourceFile,
  imports: readonly string[],
): void {
  context.rejected.push({ moduleId: sourceFile.fileName, reason: "explicit-opt-out" });
  context.boundaries.push({
    moduleId: sourceFile.fileName,
    reason: "explicit-opt-out",
    skippedImports: imports,
  });
}

function importsFor(
  context: GraphContext,
  sourceFile: ts.SourceFile,
  tsMod: typeof ts,
): readonly string[] {
  const imports = new Set<string>();
  for (const statement of sourceFile.statements) {
    const specifier = moduleSpecifier(statement);
    if (!specifier) continue;
    const resolved = resolveImport(context, sourceFile.fileName, specifier, tsMod);
    if (resolved) imports.add(resolved);
  }
  return [...imports].sort();
}

function moduleSpecifier(statement: ts.Statement): string | undefined {
  if (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) {
    const specifier = statement.moduleSpecifier;
    return specifier && ts.isStringLiteral(specifier) ? specifier.text : undefined;
  }
  return undefined;
}

function resolveImport(
  context: GraphContext,
  containingFile: string,
  specifier: string,
  tsMod: typeof ts,
): string | undefined {
  const resolved = tsMod.resolveModuleName(
    specifier,
    containingFile,
    context.options,
    context.moduleResolutionHost,
  ).resolvedModule;
  if (!resolved) return undefined;
  const sourceFile = context.sourceFiles.get(resolved.resolvedFileName);
  return sourceFile?.fileName;
}

function isOptOut(sourceFile: ts.SourceFile): boolean {
  return sourceFile.text.includes(optOutMarker);
}
