import ts from "typescript";
import type { RouteCaptureFact, RouteClosureFact, RouteDiagnostic } from "./RouteModulePlan.js";

export interface ClassifyRouteCapturesInput {
  readonly moduleId: string;
  readonly sourceFile: ts.SourceFile;
  readonly checker?: ts.TypeChecker;
  readonly refSubjectType?: ts.Type;
  readonly ts?: typeof ts;
}

export interface RouteCaptureClassification {
  readonly moduleId: string;
  readonly closures: readonly RouteClosureFact[];
  readonly diagnostics: readonly RouteDiagnostic[];
}

interface DeclarationFact {
  readonly name: string;
  readonly declarationKind: "const" | "let" | "var" | "parameter" | "function" | "unknown";
  readonly initializer?: ts.Expression;
  readonly node: ts.Node;
}

interface ClassificationContext {
  readonly checker?: ts.TypeChecker;
  readonly declarations: ReadonlyMap<string, DeclarationFact>;
  readonly diagnostics: RouteDiagnostic[];
  readonly importedNames: ReadonlySet<string>;
  readonly moduleId: string;
  readonly refSubjectType?: ts.Type;
  readonly serviceAliases: ReadonlyMap<string, RouteCaptureFact>;
  readonly sourceFile: ts.SourceFile;
}

export function classifyRouteCaptures(
  input: ClassifyRouteCapturesInput,
): RouteCaptureClassification {
  const context = createContext(input);
  const closures = collectClosures(input.sourceFile).map((closure) =>
    classifyClosure(context, closure),
  );

  return {
    closures,
    diagnostics: context.diagnostics,
    moduleId: input.moduleId,
  };
}

function createContext(input: ClassifyRouteCapturesInput): ClassificationContext {
  const declarations = collectDeclarations(input.sourceFile);
  return {
    checker: input.checker,
    declarations,
    diagnostics: [],
    importedNames: collectImportedNames(input.sourceFile),
    moduleId: input.moduleId,
    refSubjectType: input.refSubjectType,
    serviceAliases: collectServiceAliases(input.sourceFile, declarations),
    sourceFile: input.sourceFile,
  };
}

function collectDeclarations(sourceFile: ts.SourceFile): ReadonlyMap<string, DeclarationFact> {
  const declarations = new Map<string, DeclarationFact>();
  visit(sourceFile, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      declarations.set(node.name.text, variableDeclarationFact(node));
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      declarations.set(node.name.text, {
        declarationKind: "function",
        name: node.name.text,
        node,
      });
    }
  });
  return declarations;
}

function variableDeclarationFact(node: ts.VariableDeclaration): DeclarationFact {
  if (!ts.isIdentifier(node.name)) {
    return {
      declarationKind: "unknown",
      name: node.name.getText(),
      node,
    };
  }
  return {
    declarationKind: variableDeclarationKind(node),
    initializer: node.initializer,
    name: node.name.text,
    node,
  };
}

function variableDeclarationKind(node: ts.VariableDeclaration): DeclarationFact["declarationKind"] {
  const flags = node.parent.flags;
  if ((flags & ts.NodeFlags.Const) !== 0) return "const";
  if ((flags & ts.NodeFlags.Let) !== 0) return "let";
  return "var";
}

interface ClosureCandidate {
  readonly name: string;
  readonly node: ts.FunctionLikeDeclaration;
}

function collectClosures(sourceFile: ts.SourceFile): readonly ClosureCandidate[] {
  const closures: ClosureCandidate[] = [];
  visit(sourceFile, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const closure = closureExpression(node.initializer);
      if (closure) closures.push({ name: node.name.text, node: closure });
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      closures.push({ name: node.name.text, node });
    }
  });
  return closures;
}

