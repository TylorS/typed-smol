import ts from "typescript";
import {
  createCompilerDiagnostic,
  type TypedCompilerDiagnostic,
} from "../diagnostics/diagnostics.js";
import { emitViteRouteHmrGlue } from "../hmr/viteHmr.js";
import { classifyRouteCaptures } from "./classifyRouteCaptures.js";
import type { RouteCaptureFact, RouteClosureFact } from "./RouteModulePlan.js";

export interface TransformRouteModuleInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly checker?: ts.TypeChecker;
  readonly dependencyFingerprints?: readonly string[];
  readonly refSubjectType?: ts.Type;
  readonly sourceFile?: ts.SourceFile;
  readonly templateHashes?: readonly string[];
  readonly ts?: typeof ts;
  readonly version?: string;
}

export interface TransformRouteModuleResult {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly transformed: boolean;
  readonly plan: RouteTransformPlan;
  readonly diagnostics: readonly TypedCompilerDiagnostic[];
}

export interface RouteTransformPlan {
  readonly moduleId: string;
  readonly continuations: readonly RouteTransformContinuation[];
}

export interface RouteTransformContinuation {
  readonly moduleId: string;
  readonly symbolId: string;
  readonly closureName: string;
  readonly captures: readonly RouteCaptureFact[];
  readonly captureFingerprint: string;
  readonly contextFingerprint: string;
  readonly dependencyFingerprints: readonly string[];
  readonly templateHashes: readonly string[];
  readonly compatibilityFingerprint: string;
  readonly version: string;
}

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

interface ClosureTarget {
  readonly name: string;
  readonly node: ts.FunctionLikeDeclaration;
}

export function transformRouteModule(
  input: TransformRouteModuleInput,
): TransformRouteModuleResult {
  const tsMod = input.ts ?? ts;
  const sourceFile = hasParentPointers(input.sourceFile) ? input.sourceFile : sourceFileFor(tsMod, input);
  const classification = classifyRouteCaptures({
    checker: input.checker,
    moduleId: input.moduleId,
    refSubjectType: input.refSubjectType,
    sourceFile,
    ts: tsMod,
  });
  const diagnostics = classification.diagnostics.map(toCompilerDiagnostic);
  const supported = classification.closures.filter(hasSupportedCaptures);
  const unsupported = classification.closures.some(hasUnsupportedCapture);
  if (unsupported) return unchanged(input, [], diagnostics);

  const continuations = supported.map((closure) => continuation(input, closure));
  const targets = collectClosureTargets(sourceFile);
  const edits = inlineRefSubjectEdits(sourceFile, continuations);
  if (continuations.length === 0 && edits.length === 0) return unchanged(input, [], diagnostics);

  const sourceText = applyEdits(input.sourceText, [
    declarationEdit(sourceFile, declarationText(sourceFile, continuations, targets, edits.length > 0)),
    ...edits,
    ...closureRewriteEdits(sourceFile, continuations, targets),
  ]);

  return {
    diagnostics,
    moduleId: input.moduleId,
    plan: { continuations, moduleId: input.moduleId },
    sourceText,
    transformed: true,
  };
}

function hasParentPointers(sourceFile: ts.SourceFile | undefined): sourceFile is ts.SourceFile {
  if (!sourceFile) return false;
  return sourceFile.statements.every((statement) => statement.parent === sourceFile);
}

function sourceFileFor(tsMod: typeof ts, input: TransformRouteModuleInput): ts.SourceFile {
  return tsMod.createSourceFile(input.moduleId, input.sourceText, tsMod.ScriptTarget.Latest, true);
}

function unchanged(
  input: TransformRouteModuleInput,
  continuations: readonly RouteTransformContinuation[],
  diagnostics: readonly TypedCompilerDiagnostic[],
): TransformRouteModuleResult {
  return {
    diagnostics,
    moduleId: input.moduleId,
    plan: { continuations, moduleId: input.moduleId },
    sourceText: input.sourceText,
    transformed: false,
  };
}

