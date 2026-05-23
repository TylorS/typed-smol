import ts from "typescript";
import type {
  AnalyzeRouteModuleInput,
  RouteCaptureFact,
  RouteClosureFact,
  RouteDiagnostic,
  RouteEffectServiceFact,
  RouteInlineRefSubjectFact,
  RouteModulePlan,
  RouteRefSubjectServiceFact,
  RouteTemplateFact,
} from "./RouteModulePlan.js";

export function analyzeRouteModule(input: AnalyzeRouteModuleInput): RouteModulePlan {
  const tsMod = input.ts ?? ts;
  const sourceFile =
    input.sourceFile ??
    tsMod.createSourceFile(input.moduleId, input.sourceText, tsMod.ScriptTarget.Latest, true);
  const context = createContext(input.moduleId, sourceFile, input);
  collectImports(context, sourceFile);

  visit(sourceFile, (node) => {
    collectServices(context, node);
    collectInlineRefSubjects(context, node);
    collectTemplates(context, node);
    collectClosures(context, node);
  });

  return {
    moduleId: input.moduleId,
    services: context.refSubjectServices,
    effectServices: context.effectServices,
    inlineRefSubjects: context.inlineRefSubjects,
    templates: context.templates,
    closures: context.closures,
    diagnostics: context.diagnostics,
  };
}

interface RouteAnalysisContext {
  readonly moduleId: string;
  readonly sourceFile: ts.SourceFile;
  readonly refSubjectServices: RouteRefSubjectServiceFact[];
  readonly effectServices: RouteEffectServiceFact[];
  readonly inlineRefSubjects: RouteInlineRefSubjectFact[];
  readonly templates: RouteTemplateFact[];
  readonly closures: RouteClosureFact[];
  readonly diagnostics: RouteDiagnostic[];
  readonly serviceAliases: Map<string, RouteCaptureFact>;
  readonly checker?: ts.TypeChecker;
  readonly refSubjectType?: ts.Type;
  readonly uiComponentAliases: Set<string>;
  readonly uiNamespaces: Set<string>;
  readonly uiStateAliases: Set<string>;
}

function createContext(
  moduleId: string,
  sourceFile: ts.SourceFile,
  input: AnalyzeRouteModuleInput,
): RouteAnalysisContext {
  return {
    moduleId,
    sourceFile,
    refSubjectServices: [],
    effectServices: [],
    inlineRefSubjects: [],
    templates: [],
    closures: [],
    diagnostics: [],
    serviceAliases: new Map(),
    checker: input.checker,
    refSubjectType: input.refSubjectType,
    uiComponentAliases: new Set(),
    uiNamespaces: new Set(),
    uiStateAliases: new Set(),
  };
}

const uiStatefulComponents = new Set([
  "Checkbox",
  "Collection",
  "Combobox",
  "Composite",
  "Dialog",
  "Disclosure",
  "Form",
  "Hovercard",
  "Listbox",
  "Menu",
  "Menubar",
  "Popover",
  "Radio",
  "RadioGroup",
  "Select",
  "Tab",
  "Tabs",
  "Toolbar",
  "Tooltip",
]);

function collectImports(context: RouteAnalysisContext, sourceFile: ts.SourceFile): void {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !isTypedUiImport(statement)) continue;
    const moduleSpecifier = statement.moduleSpecifier;
    const moduleName = ts.isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : "";
    const bindings = statement.importClause?.namedBindings;
    if (!bindings) continue;

    if (ts.isNamespaceImport(bindings)) {
      if (moduleName === "@typed/ui/State") context.uiStateAliases.add(bindings.name.text);
      else context.uiNamespaces.add(bindings.name.text);
      continue;
    }

    for (const element of bindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      const localName = element.name.text;
      if (importedName === "State") context.uiStateAliases.add(localName);
      if (uiStatefulComponents.has(importedName)) context.uiComponentAliases.add(localName);
    }
  }
}

function collectServices(context: RouteAnalysisContext, node: ts.Node): void {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    collectRefSubjectService(context, node.name.text, node.initializer);
    collectServiceAlias(context, node.name.text, node.initializer);
  } else if (ts.isClassDeclaration(node) && node.name) {
    collectEffectService(context, node.name.text, node.heritageClauses);
  }
}

function collectRefSubjectService(
  context: RouteAnalysisContext,
  localName: string,
  initializer: ts.Expression | undefined,
): void {
  const serviceId = refSubjectServiceId(context, initializer);
  if (serviceId === undefined) return;
  context.refSubjectServices.push({
    kind: "refsubject-service",
    localName,
    moduleId: context.moduleId,
    serviceId,
  });
  context.serviceAliases.set(localName, { kind: "refsubject-service", name: localName, serviceId });
}

function collectEffectService(
  context: RouteAnalysisContext,
  localName: string,
  heritageClauses: ts.NodeArray<ts.HeritageClause> | undefined,
): void {
  const serviceId = effectServiceId(heritageClauses);
  if (serviceId === undefined) return;
  context.effectServices.push({ kind: "effect-service", localName, moduleId: context.moduleId, serviceId });
}