function classifyClosure(
  context: ClassificationContext,
  closure: ClosureCandidate,
): RouteClosureFact {
  const captures = new Map<string, RouteCaptureFact>();
  for (const parameter of closure.node.parameters) {
    addParameterCapture(context, captures, parameter);
  }

  const declared = declaredNames(closure.node);
  visitClosureBody(closure.node.body, (node) => {
    if (!ts.isIdentifier(node) || declared.has(node.text) || isDeclarationName(node)) return;
    const capture = classifyIdentifier(context, node);
    if (capture) captures.set(node.text, capture);
  });

  return {
    captures: [...captures.values()],
    moduleId: context.moduleId,
    name: closure.name,
  };
}

function addParameterCapture(
  context: ClassificationContext,
  captures: Map<string, RouteCaptureFact>,
  parameter: ts.ParameterDeclaration,
): void {
  if (!ts.isIdentifier(parameter.name)) return;
  const name = parameter.name.text;
  captures.set(name, {
    kind: "generated-context",
    name,
    serviceId: `${context.moduleId}#param:${name}`,
    typeText: typeText(context, parameter),
  });
}

function classifyIdentifier(
  context: ClassificationContext,
  node: ts.Identifier,
): RouteCaptureFact | undefined {
  const name = node.text;
  const service = context.serviceAliases.get(name);
  if (service) return service;
  if (context.importedNames.has(name) || allowedRouteGlobalNames.has(name)) return undefined;

  const declaration = context.declarations.get(name);
  if (!declaration) return unsupportedUnknown(context, name);
  if (isEventHandlerAction(declaration)) return eventActionCapture(context, declaration);
  if (isTemplateEventCapture(node) && isNonResumableEventHandler(declaration)) {
    return unsupportedEventHandler(context, declaration);
  }
  if (declaration.declarationKind === "let" || declaration.declarationKind === "var") {
    return unsupportedMutable(context, declaration);
  }
  if (isInlineRefSubjectMigration(context, declaration)) {
    return inlineRefSubjectMigration(context, declaration);
  }
  if (isTemplateValue(declaration)) return { kind: "template-value", name };
  if (isSerializableValue(context, declaration)) {
    return {
      kind: "serializable-value",
      name,
      typeText: typeText(context, declaration.node),
    };
  }
  return undefined;
}

const allowedRouteGlobalNames = new Set([
  "Array",
  "BigInt",
  "Boolean",
  "Context",
  "Date",
  "Effect",
  "Error",
  "JSON",
  "Math",
  "Number",
  "Object",
  "Promise",
  "RefSubject",
  "String",
  "Symbol",
  "URL",
  "URLSearchParams",
  "console",
  "html",
  "undefined",
]);

function unsupportedUnknown(context: ClassificationContext, name: string): RouteCaptureFact {
  context.diagnostics.push({
    code: "unsupported-closure-capture",
    message: `Cannot rewrite closure in ${context.moduleId}: ${name} is not an imported, top-level, service, serializable, template, or generated context value`,
    moduleId: context.moduleId,
  });
  return {
    kind: "unsupported",
    name,
    reason: "unknown-capture",
    typeText: "unknown",
  };
}

function unsupportedMutable(
  context: ClassificationContext,
  declaration: DeclarationFact,
): RouteCaptureFact {
  context.diagnostics.push({
    code: "unsupported-closure-capture",
    message: `Cannot rewrite closure in ${context.moduleId}: ${declaration.name} is mutable`,
    moduleId: context.moduleId,
  });
  return {
    kind: "unsupported",
    name: declaration.name,
    reason: "mutable-local",
    typeText: typeText(context, declaration.node),
  };
}

function unsupportedEventHandler(
  context: ClassificationContext,
  declaration: DeclarationFact,
): RouteCaptureFact {
  context.diagnostics.push({
    code: "unsupported-closure-capture",
    message: `Cannot rewrite closure in ${context.moduleId}: ${declaration.name} is a non-resumable event handler; use EventHandler.action(...)`,
    moduleId: context.moduleId,
  });
  return {
    kind: "unsupported",
    name: declaration.name,
    reason: "non-resumable-event-handler",
    typeText: typeText(context, declaration.node),
  };
}

