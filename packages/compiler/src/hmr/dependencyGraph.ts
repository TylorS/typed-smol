import {
  analyzeDependencyHmr,
  type DependencyHmrCandidate,
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
