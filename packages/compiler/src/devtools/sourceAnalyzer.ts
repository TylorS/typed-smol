import {
  makeComponentId,
  makeFxNodeId,
  makeRefSubjectId,
  makeSourceLocationId,
  type SourceAnalyzerFact,
  type SourceAnalyzerRequest,
  type SourceAnalyzerResponse,
} from "@typed/devtools-protocol";
import ts from "typescript";
import type { RouteModulePlan } from "../route/RouteModulePlan.js";
import { analyzeRouteModule } from "../route/analyzeRouteModule.js";
import { analyzeTemplateModule } from "../template/analyzeTemplateModule.js";

export type CompilerSourceAnalyzerResponse = SourceAnalyzerResponse;
export type SourceAnalyzerPositionBase = "one-based" | "zero-based";

export interface CompilerSourceAnalyzerInput {
  readonly artifacts: readonly CompilerSourceArtifact[];
  /**
   * Position base for request and range line/column values. Chrome DevTools
   * sources positions are zero-based, so zero-based is the default.
   */
  readonly positionBase?: SourceAnalyzerPositionBase;
  readonly range?: CompilerSourceRange;
  readonly request: SourceAnalyzerRequest;
}

export interface CompilerSourceArtifact {
  readonly moduleId: string;
  readonly resource: string;
  readonly resourceAliases?: readonly string[];
  readonly sourceText: string;
}

export interface CompilerSourceRange {
  readonly end?: CompilerSourcePosition;
  readonly start: CompilerSourcePosition;
}

export interface CompilerSourcePosition {
  readonly column: number;
  readonly line: number;
}

interface PlannedSourceFact {
  readonly fact: SourceAnalyzerFact;
  readonly span: SourceSpan;
}

interface SourceSpan {
  readonly end: number;
  readonly start: number;
}

interface ArtifactAnalysis {
  readonly artifact: CompilerSourceArtifact;
  readonly declarationSpans: DeclarationSpanIndex;
  readonly route: RouteModulePlan;
  readonly sourceFile: ts.SourceFile;
}

interface DeclarationSpanIndex {
  readonly next: (name: string) => SourceSpan | undefined;
}

export function planSourceAnalyzerResponse(
  input: CompilerSourceAnalyzerInput,
): CompilerSourceAnalyzerResponse {
  const artifact = resolveArtifact(input.request.resource, input.artifacts);
  if (!artifact) return unavailable(input.request);
  const facts = factsForArtifact(analyzeArtifact(artifact));
  return {
    _tag: "SourceFacts",
    facts: filterFacts(facts, input).map((fact) => fact.fact),
    requestedAt: input.request.requestedAt,
    resource: input.request.resource,
  };
}

function resolveArtifact(
  resource: string,
  artifacts: readonly CompilerSourceArtifact[],
): CompilerSourceArtifact | undefined {
  return artifacts.find((artifact) => resourceKeys(artifact).has(normalizeResource(resource)));
}

function resourceKeys(artifact: CompilerSourceArtifact): ReadonlySet<string> {
  return new Set(
    [artifact.resource, artifact.moduleId, ...(artifact.resourceAliases ?? [])].map(
      normalizeResource,
    ),
  );
}

function unavailable(request: SourceAnalyzerRequest): CompilerSourceAnalyzerResponse {
  return {
    _tag: "Unavailable",
    reason: `No compiler artifact matched ${request.resource}.`,
    requestedAt: request.requestedAt,
  };
}

function analyzeArtifact(artifact: CompilerSourceArtifact): ArtifactAnalysis {
  const sourceFile = ts.createSourceFile(
    artifact.moduleId,
    artifact.sourceText,
    ts.ScriptTarget.Latest,
    true,
  );
  return {
    artifact,
    declarationSpans: declarationSpanIndex(sourceFile),
    route: analyzeRouteModule({
      moduleId: artifact.moduleId,
      sourceFile,
      sourceText: artifact.sourceText,
      ts,
    }),
    sourceFile,
  };
}

function factsForArtifact(analysis: ArtifactAnalysis): readonly PlannedSourceFact[] {
  return [
    ...templateFacts(analysis.artifact),
    ...refSubjectFacts(analysis),
    ...fxClosureFacts(analysis),
  ].sort(comparePlannedFact);
}

function templateFacts(artifact: CompilerSourceArtifact): readonly PlannedSourceFact[] {
  const analysis = analyzeTemplateModule({
    moduleId: artifact.moduleId,
    sourceText: artifact.sourceText,
  });
  return analysis.templates.map((template) => {
    const displayName = template.localName ?? `template:${template.plan.templateHash}`;
    return {
      fact: {
        _tag: "ComponentDefinition",
        componentId: makeComponentId(`${artifact.moduleId}#${displayName}`),
        displayName,
        sourceLocationId: sourceLocationId(artifact.moduleId, template.templateSpan.start),
      },
      span: template.templateSpan,
    };
  });
}