function collectServiceAliases(
  sourceFile: ts.SourceFile,
  declarations: ReadonlyMap<string, DeclarationFact>,
): ReadonlyMap<string, RouteCaptureFact> {
  const aliases = new Map<string, RouteCaptureFact>();
  for (const declaration of declarations.values()) {
    const initializer = declaration.initializer;
    if (initializer) collectRefSubjectServiceAlias(aliases, declaration.name, initializer);
    if (ts.isClassDeclaration(declaration.node) && declaration.node.name) {
      collectEffectServiceAlias(
        aliases,
        declaration.node.name.text,
        declaration.node.heritageClauses,
      );
    }
  }
  visit(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      collectEffectServiceAlias(aliases, node.name.text, node.heritageClauses);
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      collectYieldedServiceAlias(aliases, node.name.text, node.initializer);
    }
  });
  return aliases;
}

function collectImportedNames(sourceFile: ts.SourceFile): ReadonlySet<string> {
  const names = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) names.add(clause.name.text);
    const namedBindings = clause.namedBindings;
    if (!namedBindings) continue;
    if (ts.isNamespaceImport(namedBindings)) {
      names.add(namedBindings.name.text);
      continue;
    }
    for (const specifier of namedBindings.elements) {
      names.add(specifier.name.text);
    }
  }
  return names;
}

function collectRefSubjectServiceAlias(
  aliases: Map<string, RouteCaptureFact>,
  localName: string,
  initializer: ts.Expression,
): void {
  const serviceId = refSubjectServiceId(initializer);
  if (serviceId) {
    aliases.set(localName, {
      kind: "refsubject-service",
      name: localName,
      serviceId,
      serviceName: localName,
    });
  }
}

function collectEffectServiceAlias(
  aliases: Map<string, RouteCaptureFact>,
  localName: string,
  heritageClauses: ts.NodeArray<ts.HeritageClause> | undefined,
): void {
  const serviceId = effectServiceId(heritageClauses);
  if (serviceId) {
    aliases.set(localName, {
      kind: "effect-service",
      name: localName,
      serviceId,
      serviceName: localName,
    });
  }
}

function collectYieldedServiceAlias(
  aliases: Map<string, RouteCaptureFact>,
  localName: string,
  initializer: ts.Expression | undefined,
): void {
  const yielded = yieldedIdentifier(initializer);
  const service = yielded ? aliases.get(yielded) : undefined;
  if (service?.kind === "effect-service" || service?.kind === "refsubject-service") {
    aliases.set(localName, { ...service, name: localName, serviceName: yielded });
  }
}

function refSubjectServiceId(expression: ts.Expression): string | undefined {
  if (!ts.isCallExpression(expression)) return undefined;
  const idArg = expression.arguments[0];
  if (!idArg || !ts.isStringLiteral(idArg)) return undefined;
  const factory = expression.expression;
  return ts.isCallExpression(factory) &&
    isPropertyAccess(factory.expression, "RefSubject", "Service")
    ? idArg.text
    : undefined;
}

function effectServiceId(
  heritageClauses: ts.NodeArray<ts.HeritageClause> | undefined,
): string | undefined {
  for (const item of heritageClauses?.flatMap((clause) => [...clause.types]) ?? []) {
    const id = effectServiceIdFromExpression(item.expression);
    if (id) return id;
  }
  return undefined;
}

function effectServiceIdFromExpression(expression: ts.Expression): string | undefined {
  if (!ts.isCallExpression(expression)) return undefined;
  const idArg = expression.arguments[0];
  if (idArg && ts.isStringLiteral(idArg)) return idArg.text;
  return effectServiceIdFromExpression(expression.expression);
}

function yieldedIdentifier(expression: ts.Expression | undefined): string | undefined {
  if (!expression || !ts.isYieldExpression(expression) || !expression.expression) return undefined;
  return ts.isIdentifier(expression.expression) ? expression.expression.text : undefined;
}

function isInlineRefSubjectMigration(
  context: ClassificationContext,
  declaration: DeclarationFact,
): boolean {
  if (declaration.declarationKind !== "const" || !declaration.initializer) return false;
  if (!containsYield(declaration.initializer)) return false;
  return (
    isRefSubjectTypedExpression(context, declaration.initializer) ||
    hasRefSubjectMake(declaration.initializer)
  );
}