function hasSupportedCaptures(closure: RouteClosureFact): boolean {
  return closure.captures.length > 0 && !hasUnsupportedCapture(closure);
}

function hasUnsupportedCapture(closure: RouteClosureFact): boolean {
  return closure.captures.some((capture) => capture.kind === "unsupported");
}

function collectClosureTargets(sourceFile: ts.SourceFile): readonly ClosureTarget[] {
  const targets: ClosureTarget[] = [];
  visit(sourceFile, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const closure = closureExpression(node.initializer);
      if (closure) targets.push({ name: node.name.text, node: closure });
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      targets.push({ name: node.name.text, node });
    }
  });
  return targets;
}

function closureExpression(expression: ts.Expression | undefined): ts.FunctionLikeDeclaration | undefined {
  if (!expression) return undefined;
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) return expression;
  if (!ts.isCallExpression(expression)) return undefined;
  for (const argument of expression.arguments) {
    if (isFunctionLike(argument)) return argument;
  }
  return undefined;
}

function isFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node);
}

function continuation(
  input: TransformRouteModuleInput,
  closure: RouteClosureFact,
): RouteTransformContinuation {
  const dependencyFingerprints = [...(input.dependencyFingerprints ?? [])].sort();
  const templateHashes = [...(input.templateHashes ?? [])].sort();
  const version = input.version ?? "1";
  const symbolId = `${input.moduleId}#closure:${closure.name}`;
  const captures = stableCaptures(closure.captures);
  const captureFingerprint = routeCaptureFingerprint(captures);
  const contextFingerprint = routeContextFingerprint(captures);
  return {
    captureFingerprint,
    captures,
    closureName: closure.name,
    compatibilityFingerprint: compatibilityFingerprint({
      captureFingerprint,
      contextFingerprint,
      dependencyFingerprints,
      symbolId,
      templateHashes,
      version,
    }),
    contextFingerprint,
    dependencyFingerprints,
    moduleId: input.moduleId,
    symbolId,
    templateHashes,
    version,
  };
}

function inlineRefSubjectEdits(
  sourceFile: ts.SourceFile,
  continuations: readonly RouteTransformContinuation[],
): readonly TextEdit[] {
  const captures = continuations.flatMap((item) =>
    item.captures.filter((capture) => capture.kind === "inline-refsubject-migration"),
  );
  return captures.flatMap((capture) => inlineRefSubjectEdit(sourceFile, capture));
}

function inlineRefSubjectEdit(
  sourceFile: ts.SourceFile,
  capture: Extract<RouteCaptureFact, { readonly kind: "inline-refsubject-migration" }>,
): readonly TextEdit[] {
  const start = sourceFile.text.indexOf(capture.initializerSource);
  if (start < 0) return [];
  return [
    {
      end: start + capture.initializerSource.length,
      start,
      text: hmrInitializer(capture),
    },
  ];
}

function hmrInitializer(
  capture: Extract<RouteCaptureFact, { readonly kind: "inline-refsubject-migration" }>,
): string {
  const create = capture.initializerSource.replace(/^yield\*\s*/, "");
  return `yield* __typedGetHmrStateEffect(${JSON.stringify(capture.serviceId)}, () => ${create})`;
}

function declarationText(
  sourceFile: ts.SourceFile,
  continuations: readonly RouteTransformContinuation[],
  targets: readonly ClosureTarget[],
  needsHmrHelper: boolean,
): string {
  return [
    routeRuntimeImports(continuations),
    needsHmrHelper ? hmrHelperText() : "",
    routeHmrGlue(continuations),
    ...continuations.flatMap((continuation, index) =>
      continuationDeclarations(sourceFile, continuation, targetFor(continuation, targets)?.node, index),
    ),
  ].filter(Boolean).join("\n");
}