function collectServiceAlias(
  context: RouteAnalysisContext,
  localName: string,
  initializer: ts.Expression | undefined,
): void {
  if (!initializer || !ts.isYieldExpression(initializer)) return;
  const yielded = initializer.expression;
  if (!yielded || !ts.isIdentifier(yielded)) return;
  const service = context.effectServices.find((item) => item.localName === yielded.text);
  if (service) {
    context.serviceAliases.set(localName, { kind: "effect-service", name: localName, serviceId: service.serviceId });
  }
}

function collectInlineRefSubjects(context: RouteAnalysisContext, node: ts.Node): void {
  if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name)) return;
  if (!isConstVariableDeclaration(node)) return;
  const call = unwrapYield(node.initializer);
  const semanticMatch = semanticInlineStateFactoryMatch(context, node.initializer);
  const syntaxMatch = semanticMatch ?? (call ? inlineStateFactoryMatch(context, call) : null);
  if (!syntaxMatch) return;
  const localName = node.name.text;
  context.inlineRefSubjects.push({
    initializerSource: syntaxMatch.initializerSource,
    localName,
    moduleId: context.moduleId,
    serviceId: `${context.moduleId}#${localName}`,
  });
  context.diagnostics.push({
    code: "anonymous-refsubject-state",
    message: `Inline ${syntaxMatch.factoryName} in ${context.moduleId} should migrate ${localName} to RefSubject.Service for resumable HMR`,
    moduleId: context.moduleId,
  });
}

interface InlineStateFactoryMatch {
  readonly factoryName: string;
  readonly initializerSource: string;
}

function isConstVariableDeclaration(node: ts.VariableDeclaration): boolean {
  const declarationList = node.parent;
  return (
    ts.isVariableDeclarationList(declarationList) &&
    (declarationList.flags & ts.NodeFlags.Const) !== 0
  );
}

function isTypedUiImport(statement: ts.ImportDeclaration): boolean {
  return (
    ts.isStringLiteral(statement.moduleSpecifier) &&
    (statement.moduleSpecifier.text === "@typed/ui" ||
      statement.moduleSpecifier.text.startsWith("@typed/ui/"))
  );
}

function collectTemplates(context: RouteAnalysisContext, node: ts.Node): void {
  if (!ts.isTaggedTemplateExpression(node)) return;
  const tagName = tagText(node.tag);
  if (tagName !== "html") return;
  context.templates.push({ localName: templateLocalName(node), moduleId: context.moduleId, tagName });
}

function collectClosures(context: RouteAnalysisContext, node: ts.Node): void {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    const closure = closureExpression(node.initializer);
    if (closure) pushClosure(context, node.name.text, closure);
  } else if (ts.isFunctionDeclaration(node) && node.name) {
    pushClosure(context, node.name.text, node);
  }
}

function pushClosure(
  context: RouteAnalysisContext,
  name: string,
  closure: ts.FunctionLikeDeclaration,
): void {
  context.closures.push({
    captures: closureCaptures(context, closure),
    moduleId: context.moduleId,
    name,
  });
}

function closureCaptures(
  context: RouteAnalysisContext,
  closure: ts.FunctionLikeDeclaration,
): readonly RouteCaptureFact[] {
  const declared = declaredNames(closure);
  const captures = new Map<string, RouteCaptureFact>();
  visit(closure.body, (node) => {
    if (!ts.isIdentifier(node) || declared.has(node.text)) return;
    const capture = context.serviceAliases.get(node.text);
    if (capture) captures.set(node.text, capture);
  });
  return [...captures.values()];
}

function declaredNames(closure: ts.FunctionLikeDeclaration): Set<string> {
  const names = new Set<string>();
  for (const parameter of closure.parameters) collectBindingNames(names, parameter.name);
  visit(closure.body, (node) => {
    if (ts.isVariableDeclaration(node)) collectBindingNames(names, node.name);
  });
  return names;
}

function collectBindingNames(names: Set<string>, binding: ts.BindingName): void {
  if (ts.isIdentifier(binding)) {
    names.add(binding.text);
  } else {
    for (const element of binding.elements) {
      if (!ts.isOmittedExpression(element)) collectBindingNames(names, element.name);
    }
  }
}

function refSubjectServiceId(
  context: RouteAnalysisContext,
  expression: ts.Expression | undefined,
): string | undefined {
  if (!expression || !ts.isCallExpression(expression)) return undefined;
  const idArg = expression.arguments[0];
  if (!idArg || !ts.isStringLiteral(idArg)) return undefined;
  const inner = expression.expression;
  if (!ts.isCallExpression(inner)) return undefined;
  return isServiceFactory(context, inner.expression) ? idArg.text : undefined;
}

function isServiceFactory(context: RouteAnalysisContext, expression: ts.Expression): boolean {
  if (!ts.isPropertyAccessExpression(expression) || expression.name.text !== "Service") {
    return false;
  }

  const owner = expressionText(expression.expression);
  return (
    owner === "RefSubject" ||
    context.uiStateAliases.has(owner) ||
    [...context.uiNamespaces].some((namespace) => owner === `${namespace}.State`)
  );
}

