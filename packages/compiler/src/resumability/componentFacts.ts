import { makeSourceLocationId, type ComponentId } from "@typed/devtools-protocol";
import ts from "typescript";
import {
  deriveComponentIdentities,
  type ComponentSourceSpan,
  type DeriveComponentIdentityInput,
  type DerivedComponentDeclarationKind,
} from "../devtools/componentFacts.js";

export interface ComponentResumabilityFactsInput extends DeriveComponentIdentityInput {}

export interface ComponentResumabilityFact {
  readonly actions: readonly ComponentActionFact[];
  readonly componentId: ComponentId;
  readonly declarationKind: DerivedComponentDeclarationKind;
  readonly displayName: string;
  readonly exportName: string;
  readonly localName: string;
  readonly moduleId: string;
  readonly stateFields: readonly string[];
}

export interface ComponentActionFact {
  readonly bindingName?: string;
  readonly canonicalId: string;
  readonly componentId: ComponentId;
  readonly event: string;
  readonly localName: string;
  readonly source: ComponentSourceSpan;
  readonly valueIndex?: number;
}

interface ComponentActionSite {
  readonly bindingName?: string;
  readonly event: string;
  readonly localName: string;
  readonly localComponentName: string;
  readonly source: ComponentSourceSpan;
}

interface EventHandlerImports {
  readonly actionNames: ReadonlySet<string>;
  readonly eventHandlerNamespaces: ReadonlySet<string>;
  readonly templateNamespaces: ReadonlySet<string>;
}

export function deriveComponentResumabilityFacts(
  input: ComponentResumabilityFactsInput,
): readonly ComponentResumabilityFact[] {
  const sourceFile = componentFactsSourceFile(input);
  const identities = deriveComponentIdentities({ ...input, sourceFile });
  const fields = exportedDataFields(sourceFile);
  const actions = componentActionSites(input.moduleId, sourceFile, eventHandlerImports(sourceFile));

  return identities.map((identity) => ({
    actions: actions
      .filter((action) => action.localComponentName === identity.localName)
      .map((action) => ({
        ...(action.bindingName ? { bindingName: action.bindingName } : {}),
        canonicalId: `${identity.componentId}:action:${action.localName}`,
        componentId: identity.componentId,
        event: action.event,
        localName: action.localName,
        source: action.source,
      })),
    componentId: identity.componentId,
    declarationKind: identity.declarationKind,
    displayName: identity.displayName,
    exportName: identity.exportName,
    localName: identity.localName,
    moduleId: identity.moduleId,
    stateFields: fields,
  }));
}

function componentFactsSourceFile(input: ComponentResumabilityFactsInput): ts.SourceFile {
  if (input.sourceFile) return input.sourceFile;
  return (input.ts ?? ts).createSourceFile(
    input.moduleId,
    input.sourceText ?? "",
    (input.ts ?? ts).ScriptTarget.Latest,
    true,
  );
}

function exportedDataFields(sourceFile: ts.SourceFile): readonly string[] {
  const fields = sourceFile.statements.flatMap((statement) =>
    isExportedVariable(statement) ? dataFieldsFromStatement(statement) : [],
  );
  return [...new Set(fields)].sort((left, right) => left.localeCompare(right));
}

function dataFieldsFromStatement(statement: ts.VariableStatement): readonly string[] {
  return statement.declarationList.declarations.flatMap((declaration) => {
    if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "data") return [];
    return dataFieldsFromInitializer(declaration.initializer);
  });
}

function dataFieldsFromInitializer(initializer: ts.Expression | undefined): readonly string[] {
  if (!initializer || !ts.isCallExpression(initializer)) return [];
  if (!isPropertyAccessNamed(initializer.expression, "schema")) return [];
  const [fields] = initializer.arguments;
  if (!fields || !ts.isObjectLiteralExpression(fields)) return [];
  return fields.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) ? propertyName(property.name) : [],
  );
}

function componentActionSites(
  moduleId: string,
  sourceFile: ts.SourceFile,
  imports: EventHandlerImports,
): readonly ComponentActionSite[] {
  return sourceFile.statements.flatMap((statement) =>
    componentBody(statement)
      ? actionSitesInBody(moduleId, sourceFile, componentName(statement), componentBody(statement)!, imports)
      : [],
  );
}

function actionSitesInBody(
  moduleId: string,
  sourceFile: ts.SourceFile,
  componentName: string,
  body: ts.Node,
  imports: EventHandlerImports,
): readonly ComponentActionSite[] {
  const actions: ComponentActionSite[] = [];
  visit(body, (node) => {
    if (!ts.isCallExpression(node) || !isEventHandlerActionCall(node.expression, imports)) return;
    const [localName, event] = stringArguments(node);
    if (!localName || !event) return;
    actions.push({
      ...(actionBindingName(node) ? { bindingName: actionBindingName(node) } : {}),
      event,
      localComponentName: componentName,
      localName,
      source: sourceSpanFromNode(moduleId, sourceFile, node.arguments[0]!),
    });
  });
  return actions;
}

function actionBindingName(call: ts.CallExpression): string | undefined {
  const parent = call.parent;
  if (!ts.isVariableDeclaration(parent) || !ts.isIdentifier(parent.name)) return undefined;
  return parent.initializer === call ? parent.name.text : undefined;
}