function routeHmrGlue(continuations: readonly RouteTransformContinuation[]): string {
  if (continuations.length === 0) return "";
  return emitViteRouteHmrGlue({
    moduleId: continuations[0]?.moduleId ?? "",
    compatibilityFingerprint: JSON.stringify({
      continuations: continuations.map((continuation) => continuation.compatibilityFingerprint).sort(),
      version: continuations[0]?.version ?? "1",
    }),
  });
}

function hmrHelperText(): string {
  return [
    'import { getOrCreateHmrStateEffect as __typedGetOrCreateHmrStateEffect } from "@typed/app/runtime/hmrRegistry";',
    "const __typedGetHmrStateEffect = (serviceId, create) => __typedGetOrCreateHmrStateEffect({ moduleId: import.meta.url, serviceId, shapeFingerprint: serviceId }, create);",
  ].join("\n");
}

function routeRuntimeImports(continuations: readonly RouteTransformContinuation[]): string {
  if (continuations.length === 0) return "";
  return [
    'import * as __typedRouteContext from "effect/Context";',
    'import * as __typedRouteEffect from "effect/Effect";',
    'import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";',
  ].join("\n");
}

function continuationDeclarations(
  sourceFile: ts.SourceFile,
  continuation: RouteTransformContinuation,
  target: ts.FunctionLikeDeclaration | undefined,
  index: number,
): readonly string[] {
  return [
    ...generatedContextServiceDeclarations(continuation, index),
    `const __typed_route_context_${index} = ${jsonSource(contextDescriptor(continuation))};`,
    `const __typed_route_descriptor_${index} = ${jsonSource(descriptor(continuation))};`,
    `const __typed_route_continuation_${index} = ${continuationSymbol(sourceFile, continuation, target, index)};`,
    continuationRegistration(continuation, index),
  ];
}

function continuationRegistration(
  continuation: RouteTransformContinuation,
  continuationIndex: number,
): string {
  const captures = serviceCaptures(continuation);
  return [
    "__typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {",
    `  descriptor: __typed_route_descriptor_${continuationIndex},`,
    `  continuation: __typed_route_continuation_${continuationIndex},`,
    captures.length === 0
      ? "  providers: []"
      : [
          "  providers: [",
          ...captures.map(
            (_capture, captureIndex) =>
              `    { tag: ${generatedServiceName(continuationIndex, captureIndex)}, valueIndex: ${captureIndex} },`,
          ),
          "  ]",
        ].join("\n").replace(",\n  ]", "\n  ]"),
    "});",
  ].join("\n");
}

function generatedContextServiceDeclarations(
  continuation: RouteTransformContinuation,
  continuationIndex: number,
): readonly string[] {
  return serviceCaptures(continuation).map((capture, captureIndex) =>
    `class ${generatedServiceName(continuationIndex, captureIndex)} extends __typedRouteContext.Service<${generatedServiceName(continuationIndex, captureIndex)}, ${serviceShape(capture)}>()(${JSON.stringify(generatedServiceId(continuation, capture))}) {}`,
  );
}

function continuationSymbol(
  sourceFile: ts.SourceFile,
  continuation: RouteTransformContinuation,
  target: ts.FunctionLikeDeclaration | undefined,
  index: number,
): string {
  if (!target) return `{ descriptor: __typed_route_descriptor_${index} }`;
  return `Object.assign(${continuationFunction(sourceFile, continuation, target, index)}, { descriptor: __typed_route_descriptor_${index} })`;
}

function continuationFunction(
  sourceFile: ts.SourceFile,
  continuation: RouteTransformContinuation,
  target: ts.FunctionLikeDeclaration,
  index: number,
): string {
  return effectContinuation(sourceFile, continuation, target, index);
}

function continuationBody(
  sourceFile: ts.SourceFile,
  continuation: RouteTransformContinuation,
  target: ts.FunctionLikeDeclaration,
  index: number,
): string {
  const params = generatedContextBindings(continuation, index);
  const body = target.body;
  if (!body) return block(params, []);
  if (!ts.isBlock(body)) return block(params, [expressionBodyStatement(sourceFile, body)]);
  return block(params, body.statements.map((statement) => statement.getText(sourceFile)));
}