function inlineRefSubjectMigration(
  context: ClassificationContext,
  declaration: DeclarationFact,
): RouteCaptureFact {
  return {
    initializerSource: declaration.initializer?.getText(context.sourceFile) ?? "",
    kind: "inline-refsubject-migration",
    name: declaration.name,
    serviceId: `${context.moduleId}#${declaration.name}`,
    typeText: typeText(context, declaration.node),
  };
}

function isRefSubjectTypedExpression(
  context: ClassificationContext,
  expression: ts.Expression,
): boolean {
  if (!context.checker || !context.refSubjectType) return false;
  return context.checker.isTypeAssignableTo(
    context.checker.getTypeAtLocation(expression),
    context.refSubjectType,
  );
}

function hasRefSubjectMake(node: ts.Node): boolean {
  let found = false;
  visit(node, (child) => {
    if (ts.isCallExpression(child) && isPropertyAccess(child.expression, "RefSubject", "make")) {
      found = true;
    }
  });
  return found;
}

function isTemplateValue(declaration: DeclarationFact): boolean {
  return !!declaration.initializer && ts.isTaggedTemplateExpression(declaration.initializer);
}

function isEventHandlerAction(declaration: DeclarationFact): boolean {
  return (
    !!declaration.initializer && isPropertyCall(declaration.initializer, "EventHandler", "action")
  );
}

function eventActionCapture(
  context: ClassificationContext,
  declaration: DeclarationFact,
): RouteCaptureFact {
  return {
    descriptorName: eventActionDescriptorName(declaration.initializer),
    kind: "serializable-value",
    name: declaration.name,
    typeText: typeText(context, declaration.node),
  };
}

function eventActionDescriptorName(expression: ts.Expression | undefined): string | undefined {
  if (!expression || !ts.isCallExpression(expression)) return undefined;
  const id = stringArg(expression, 0);
  const event = stringArg(expression, 1);
  if (!id || !event) return undefined;
  const component = objectStringProperty(expression.arguments[3], "component");
  return ["event-action", id, event, component].filter(Boolean).join(":");
}

function isNonResumableEventHandler(declaration: DeclarationFact): boolean {
  if (declaration.declarationKind === "function") return true;
  const initializer = declaration.initializer;
  if (!initializer) return false;
  return isFunctionLike(initializer) || isPropertyCall(initializer, "EventHandler", "make");
}

function isTemplateEventCapture(node: ts.Identifier): boolean {
  const span = node.parent;
  if (!ts.isTemplateSpan(span) || span.expression !== node) return false;
  const template = span.parent;
  const tagged = template.parent;
  return (
    ts.isTaggedTemplateExpression(tagged) &&
    tagText(tagged.tag) === "html" &&
    isEventAttributePrefix(previousTemplateText(template, span))
  );
}

function previousTemplateText(template: ts.TemplateExpression, span: ts.TemplateSpan): string {
  const index = template.templateSpans.findIndex((item) => item === span);
  if (index <= 0) return template.head.text;
  return template.templateSpans[index - 1]?.literal.text ?? "";
}

function isEventAttributePrefix(text: string): boolean {
  return /(?:@[A-Za-z][\w:-]*|on[A-Za-z][\w:-]*)\s*=\s*["']?\s*$/u.test(text);
}

function isSerializableValue(
  context: ClassificationContext,
  declaration: DeclarationFact,
): boolean {
  if (declaration.declarationKind !== "const" || !declaration.initializer) return false;
  if (ts.isFunctionLike(declaration.initializer)) return false;
  const type = context.checker?.getTypeAtLocation(declaration.node);
  if (!type || type.flags & ts.TypeFlags.Any || type.flags & ts.TypeFlags.Unknown) return false;
  return true;
}

function typeText(context: ClassificationContext, node: ts.Node): string {
  if (ts.isParameter(node) && node.type) return node.type.getText(context.sourceFile);
  if (ts.isVariableDeclaration(node) && node.type) return node.type.getText(context.sourceFile);
  if (!context.checker) return "unknown";
  return context.checker.typeToString(context.checker.getTypeAtLocation(node));
}

function closureExpression(
  expression: ts.Expression | undefined,
): ts.FunctionLikeDeclaration | undefined {
  if (!expression) return undefined;
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) return expression;
  if (!ts.isCallExpression(expression)) return undefined;
  for (const argument of expression.arguments) {
    if (isFunctionLike(argument)) return argument;
  }
  return undefined;
}