function eventHandlerImports(sourceFile: ts.SourceFile): EventHandlerImports {
  const actionNames = new Set<string>();
  const eventHandlerNamespaces = new Set<string>();
  const templateNamespaces = new Set<string>();
  for (const statement of sourceFile.statements) collectEventHandlerImport(statement, {
    actionNames,
    eventHandlerNamespaces,
    templateNamespaces,
  });
  return { actionNames, eventHandlerNamespaces, templateNamespaces };
}

function collectEventHandlerImport(
  statement: ts.Statement,
  imports: {
    readonly actionNames: Set<string>;
    readonly eventHandlerNamespaces: Set<string>;
    readonly templateNamespaces: Set<string>;
  },
): void {
  if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return;
  const moduleName = statement.moduleSpecifier.text;
  const bindings = statement.importClause?.namedBindings;
  if (!bindings) return;
  if (moduleName === "@typed/template" && ts.isNamespaceImport(bindings)) {
    imports.templateNamespaces.add(bindings.name.text);
  }
  if (moduleName === "@typed/template") collectTemplateNamedImports(bindings, imports);
  if (moduleName === "@typed/template/EventHandler") collectEventHandlerModuleImports(bindings, imports);
}

function collectTemplateNamedImports(
  bindings: ts.NamedImportBindings,
  imports: { readonly eventHandlerNamespaces: Set<string> },
): void {
  if (!ts.isNamedImports(bindings)) return;
  for (const element of bindings.elements) {
    if ((element.propertyName?.text ?? element.name.text) === "EventHandler") {
      imports.eventHandlerNamespaces.add(element.name.text);
    }
  }
}

function collectEventHandlerModuleImports(
  bindings: ts.NamedImportBindings,
  imports: { readonly actionNames: Set<string>; readonly eventHandlerNamespaces: Set<string> },
): void {
  if (ts.isNamespaceImport(bindings)) imports.eventHandlerNamespaces.add(bindings.name.text);
  if (!ts.isNamedImports(bindings)) return;
  for (const element of bindings.elements) {
    if ((element.propertyName?.text ?? element.name.text) === "action") {
      imports.actionNames.add(element.name.text);
    }
  }
}

function isEventHandlerActionCall(
  expression: ts.Expression,
  imports: EventHandlerImports,
): boolean {
  if (ts.isIdentifier(expression)) return imports.actionNames.has(expression.text);
  if (!ts.isPropertyAccessExpression(expression) || expression.name.text !== "action") return false;
  const target = expression.expression;
  if (ts.isIdentifier(target)) return imports.eventHandlerNamespaces.has(target.text);
  return isTemplateEventHandlerAccess(target, imports.templateNamespaces);
}

function isTemplateEventHandlerAccess(
  expression: ts.Expression,
  templateNamespaces: ReadonlySet<string>,
): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    expression.name.text === "EventHandler" &&
    ts.isIdentifier(expression.expression) &&
    templateNamespaces.has(expression.expression.text)
  );
}

function componentBody(statement: ts.Statement): ts.Node | undefined {
  if (ts.isFunctionDeclaration(statement)) return statement.body;
  if (!ts.isVariableStatement(statement)) return undefined;
  const declaration = statement.declarationList.declarations[0];
  if (!declaration?.initializer) return undefined;
  return ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)
    ? declaration.initializer.body
    : undefined;
}

function componentName(statement: ts.Statement): string {
  if (ts.isFunctionDeclaration(statement) && statement.name) return statement.name.text;
  if (ts.isVariableStatement(statement)) {
    const declaration = statement.declarationList.declarations[0];
    if (declaration && ts.isIdentifier(declaration.name)) return declaration.name.text;
  }
  return "component";
}

function stringArguments(node: ts.CallExpression): readonly [string | undefined, string | undefined] {
  const [id, event] = node.arguments;
  return [stringLiteralText(id), stringLiteralText(event)];
}

function stringLiteralText(node: ts.Expression | undefined): string | undefined {
  return node && ts.isStringLiteralLike(node) ? node.text : undefined;
}

function propertyName(name: ts.PropertyName): readonly string[] {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return [name.text];
  }
  return [];
}

function isPropertyAccessNamed(expression: ts.Expression, name: string): boolean {
  return ts.isPropertyAccessExpression(expression) && expression.name.text === name;
}

function isExportedVariable(statement: ts.Statement): statement is ts.VariableStatement {
  return ts.isVariableStatement(statement) && hasModifier(statement, ts.SyntaxKind.ExportKeyword);
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) === true
  );
}

function sourceSpanFromNode(
  moduleId: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
): ComponentSourceSpan {
  const start = node.getStart(sourceFile);
  return {
    endOffset: node.getEnd(),
    endPosition: positionAt(sourceFile.text, node.getEnd()),
    id: makeSourceLocationId(`${moduleId}:${start}`),
    moduleId,
    startOffset: start,
    startPosition: positionAt(sourceFile.text, start),
  };
}

function positionAt(sourceText: string, offset: number): { readonly column: number; readonly line: number } {
  const lines = sourceText.slice(0, offset).split("\n");
  return { column: lines.at(-1)!.length + 1, line: lines.length };
}

function visit(node: ts.Node, onNode: (node: ts.Node) => void): void {
  onNode(node);
  ts.forEachChild(node, (child) => visit(child, onNode));
}