function expressionBodyStatement(sourceFile: ts.SourceFile, expression: ts.Expression): string {
  const text = expression.getText(sourceFile);
  return isPipeExpression(expression) ? `return yield* ${text};` : `return ${text};`;
}

function isPipeExpression(expression: ts.Expression): boolean {
  const unwrapped = unwrapExpression(expression);
  return (
    ts.isCallExpression(unwrapped) &&
    ts.isPropertyAccessExpression(unwrapped.expression) &&
    unwrapped.expression.name.text === "pipe"
  );
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

function effectContinuation(
  sourceFile: ts.SourceFile,
  continuation: RouteTransformContinuation,
  target: ts.FunctionLikeDeclaration,
  index: number,
): string {
  const body = continuationBody(sourceFile, continuation, target, index);
  if (hasAsyncModifier(target)) {
    return `__typedRouteEffect.gen(function* () ${asyncContinuationBody(sourceFile, continuation, target, index)})`;
  }
  return `__typedRouteEffect.gen(function* () ${body})`;
}

function asyncContinuationBody(
  sourceFile: ts.SourceFile,
  continuation: RouteTransformContinuation,
  target: ts.FunctionLikeDeclaration,
  index: number,
): string {
  const params = generatedContextBindings(continuation, index);
  const body = target.body;
  const asyncBody = !body
    ? "{}"
    : ts.isBlock(body)
      ? body.getText(sourceFile)
      : `{ return ${body.getText(sourceFile)}; }`;
  return block(params, [`return yield* __typedRouteEffect.promise(() => (async () => ${asyncBody})());`]);
}

function generatedContextBindings(
  continuation: RouteTransformContinuation,
  continuationIndex: number,
): readonly string[] {
  const generated = serviceCaptures(continuation).map((capture, captureIndex) =>
    `const ${capture.name} = yield* ${generatedServiceName(continuationIndex, captureIndex)};`,
  );
  const services = continuation.captures.flatMap((capture) =>
    capture.kind === "effect-service" && capture.serviceName && capture.serviceName !== capture.name
      ? [`const ${capture.name} = yield* ${capture.serviceName};`]
      : [],
  );
  return [...generated, ...services];
}

function block(prefix: readonly string[], statements: readonly string[]): string {
  return `{\n${[...prefix, ...statements].map((line) => `  ${line}`).join("\n")}\n}`;
}

function closureRewriteEdits(
  sourceFile: ts.SourceFile,
  continuations: readonly RouteTransformContinuation[],
  targets: readonly ClosureTarget[],
): readonly TextEdit[] {
  const rewriteTargets = continuations.flatMap((continuation, index) => {
    const target = targetFor(continuation, targets);
    if (!target) return [];
    return [{ continuation, index, target }];
  });
  const topLevelTargets = rewriteTargets.filter(
    (item) => !rewriteTargets.some((other) => other !== item && containsNode(other.target.node, item.target.node)),
  );
  return topLevelTargets.map((item) => closureRewriteEdit(sourceFile, item.target.node, item.continuation, item.index));
}

function targetFor(
  continuation: RouteTransformContinuation,
  targets: readonly ClosureTarget[],
): ClosureTarget | undefined {
  return targets.find((candidate) => candidate.name === continuation.closureName);
}

function closureRewriteEdit(
  sourceFile: ts.SourceFile,
  node: ts.FunctionLikeDeclaration,
  continuation: RouteTransformContinuation,
  index: number,
): TextEdit {
  return {
    end: node.end,
    start: node.getStart(sourceFile),
    text: wrapperFunction(sourceFile, node, continuation, index),
  };
}

function wrapperFunction(
  sourceFile: ts.SourceFile,
  node: ts.FunctionLikeDeclaration,
  continuation: RouteTransformContinuation,
  index: number,
): string {
  const params = node.parameters.map((parameter) => parameter.getText(sourceFile)).join(", ");
  const call = providedContinuationCall(node, continuation, index);
  if (ts.isArrowFunction(node)) return `${asyncPrefix(node)}(${params}) => ${call}`;
  return `${asyncPrefix(node)}function${node.asteriskToken ? "*" : ""} ${functionName(node)}(${params}) { ${returnContinuation(node, call)} }`;
}

function providedContinuationCall(
  node: ts.FunctionLikeDeclaration,
  continuation: RouteTransformContinuation,
  index: number,
): string {
  const providers = serviceCaptures(continuation).map((capture, captureIndex) =>
    `__typedRouteEffect.provideService(${generatedServiceName(index, captureIndex)}, ${capture.name})`,
  );
  if (providers.length === 0) return `__typed_route_continuation_${index}`;
  return `__typed_route_continuation_${index}.pipe(${providers.join(", ")})`;
}

function serviceCaptures(
  continuation: RouteTransformContinuation,
): readonly RouteCaptureFact[] {
  return continuation.captures.filter(
    (capture) =>
      capture.kind === "generated-context" ||
      capture.kind === "inline-refsubject-migration" ||
      capture.kind === "serializable-value" ||
      capture.kind === "template-value",
  );
}

function generatedServiceName(continuationIndex: number, captureIndex: number): string {
  return `__typed_route_context_${continuationIndex}_${captureIndex}`;
}

function generatedServiceId(
  continuation: RouteTransformContinuation,
  capture: RouteCaptureFact,
): string {
  return `${continuation.moduleId}#${continuation.closureName}:${capture.kind}:${capture.name}`;
}

function serviceShape(capture: RouteCaptureFact): string {
  return "typeText" in capture && capture.typeText ? capture.typeText : "unknown";
}

function containsNode(parent: ts.Node, child: ts.Node): boolean {
  return parent.getStart() <= child.getStart() && parent.end >= child.end;
}

function returnContinuation(node: ts.FunctionLikeDeclaration, call: string): string {
  if (node.asteriskToken) return `return yield* ${call};`;
  if (hasAsyncModifier(node)) return `return await ${call};`;
  return `return ${call};`;
}

function functionName(node: ts.FunctionLikeDeclaration): string {
  return "name" in node && node.name ? node.name.getText() : "";
}

function asyncPrefix(node: ts.FunctionLikeDeclaration): string {
  return hasAsyncModifier(node) ? "async " : "";
}

function hasAsyncModifier(node: ts.FunctionLikeDeclaration): boolean {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) === true;
}

