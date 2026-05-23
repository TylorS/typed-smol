import ts from "typescript";
import {
  analyzeDependencyHmr,
  type DependencyHmrCandidate,
  type DependencyHmrReason,
  type DependencyHmrParticipant,
  type DependencyHmrRejected,
} from "./dependencies.js";

export interface DependencyGraphHmrInput {
  readonly routeModuleId: string;
  readonly entryModuleIds: readonly string[];
  readonly dependencies: readonly DependencyGraphHmrCandidate[];
}

export interface DependencyGraphHmrCandidate extends DependencyHmrCandidate {
  readonly imports?: readonly string[];
}

export interface DependencyGraphHmrResult {
  readonly routeModuleId: string;
  readonly participants: readonly DependencyHmrParticipant[];
  readonly rejected: readonly DependencyHmrRejected[];
  readonly cycles: readonly DependencyGraphCycle[];
  readonly boundaries: readonly DependencyGraphBoundary[];
}

export interface DependencyGraphCycle {
  readonly fromModuleId: string;
  readonly toModuleId: string;
}

export interface DependencyGraphBoundary {
  readonly moduleId: string;
  readonly reason: "explicit-opt-out";
  readonly skippedImports: readonly string[];
}

export interface DiscoverRouteDependencyGraphHmrInput {
  readonly routeModuleId: string;
  readonly readFile: (moduleId: string) => string | undefined;
  readonly fileExists?: (moduleId: string) => boolean;
  readonly compilerOptions?: ts.CompilerOptions;
  readonly ts?: typeof ts;
  readonly classifyDependency?: (
    moduleId: string,
    sourceText: string,
  ) => DiscoveredDependencyClassification;
}

export interface DiscoveredDependencyClassification {
  readonly reason?: DependencyHmrReason;
  readonly optIn?: boolean;
  readonly optOut?: boolean;
}

export function analyzeDependencyGraphHmr(
  input: DependencyGraphHmrInput,
): DependencyGraphHmrResult {
  const graph = createGraph(input.dependencies);
  const context = createContext(input.routeModuleId, graph);

  for (const moduleId of stable(input.entryModuleIds)) {
    visitDependency(context, moduleId, []);
  }

  return {
    routeModuleId: input.routeModuleId,
    participants: context.participants,
    rejected: context.rejected,
    cycles: context.cycles,
    boundaries: context.boundaries,
  };
}

export function discoverRouteDependencyGraphHmr(
  input: DiscoverRouteDependencyGraphHmrInput,
): DependencyGraphHmrResult {
  const tsMod = input.ts ?? ts;
  const compilerOptions = input.compilerOptions ?? defaultCompilerOptions(tsMod);
  const host = moduleResolutionHost(input);
  const context = createDiscoveryContext(input, tsMod, compilerOptions, host);
  const entryModuleIds = discoverImports(context, input.routeModuleId, []);

  return analyzeDependencyGraphHmr({
    routeModuleId: input.routeModuleId,
    entryModuleIds,
    dependencies: [...context.dependencies.values()],
  });
}

interface GraphContext {
  readonly routeModuleId: string;
  readonly graph: ReadonlyMap<string, DependencyGraphHmrCandidate>;
  readonly visited: Set<string>;
  readonly participants: DependencyHmrParticipant[];
  readonly rejected: DependencyHmrRejected[];
  readonly cycles: DependencyGraphCycle[];
  readonly boundaries: DependencyGraphBoundary[];
}

function createContext(
  routeModuleId: string,
  graph: ReadonlyMap<string, DependencyGraphHmrCandidate>,
): GraphContext {
  return {
    routeModuleId,
    graph,
    visited: new Set(),
    participants: [],
    rejected: [],
    cycles: [],
    boundaries: [],
  };
}

function visitDependency(context: GraphContext, moduleId: string, stack: readonly string[]): void {
  const dependency = context.graph.get(moduleId);
  if (!dependency) return;
  const fromModuleId = stack[stack.length - 1];
  if (stack.includes(moduleId)) {
    if (fromModuleId) context.cycles.push({ fromModuleId, toModuleId: moduleId });
    return;
  }
  if (context.visited.has(moduleId)) return;

  context.visited.add(moduleId);
  recordDependency(context, dependency);
  if (dependency.optOut) return recordBoundary(context, dependency);

  for (const imported of stable(dependency.imports ?? [])) {
    visitDependency(context, imported, [...stack, moduleId]);
  }
}

function recordDependency(
  context: GraphContext,
  dependency: DependencyGraphHmrCandidate,
): void {
  const result = analyzeDependencyHmr({
    routeModuleId: context.routeModuleId,
    dependencies: [dependency],
  });
  context.participants.push(...result.participants);
  context.rejected.push(...result.rejected);
}

function recordBoundary(
  context: GraphContext,
  dependency: DependencyGraphHmrCandidate,
): void {
  context.boundaries.push({
    moduleId: dependency.moduleId,
    reason: "explicit-opt-out",
    skippedImports: stable(dependency.imports ?? []),
  });
}

