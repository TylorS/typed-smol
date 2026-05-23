import ts from "typescript";
import { planRouteCpsCompilation, type RouteClosureContinuation } from "../cps/planCpsCompilation.js";
import {
  createCompilerDiagnostic,
  sortDiagnostics,
  type TypedCompilerDiagnostic,
} from "../diagnostics/diagnostics.js";
import { analyzeRouteModule } from "./analyzeRouteModule.js";
import type {
  RouteCaptureFact,
  RouteDiagnostic,
  RouteInlineRefSubjectFact,
  RouteModulePlan,
} from "./RouteModulePlan.js";

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
  const inlineRefSubjectRewrites = collectInlineRefSubjectRewrites(tsMod, sourceFile, route);
  if (rewrites.length === 0) return unchanged(input, route, continuations, diagnostics);
  const serializableAliases = collectSerializableDescriptorAliases(tsMod, sourceFile);
  const serializationNeeded = continuations.some(hasSerializableCaptures);

  const sourceText = applyEdits(input.sourceText, [
    ...(inlineRefSubjectRewrites.length > 0 ? [hmrMemoImportEdit()] : []),
    ...(serializationNeeded ? [serializableImportEdit()] : []),
    ...inlineRefSubjectRewrites,
    ...rewrites.flatMap((rewrite) => [rewrite.insert, rewrite.replace]),
    ...(route.inlineRefSubjects.length > 0 ? [generatedServicesEdit(input.sourceText, route)] : []),
    ...(hasParameterServices(continuations) ? [parameterServicesEdit(input.sourceText, continuations)] : []),
    descriptorEdit(input.sourceText, continuations, rewrites),
    ...(serializationNeeded
      ? [serializationDescriptorEdit(input.sourceText, continuations, serializableAliases)]
      : []),
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

function collectInlineRefSubjectRewrites(
  tsMod: typeof ts,
  sourceFile: ts.SourceFile,
  route: RouteModulePlan,
): readonly TextEdit[] {
  const services = new Map(route.inlineRefSubjects.map((service) => [service.localName, service]));
  const edits: TextEdit[] = [];
  visit(tsMod, sourceFile, (node) => {
    if (!tsMod.isVariableDeclaration(node) || !tsMod.isIdentifier(node.name)) return;
    const service = services.get(node.name.text);
    const call = service && inlineRefSubjectCall(tsMod, node.initializer);
    if (!call || !service) return;
    edits.push(inlineRefSubjectEdit(sourceFile, call, service));
  });
  return edits;
}

function inlineRefSubjectEdit(
  sourceFile: ts.SourceFile,
  call: ts.CallExpression,
  service: RouteInlineRefSubjectFact,
): TextEdit {
  return {
    end: call.getEnd(),
    start: call.getStart(sourceFile),
    text: hmrMemoEffectCall(call.getText(sourceFile), service.serviceId),
  };
}

function hmrMemoEffectCall(callSource: string, serviceId: string): string {
  return [
    `__typedGetOrCreateHmrMemoEffect(${JSON.stringify(serviceId)}, () => ${callSource}, `,
    "{ hotData: (import.meta as ImportMeta & ",
    "{ readonly hot?: { readonly data: Record<string, unknown> } }).hot?.data })",
  ].join("");
}

function generatedServicesEdit(sourceText: string, route: RouteModulePlan): TextEdit {
  return {
    end: sourceText.length,
    start: sourceText.length,
    text: `\nexport const __typedRouteGeneratedServices = ${JSON.stringify(
      route.inlineRefSubjects,
      null,
      2,
    )} as const;\n`,
  };
}

function parameterServicesEdit(
  sourceText: string,
  continuations: readonly RouteClosureContinuation[],
): TextEdit {
  return {
    end: sourceText.length,
    start: sourceText.length,
    text: `\nexport const __typedRouteParameterServices = ${JSON.stringify(
      continuations.flatMap((continuation) => continuation.parameters),
      null,
      2,
    )} as const;\n`,
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

function inlineRefSubjectCall(
  tsMod: typeof ts,
  expression: ts.Expression | undefined,
): ts.CallExpression | undefined {
  if (!expression) return undefined;
  if (tsMod.isCallExpression(expression) && isRefSubjectMakeCall(tsMod, expression)) return expression;
  if (tsMod.isYieldExpression(expression) && expression.expression) {
    return inlineRefSubjectCall(tsMod, expression.expression);
  }
  if (!isParsedYieldStar(tsMod, expression)) return undefined;
  return isRefSubjectMakeCall(tsMod, expression.right) ? expression.right : undefined;
}

function isParsedYieldStar(
  tsMod: typeof ts,
  expression: ts.Expression,
): expression is ts.BinaryExpression & { readonly right: ts.CallExpression } {
  return (
    tsMod.isBinaryExpression(expression) &&
    expression.operatorToken.kind === tsMod.SyntaxKind.AsteriskToken &&
    tsMod.isIdentifier(expression.left) &&
    expression.left.text === "yield" &&
    tsMod.isCallExpression(expression.right)
  );
}

function isRefSubjectMakeCall(tsMod: typeof ts, call: ts.CallExpression): boolean {
  const expression = call.expression;
  return (
    tsMod.isPropertyAccessExpression(expression) &&
    expression.expression.getText() === "RefSubject" &&
    expression.name.text === "make"
  );
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

function serializationDescriptorEdit(
  sourceText: string,
  continuations: readonly RouteClosureContinuation[],
  aliases: ReadonlyMap<string, string>,
): TextEdit {
  return {
    end: sourceText.length,
    start: sourceText.length,
    text: `\n${serializationDescriptorSource(continuations, aliases)}\n`,
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

function serializationDescriptorSource(
  continuations: readonly RouteClosureContinuation[],
  aliases: ReadonlyMap<string, string>,
): string {
  const entries = continuations
    .map((continuation) => continuationSerializationEntry(continuation, aliases))
    .filter((entry) => entry !== undefined);
  return [
    "export const __typedRouteContinuationSerializables = {",
    entries.map((entry) => `  ${entry}`).join(",\n"),
    "} as const;",
  ].join("\n");
}

function continuationSerializationEntry(
  continuation: RouteClosureContinuation,
  aliases: ReadonlyMap<string, string>,
): string | undefined {
  const captures = continuation.captures.filter(isSerializableCapture);
  if (captures.length === 0) return undefined;
  return `${JSON.stringify(continuation.id)}: __TypedSerializable.continuation(${JSON.stringify(
    continuation.id,
  )}, [${captures.map((capture) => captureSerializationSource(continuation, capture, aliases)).join(", ")}])`;
}

function captureSerializationSource(
  continuation: RouteClosureContinuation,
  capture: Extract<RouteCaptureFact, { kind: "context-capture" | "serializable-value" }>,
  aliases: ReadonlyMap<string, string>,
): string {
  const descriptor = aliases.get(capture.name) ?? generatedDescriptorSource(continuation, capture);
  return `__TypedSerializable.capture(${JSON.stringify(capture.name)}, ${descriptor})`;
}

function generatedDescriptorSource(
  continuation: RouteClosureContinuation,
  capture: Extract<RouteCaptureFact, { kind: "context-capture" | "serializable-value" }>,
): string {
  const id = `${continuation.moduleId}#capture:${capture.name}`;
  const plan = {
    fingerprint: JSON.stringify({
      id,
      initializerSource: capture.initializerSource,
      kind: capture.kind,
      version: continuation.version,
    }),
    source: {
      exportName: capture.name,
      fileName: continuation.moduleId,
    },
    typeId: id,
    version: 1,
  };
  return `__TypedSerializable.generated(${JSON.stringify(id)}, ${JSON.stringify(plan, null, 2)})`;
}

function collectSerializableDescriptorAliases(
  tsMod: typeof ts,
  sourceFile: ts.SourceFile,
): ReadonlyMap<string, string> {
  const aliases = new Map<string, string>();
  visit(tsMod, sourceFile, (node) => {
    if (!tsMod.isVariableDeclaration(node) || !tsMod.isIdentifier(node.name)) return;
    if (!isSerializableDescriptorCall(tsMod, node.initializer)) return;
    const captureName = captureNameFromDescriptorName(node.name.text);
    if (captureName) aliases.set(captureName, node.name.text);
  });
  return aliases;
}

function isSerializableDescriptorCall(tsMod: typeof ts, expression: ts.Expression | undefined): boolean {
  if (!expression || !tsMod.isCallExpression(expression)) return false;
  const call = expression.expression;
  if (!tsMod.isPropertyAccessExpression(call)) return false;
  if (call.name.text !== "schema" && call.name.text !== "generated") return false;
  return call.expression.getText() === "Serializable";
}

function captureNameFromDescriptorName(name: string): string | undefined {
  if (!name.endsWith("Serializable")) return undefined;
  const captureName = name.slice(0, -"Serializable".length);
  return captureName.length > 0 ? captureName : undefined;
}

function hasSerializableCaptures(continuation: RouteClosureContinuation): boolean {
  return continuation.captures.some(isSerializableCapture);
}

function hasParameterServices(continuations: readonly RouteClosureContinuation[]): boolean {
  return continuations.some((continuation) => continuation.parameters.length > 0);
}

function isSerializableCapture(
  capture: RouteCaptureFact,
): capture is Extract<RouteCaptureFact, { kind: "context-capture" | "serializable-value" }> {
  return capture.kind === "context-capture" || capture.kind === "serializable-value";
}

function serializableImportEdit(): TextEdit {
  return {
    end: 0,
    start: 0,
    text: 'import { Serializable as __TypedSerializable } from "@typed/app";\n',
  };
}

function hmrMemoImportEdit(): TextEdit {
  return {
    end: 0,
    start: 0,
    text: 'import { getOrCreateHmrMemoEffect as __typedGetOrCreateHmrMemoEffect } from "@typed/app/runtime";\n',
  };
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