function contextDescriptor(continuation: RouteTransformContinuation): object {
  return {
    captures: serviceCaptures(continuation)
      .map((capture) => ({
        name: capture.name,
        serviceId: generatedServiceId(continuation, capture),
        type: serviceShape(capture),
      })),
    fingerprint: continuation.contextFingerprint,
  };
}

function descriptor(continuation: RouteTransformContinuation): object {
  const services = serviceCaptures(continuation).map((capture) => ({
    id: generatedServiceId(continuation, capture),
    kind: routeServiceDescriptorKind(capture),
    name: capture.name,
    typeText: serviceShape(capture),
  }));
  return {
    _tag: "Continuation",
    captures: [],
    captureFingerprint: continuation.captureFingerprint,
    closureName: continuation.closureName,
    compatibilityFingerprint: continuation.compatibilityFingerprint,
    contextFingerprint: continuation.contextFingerprint,
    dependencyFingerprints: continuation.dependencyFingerprints,
    fingerprint: continuation.compatibilityFingerprint,
    id: continuation.symbolId,
    moduleId: continuation.moduleId,
    serviceKeys: routeResumeDataAttrKeys(services),
    services,
    symbolId: continuation.symbolId,
    templateHashes: continuation.templateHashes,
  };
}

function routeResumeDataAttrKeys(
  services: readonly { readonly id: string; readonly name: string }[],
): object {
  return {
    fingerprint: "typed-route-resume-fingerprint",
    id: "typed-route-resume-id",
    values: services.map(routeResumeServiceDataAttrKey),
  };
}