function declaredNames(closure: ts.FunctionLikeDeclaration): Set<string> {
  const names = new Set<string>();
  for (const parameter of closure.parameters) collectBindingNames(names, parameter.name);
  visit(closure.body, (node) => {
    if (ts.isVariableDeclaration(node)) collectBindingNames(names, node.name);
    if (ts.isFunctionDeclaration(node) && node.name) names.add(node.name.text);
  });
  return names;
}

function collectBindingNames(names: Set<string>, binding: ts.BindingName): void {
  if (ts.isIdentifier(binding)) {
    names.add(binding.text);
    return;
  }
  for (const element of binding.elements) {
    if (!ts.isOmittedExpression(element)) collectBindingNames(names, element.name);
  }
}

function isDeclarationName(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (
    (ts.isVariableDeclaration(parent) && parent.name === node) ||
    (ts.isParameter(parent) && parent.name === node) ||
    (ts.isFunctionDeclaration(parent) && parent.name === node) ||
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isMethodDeclaration(parent) && parent.name === node) ||
    (ts.isGetAccessorDeclaration(parent) && parent.name === node) ||
    (ts.isSetAccessorDeclaration(parent) && parent.name === node) ||
    (ts.isBindingElement(parent) && parent.propertyName === node) ||
    (ts.isPropertyAccessExpression(parent) && parent.name === node)
  );
}

function containsYield(node: ts.Node): boolean {
  let found = false;
  visit(node, (child) => {
    if (ts.isYieldExpression(child) || isParsedYieldStarExpression(child)) found = true;
  });
  return found;
}

function isParsedYieldStarExpression(node: ts.Node): boolean {
  return (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.AsteriskToken &&
    ts.isIdentifier(node.left) &&
    node.left.text === "yield"
  );
}

function isFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return (
    ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)
  );
}

function isPropertyAccess(expression: ts.Expression, left: string, right: string): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    expressionText(expression.expression) === left &&
    expression.name.text === right
  );
}

function isPropertyCall(expression: ts.Expression, left: string, right: string): boolean {
  return ts.isCallExpression(expression) && isPropertyAccess(expression.expression, left, right);
}

function stringArg(expression: ts.CallExpression, index: number): string | undefined {
  const argument = expression.arguments[index];
  return argument && ts.isStringLiteral(argument) ? argument.text : undefined;
}

function objectStringProperty(
  expression: ts.Expression | undefined,
  name: string,
): string | undefined {
  if (!expression || !ts.isObjectLiteralExpression(expression)) return undefined;
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property) || propertyNameText(property.name) !== name) continue;
    return ts.isStringLiteral(property.initializer) ? property.initializer.text : undefined;
  }
  return undefined;
}

function propertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
    return name.text;
  return undefined;
}

function expressionText(expression: ts.Expression): string {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    return `${expressionText(expression.expression)}.${expression.name.text}`;
  }
  return "";
}

function tagText(tag: ts.Expression): string {
  return expressionText(tag);
}

function visit(node: ts.Node | undefined, f: (node: ts.Node) => void): void {
  if (!node) return;
  f(node);
  ts.forEachChild(node, (child) => visit(child, f));
}

function visitClosureBody(node: ts.Node | undefined, f: (node: ts.Node) => void): void {
  if (!node) return;
  f(node);
  ts.forEachChild(node, (child) => {
    if (isFunctionLike(child)) return;
    visitClosureBody(child, f);
  });
}