function createGraph(
  dependencies: readonly DependencyGraphHmrCandidate[],
): ReadonlyMap<string, DependencyGraphHmrCandidate> {
  return new Map(dependencies.map((dependency) => [dependency.moduleId, dependency]));
}

function stable(values: readonly string[]): readonly string[] {
  return [...values].sort();
}

interface DiscoveryContext {
  readonly input: DiscoverRouteDependencyGraphHmrInput;
  readonly ts: typeof ts;
  readonly compilerOptions: ts.CompilerOptions;
  readonly host: ts.ModuleResolutionHost;
  readonly dependencies: Map<string, DependencyGraphHmrCandidate>;
  readonly visited: Set<string>;
  readonly stack: Set<string>;
}

function createDiscoveryContext(
  input: DiscoverRouteDependencyGraphHmrInput,
  tsMod: typeof ts,
  compilerOptions: ts.CompilerOptions,
  host: ts.ModuleResolutionHost,
): DiscoveryContext {
  return {
    compilerOptions,
    dependencies: new Map(),
    host,
    input,
    stack: new Set(),
    ts: tsMod,
    visited: new Set(),
  };
}

function discoverImports(
  context: DiscoveryContext,
  moduleId: string,
  stack: readonly string[],
): readonly string[] {
  if (context.stack.has(moduleId)) return [];
  const sourceText = context.input.readFile(moduleId);
  if (sourceText === undefined) return [];

  context.stack.add(moduleId);
  const sourceFile = context.ts.createSourceFile(
    moduleId,
    sourceText,
    context.ts.ScriptTarget.Latest,
    true,
  );
  const importedIds = stable(
    collectModuleSpecifiers(context.ts, sourceFile)
      .map((specifier) => resolveModuleId(context, specifier, moduleId))
      .filter(isString),
  );

  if (moduleId !== context.input.routeModuleId) {
    context.dependencies.set(moduleId, dependencyCandidate(context, moduleId, sourceText, importedIds));
  }

  if (!context.visited.has(moduleId)) {
    context.visited.add(moduleId);
    for (const imported of importedIds) {
      if (!stack.includes(imported)) discoverImports(context, imported, [...stack, moduleId]);
    }
  }

  context.stack.delete(moduleId);
  return importedIds;
}

function dependencyCandidate(
  context: DiscoveryContext,
  moduleId: string,
  sourceText: string,
  imports: readonly string[],
): DependencyGraphHmrCandidate {
  const classification = context.input.classifyDependency?.(moduleId, sourceText) ?? {};
  return {
    imports,
    moduleId,
    optIn: classification.optIn,
    optOut: classification.optOut,
    reason: classification.reason ?? "imported",
    sourceText,
  };
}

function collectModuleSpecifiers(tsMod: typeof ts, sourceFile: ts.SourceFile): readonly string[] {
  const specifiers: string[] = [];
  for (const statement of sourceFile.statements) {
    const specifier = moduleSpecifierText(tsMod, statement);
    if (specifier && isCompilerVisibleSpecifier(specifier)) specifiers.push(specifier);
  }
  return specifiers;
}

function moduleSpecifierText(tsMod: typeof ts, statement: ts.Statement): string | undefined {
  if (
    (tsMod.isImportDeclaration(statement) || tsMod.isExportDeclaration(statement)) &&
    statement.moduleSpecifier &&
    tsMod.isStringLiteral(statement.moduleSpecifier)
  ) {
    return statement.moduleSpecifier.text;
  }
  return undefined;
}

function resolveModuleId(
  context: DiscoveryContext,
  specifier: string,
  containingFile: string,
): string | undefined {
  const resolved = context.ts.resolveModuleName(
    specifier,
    containingFile,
    context.compilerOptions,
    context.host,
  ).resolvedModule?.resolvedFileName;
  return resolved && context.host.fileExists(resolved) ? normalizeModuleId(resolved) : undefined;
}

function moduleResolutionHost(
  input: DiscoverRouteDependencyGraphHmrInput,
): ts.ModuleResolutionHost {
  const fileExists = input.fileExists ?? ((moduleId) => input.readFile(moduleId) !== undefined);
  return {
    fileExists: (fileName) => fileExists(normalizeModuleId(fileName)),
    readFile: (fileName) => input.readFile(normalizeModuleId(fileName)),
  };
}

function defaultCompilerOptions(tsMod: typeof ts): ts.CompilerOptions {
  return {
    allowJs: true,
    moduleResolution: tsMod.ModuleResolutionKind.Bundler,
  };
}

function isCompilerVisibleSpecifier(specifier: string): boolean {
  return specifier.startsWith(".") || specifier.startsWith("/");
}

function normalizeModuleId(moduleId: string): string {
  return moduleId.replaceAll("\\", "/");
}

function isString(value: string | undefined): value is string {
  return value !== undefined;
}