function routeResumeServiceDataAttrKey(
  service: { readonly id: string; readonly name: string },
  index: number,
): string {
  return `typed-route-resume-value-${index}-${toDataAttrToken(service.name || service.id)}`;
}

function toDataAttrToken(value: string): string {
  const token = value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return token.length === 0 ? "service" : token;
}

function routeServiceDescriptorKind(capture: RouteCaptureFact): string {
  if (capture.kind === "generated-context") return "parameter";
  if (capture.kind === "inline-refsubject-migration") return "inline-refsubject-service";
  return capture.kind;
}

function declarationEdit(sourceFile: ts.SourceFile, text: string): TextEdit {
  const insertion = importInsertionIndex(sourceFile);
  const prefix = insertion === 0 ? "" : "\n";
  return { end: insertion, start: insertion, text: `${prefix}${text}\n\n` };
}

function importInsertionIndex(sourceFile: ts.SourceFile): number {
  let insertion = 0;
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) break;
    insertion = statement.end;
  }
  return insertion;
}

function applyEdits(sourceText: string, edits: readonly TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), sourceText);
}

function toCompilerDiagnostic(diagnostic: { readonly code: string; readonly message: string; readonly moduleId: string }): TypedCompilerDiagnostic {
  return createCompilerDiagnostic({
    code: diagnostic.code,
    fileName: diagnostic.moduleId,
    message: diagnostic.message,
    severity: "error",
    source: "compiler",
  });
}

function stableCaptures(captures: readonly RouteCaptureFact[]): readonly RouteCaptureFact[] {
  return captures;
}

function routeCaptureFingerprint(captures: readonly RouteCaptureFact[]): string {
  return `captures:${captures.map(captureFingerprint).sort().join("|")}`;
}

function routeContextFingerprint(captures: readonly RouteCaptureFact[]): string {
  return `context:${captures
    .filter(isCompilerProvidedServiceCapture)
    .map((capture) => `${capture.kind}:${capture.name}:${serviceShape(capture)}`)
    .sort()
    .join("|")}`;
}

function isCompilerProvidedServiceCapture(capture: RouteCaptureFact): boolean {
  return (
    capture.kind === "generated-context" ||
    capture.kind === "inline-refsubject-migration" ||
    capture.kind === "serializable-value" ||
    capture.kind === "template-value"
  );
}

function captureFingerprint(capture: RouteCaptureFact): string {
  if ("serviceId" in capture) return `${capture.kind}:${capture.name}:${capture.serviceId}`;
  if (capture.kind === "serializable-value") {
    return `${capture.kind}:${capture.name}:${capture.descriptorName ?? ""}:${capture.typeText}`;
  }
  if (capture.kind === "template-value") return `${capture.kind}:${capture.name}:${capture.templateHash ?? ""}`;
  return `${capture.kind}:${capture.name}:${capture.reason}:${capture.typeText ?? ""}`;
}

function compatibilityFingerprint(input: {
  readonly captureFingerprint: string;
  readonly contextFingerprint: string;
  readonly dependencyFingerprints: readonly string[];
  readonly symbolId: string;
  readonly templateHashes: readonly string[];
  readonly version: string;
}): string {
  return JSON.stringify({
    captureFingerprint: input.captureFingerprint,
    contextFingerprint: input.contextFingerprint,
    dependencyFingerprints: input.dependencyFingerprints,
    symbolId: input.symbolId,
    templateHashes: input.templateHashes,
    version: input.version,
  });
}

function jsonSource(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function visit(node: ts.Node | undefined, f: (node: ts.Node) => void): void {
  if (!node) return;
  f(node);
  ts.forEachChild(node, (child) => visit(child, f));
}