function refSubjectFacts(analysis: ArtifactAnalysis): readonly PlannedSourceFact[] {
  return [...analysis.route.services, ...analysis.route.inlineRefSubjects].flatMap((service) => {
    const span = analysis.declarationSpans.next(service.localName);
    if (!span) return [];
    return {
      fact: {
        _tag: "RefSubjectDefinition",
        refSubjectId: makeRefSubjectId(service.serviceId),
        sourceLocationId: sourceLocationId(analysis.artifact.moduleId, span.start),
      },
      span,
    };
  });
}

function fxClosureFacts(analysis: ArtifactAnalysis): readonly PlannedSourceFact[] {
  return analysis.route.closures.flatMap((closure) => {
    const span = analysis.declarationSpans.next(closure.name);
    if (!span) return [];
    return {
      fact: {
        _tag: "FxDefinition",
        fxNodeId: makeFxNodeId(`${analysis.artifact.moduleId}#closure:${closure.name}`),
        sourceLocationId: sourceLocationId(analysis.artifact.moduleId, span.start),
      },
      span,
    };
  });
}

function filterFacts(
  facts: readonly PlannedSourceFact[],
  input: CompilerSourceAnalyzerInput,
): readonly PlannedSourceFact[] {
  const range = selectionRange(input);
  if (!range) return facts;
  return facts.filter((fact) => spansOverlap(range, fact.span));
}

function selectionRange(input: CompilerSourceAnalyzerInput): SourceSpan | undefined {
  if (input.range) return rangeToSpan(input.range, input);
  if (input.request.line === undefined || input.request.column === undefined) return undefined;
  const sourceText = resolvedSourceText(input);
  const start = offsetAt(
    sourceText,
    input.request.line,
    input.request.column,
    input.positionBase ?? "zero-based",
  );
  return { start, end: start + 1 };
}

function resolvedSourceText(input: CompilerSourceAnalyzerInput): string {
  return resolveArtifact(input.request.resource, input.artifacts)?.sourceText ?? "";
}

function rangeToSpan(range: CompilerSourceRange, input: CompilerSourceAnalyzerInput): SourceSpan {
  const sourceText = resolvedSourceText(input);
  const positionBase = input.positionBase ?? "zero-based";
  const start = offsetAt(sourceText, range.start.line, range.start.column, positionBase);
  const end = range.end
    ? offsetAt(sourceText, range.end.line, range.end.column, positionBase)
    : start + 1;
  return { start, end: Math.max(start + 1, end) };
}

function offsetAt(
  sourceText: string,
  line: number,
  column: number,
  positionBase: SourceAnalyzerPositionBase,
): number {
  const oneBasedLine = positionBase === "zero-based" ? line + 1 : line;
  const oneBasedColumn = positionBase === "zero-based" ? column + 1 : column;
  const lines = sourceText.split("\n");
  const beforeLine = lines.slice(0, Math.max(0, oneBasedLine - 1)).join("\n");
  const lineStart = beforeLine.length === 0 ? 0 : beforeLine.length + 1;
  return Math.min(sourceText.length, lineStart + Math.max(0, oneBasedColumn - 1));
}

function sourceLocationId(moduleId: string, offset: number) {
  return makeSourceLocationId(`${moduleId}:${offset}`);
}

function spansOverlap(left: SourceSpan, right: SourceSpan): boolean {
  return left.start < right.end && right.start < left.end;
}

function comparePlannedFact(left: PlannedSourceFact, right: PlannedSourceFact): number {
  const spanOrder = left.span.start - right.span.start;
  if (spanOrder !== 0) return spanOrder;
  return left.fact._tag.localeCompare(right.fact._tag);
}

function normalizeResource(resource: string): string {
  return decodeURIComponent(resource)
    .replace(/^file:\/\//, "")
    .replaceAll("\\", "/");
}

function declarationSpanIndex(sourceFile: ts.SourceFile): DeclarationSpanIndex {
  const spans = new Map<string, SourceSpan[]>();
  visit(sourceFile, (node) => {
    const name = declarationName(node);
    if (!name) return;
    const list = spans.get(name.text) ?? [];
    list.push({ start: name.getStart(sourceFile), end: name.getEnd() });
    spans.set(name.text, list);
  });
  for (const list of spans.values()) {
    list.sort((left, right) => left.start - right.start);
  }
  return {
    next(name) {
      return spans.get(name)?.shift();
    },
  };
}

function declarationName(node: ts.Node): ts.Identifier | undefined {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) return node.name;
  if (ts.isFunctionDeclaration(node) && node.name) return node.name;
  if (ts.isClassDeclaration(node) && node.name) return node.name;
  return undefined;
}

function visit(node: ts.Node, onNode: (node: ts.Node) => void): void {
  onNode(node);
  ts.forEachChild(node, (child) => visit(child, onNode));
}