function inlineStateFactoryMatch(
  context: RouteAnalysisContext,
  call: ts.CallExpression,
): InlineStateFactoryMatch | null {
  if (!isPropertyCall(call, "RefSubject", "make") && !isTypedUiMakeStateCall(context, call)) {
    return null;
  }

  return {
    factoryName: inlineStateFactoryName(call),
    initializerSource: inlineStateInitializerSource(context, call),
  };
}

function semanticInlineStateFactoryMatch(
  context: RouteAnalysisContext,
  initializer: ts.Expression | undefined,
): InlineStateFactoryMatch | null {
  if (!initializer || !containsYield(initializer) || !isRefSubjectTypedExpression(context, initializer)) {
    return null;
  }
  return {
    factoryName: "RefSubject-producing initializer",
    initializerSource: initializer.getText(context.sourceFile),
  };
}

function isRefSubjectTypedExpression(
  context: RouteAnalysisContext,
  expression: ts.Expression,
): boolean {
  if (!context.checker || !context.refSubjectType) return false;
  return isTypeAssignableTo(
    context.checker,
    context.checker.getTypeAtLocation(expression),
    context.refSubjectType,
  );
}

function isTypedUiMakeStateCall(context: RouteAnalysisContext, call: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(call.expression) || call.expression.name.text !== "makeState") {
    return false;
  }

  const owner = expressionText(call.expression.expression);
  if (context.uiComponentAliases.has(owner)) return true;

  return [...context.uiNamespaces].some((namespace) => {
    if (!owner.startsWith(`${namespace}.`)) return false;
    return uiStatefulComponents.has(owner.slice(namespace.length + 1));
  });
}

function inlineStateInitializerSource(
  context: RouteAnalysisContext,
  call: ts.CallExpression,
): string {
  return isPropertyCall(call, "RefSubject", "make")
    ? call.arguments[0]?.getText(context.sourceFile) ?? ""
    : call.getText(context.sourceFile);
}

function inlineStateFactoryName(call: ts.CallExpression): string {
  return isPropertyCall(call, "RefSubject", "make")
    ? "RefSubject.make"
    : call.expression.getText();
}

function effectServiceId(heritageClauses: ts.NodeArray<ts.HeritageClause> | undefined): string | undefined {
  const heritage = heritageClauses?.flatMap((clause) => [...clause.types]) ?? [];
  for (const item of heritage) {
    const id = effectServiceIdFromExpression(item.expression);
    if (id !== undefined) return id;
  }
  return undefined;
}

function effectServiceIdFromExpression(expression: ts.Expression): string | undefined {
  if (!ts.isCallExpression(expression)) return undefined;
  const idArg = expression.arguments[0];
  if (idArg && ts.isStringLiteral(idArg)) return idArg.text;
  return effectServiceIdFromExpression(expression.expression);
}

function isTypeAssignableTo(checker: ts.TypeChecker, source: ts.Type, target: ts.Type): boolean {
  return checker.isTypeAssignableTo(source, target);
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

function closureExpression(expression: ts.Expression | undefined): ts.FunctionLikeDeclaration | undefined {
  if (!expression) return undefined;
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) return expression;
  if (!ts.isCallExpression(expression)) return undefined;
  for (const argument of expression.arguments) {
    if (isFunctionLike(argument)) return argument;
  }
  return undefined;
}

function unwrapYield(expression: ts.Expression | undefined): ts.CallExpression | undefined {
  if (!expression) return undefined;
  if (ts.isCallExpression(expression)) return expression;
  if (isParsedYieldStar(expression)) return expression.right;
  if (!ts.isYieldExpression(expression) || !expression.expression) return undefined;
  return ts.isCallExpression(expression.expression) ? expression.expression : undefined;
}

function isParsedYieldStar(
  expression: ts.Expression,
): expression is ts.BinaryExpression & { readonly right: ts.CallExpression } {
  return (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.AsteriskToken &&
    ts.isIdentifier(expression.left) &&
    expression.left.text === "yield" &&
    ts.isCallExpression(expression.right)
  );
}

function templateLocalName(node: ts.TaggedTemplateExpression): string | undefined {
  const parent = node.parent;
  if (!ts.isVariableDeclaration(parent) || !ts.isIdentifier(parent.name)) return undefined;
  return parent.name.text;
}

function isFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node);
}

function isPropertyCall(call: ts.CallExpression, left: string, right: string): boolean {
  return isPropertyAccess(call.expression, left, right);
}

function isPropertyAccess(expression: ts.Expression, left: string, right: string): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    expressionText(expression.expression) === left &&
    expression.name.text === right
  );
}

function expressionText(expression: ts.Expression): string {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    return `${expressionText(expression.expression)}.${expression.name.text}`;
  }
  return "";
}

function tagText(tag: ts.Expression): string {
  return ts.isIdentifier(tag) ? tag.text : tag.getText();
}

function visit(node: ts.Node | undefined, f: (node: ts.Node) => void): void {
  if (!node) return;
  f(node);
  ts.forEachChild(node, (child) => visit(child, f));
}
