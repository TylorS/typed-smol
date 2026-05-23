import ts from "typescript";
import { planRouteCpsCompilation, type RouteClosureContinuation } from "../cps/planCpsCompilation.js";
import {
  createCompilerDiagnostic,
  sortDiagnostics,
  type TypedCompilerDiagnostic,
} from "../diagnostics/diagnostics.js";
import { analyzeRouteModule } from "./analyzeRouteModule.js";
import type { RouteDiagnostic, RouteModulePlan } from "./RouteModulePlan.js";

export interface TransformRouteModuleInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly ts?: typeof ts;
  readonly version?: string;
}

export interface TransformRouteModuleResult {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly transformed: boolean;
  readonly route: RouteModulePlan;
  readonly continuations: readonly RouteClosureContinuation[];
  readonly diagnostics: readonly TypedCompilerDiagnostic[];
}

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

interface ClosureRewrite {
  readonly closureName: string;
  readonly symbolName: string;
  readonly insert: TextEdit;
  readonly replace: TextEdit;
}

export function transformRouteModule(input: TransformRouteModuleInput): TransformRouteModuleResult {
  const tsMod = input.ts ?? ts;
  const route = analyzeRouteModule(input);
  const diagnostics = routeDiagnostics(input.moduleId, route.diagnostics);
  const cps = planRouteCpsCompilation(route, { version: input.version });
  const continuations = cps.continuations.filter(isRouteClosureContinuation);
  if (diagnostics.length > 0 || continuations.length === 0) {
    return unchanged(input, route, continuations, diagnostics);
  }

  const sourceFile = tsMod.createSourceFile(
    input.moduleId,
    input.sourceText,
    tsMod.ScriptTarget.Latest,
    true,
  );
  const rewrites = collectClosureRewrites(tsMod, sourceFile, continuations);
  if (rewrites.length === 0) return unchanged(input, route, continuations, diagnostics);

  const sourceText = applyEdits(input.sourceText, [
    ...rewrites.flatMap((rewrite) => [rewrite.insert, rewrite.replace]),
    descriptorEdit(input.sourceText, continuations, rewrites),
  ]);

  return {
    continuations,
    diagnostics,
    moduleId: input.moduleId,
    route,
    sourceText,
    transformed: true,
  };
}

function unchanged(
  input: TransformRouteModuleInput,
  route: RouteModulePlan,
  continuations: readonly RouteClosureContinuation[],
  diagnostics: readonly TypedCompilerDiagnostic[],
): TransformRouteModuleResult {
  return {
    continuations,
    diagnostics,
    moduleId: input.moduleId,
    route,
    sourceText: input.sourceText,
    transformed: false,
  };
}

function collectClosureRewrites(
  tsMod: typeof ts,
  sourceFile: ts.SourceFile,
  continuations: readonly RouteClosureContinuation[],
): readonly ClosureRewrite[] {
  const byName = new Map(continuations.map((continuation) => [continuation.closureName, continuation]));
  const usedNames = new Set<string>();
  const rewrites: ClosureRewrite[] = [];
  visit(tsMod, sourceFile, (node) => {
    if (!tsMod.isVariableDeclaration(node) || !tsMod.isIdentifier(node.name)) return;
    const continuation = byName.get(node.name.text);
    const initializer = closureInitializer(tsMod, node.initializer);
    const statement = variableStatement(tsMod, node);
    if (!continuation || !initializer || !statement) return;
    const symbolName = nextSymbolName(sourceFile.text, usedNames, continuation.closureName);
    rewrites.push({
      closureName: continuation.closureName,
      insert: {
        end: statement.getStart(sourceFile),
        start: statement.getStart(sourceFile),
        text: `const ${symbolName} = ${initializer.getText(sourceFile)};\n`,
      },
      replace: {
        end: initializer.getEnd(),
        start: initializer.getStart(sourceFile),
        text: symbolName,
      },
      symbolName,
    });
  });
  return rewrites;
}

function closureInitializer(tsMod: typeof ts, expression: ts.Expression | undefined): ts.Expression | undefined {
  if (!expression) return undefined;
  if (tsMod.isArrowFunction(expression) || tsMod.isFunctionExpression(expression)) return expression;
  return undefined;
}

function variableStatement(tsMod: typeof ts, node: ts.VariableDeclaration): ts.VariableStatement | undefined {
  const declarationList = node.parent;
  if (!tsMod.isVariableDeclarationList(declarationList)) return undefined;
  return tsMod.isVariableStatement(declarationList.parent) ? declarationList.parent : undefined;
}

function nextSymbolName(sourceText: string, usedNames: Set<string>, closureName: string): string {
  const base = `__typed_route_${safeIdentifierPart(closureName)}_continuation`;
  let candidate = base;
  let index = 0;
  while (sourceText.includes(candidate) || usedNames.has(candidate)) {
    index += 1;
    candidate = `${base}_${index}`;
  }
  usedNames.add(candidate);
  return candidate;
}

function descriptorEdit(
  sourceText: string,
  continuations: readonly RouteClosureContinuation[],
  rewrites: readonly ClosureRewrite[],
): TextEdit {
  return {
    end: sourceText.length,
    start: sourceText.length,
    text: `\n${descriptorSource(continuations, rewrites)}\n`,
  };
}

function descriptorSource(
  continuations: readonly RouteClosureContinuation[],
  rewrites: readonly ClosureRewrite[],
): string {
  const symbolNames = new Map(rewrites.map((rewrite) => [rewrite.closureName, rewrite.symbolName]));
  const descriptors = continuations.map((continuation) => ({
    ...continuation,
    symbolName: symbolNames.get(continuation.closureName),
  }));
  return `export const __typedRouteContinuations = ${JSON.stringify(descriptors, null, 2)} as const;`;
}

function routeDiagnostics(
  moduleId: string,
  diagnostics: readonly RouteDiagnostic[],
): readonly TypedCompilerDiagnostic[] {
  return sortDiagnostics(
    diagnostics.map((diagnostic) =>
      createCompilerDiagnostic({
        code: diagnostic.code,
        fileName: moduleId,
        message: diagnostic.message,
        severity: "error",
        source: "compiler",
      }),
    ),
  );
}

function isRouteClosureContinuation(
  continuation: unknown,
): continuation is RouteClosureContinuation {
  return (
    typeof continuation === "object" &&
    continuation !== null &&
    "kind" in continuation &&
    continuation.kind === "route-closure"
  );
}

function applyEdits(sourceText: string, edits: readonly TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end),
      sourceText,
    );
}

function safeIdentifierPart(value: string): string {
  const safe = value.replaceAll(/[^\dA-Za-z_$]/g, "_");
  return /^[A-Za-z_$]/.test(safe) ? safe : `_${safe}`;
}

function visit(tsMod: typeof ts, node: ts.Node, f: (node: ts.Node) => void): void {
  f(node);
  tsMod.forEachChild(node, (child) => visit(tsMod, child, f));
}
