import {
  makeComponentId,
  makeFxNodeId,
  makeHmrBoundaryId,
  makeRefSubjectId,
  makeSourceLocationId,
  makeTemplateHash,
  makeTemplatePartId,
  type ComponentId,
  type ComponentSummary,
  type FxNodeId,
  type HmrBoundaryId,
  type RefSubjectId,
  type SourceLocationId,
  type TemplateHash,
  type TemplatePartId,
} from "@typed/devtools-protocol";
import ts from "typescript";
import type { SourceSpan } from "../diagnostics/diagnostics.js";
import type { TemplateModuleTemplate } from "../template/analyzeTemplateModule.js";
import type { TemplatePlan, TemplatePlanNode, TemplatePlanPart } from "../template/TemplatePlan.js";

export interface ComponentDevtoolsFactInput {
  readonly displayName?: string;
  readonly exportName: string;
  readonly fxRoots?: readonly ComponentFxRootInput[];
  readonly hmrBoundary?: string;
  /**
   * Stable compiler module id. Callers should pass Vite/virtual-module ids, repo-relative
   * ids, or another canonical compiler id rather than machine-local absolute paths.
   */
  readonly moduleId: string;
  readonly refSubjects?: readonly ComponentRefSubjectInput[];
  readonly source?: ComponentSourceSpanInput;
  readonly sourceText?: string;
  readonly template?:
    | TemplateModuleTemplate
    | Pick<TemplatePlan, "nodes" | "parts" | "templateHash">;
}

export interface DeriveComponentIdentityInput {
  readonly checker?: ts.TypeChecker;
  readonly componentType?: ts.Type;
  readonly moduleId: string;
  readonly sourceFile?: ts.SourceFile;
  readonly sourceText?: string;
  readonly ts?: typeof ts;
}

export type DerivedComponentDeclarationKind =
  | "alias"
  | "const"
  | "default-alias"
  | "default-function"
  | "export-alias"
  | "function";

export interface DerivedComponentIdentity {
  readonly componentId: ComponentId;
  readonly declarationKind: DerivedComponentDeclarationKind;
  readonly displayName: string;
  readonly exportName: string;
  readonly localName: string;
  readonly moduleId: string;
  readonly source: ComponentSourceSpan;
}

export interface ComponentFxRootInput {
  readonly id?: string;
  readonly localName: string;
}

export interface ComponentRefSubjectInput {
  readonly id?: string;
  readonly localName: string;
  readonly serviceId?: string;
}

export interface ComponentSourceSpanInput {
  readonly endOffset: number;
  readonly endPosition: SourcePositionInput;
  readonly startOffset: number;
  readonly startPosition: SourcePositionInput;
}

export interface SourcePositionInput {
  readonly column: number;
  readonly line: number;
}

export interface ComponentDevtoolsFact {
  readonly componentId: ComponentId;
  readonly displayName: string;
  readonly fxNodeIds: readonly FxNodeId[];
  readonly hmrBoundaryId?: HmrBoundaryId;
  readonly moduleId: string;
  readonly refSubjectIds: readonly RefSubjectId[];
  readonly source?: ComponentSourceSpan;
  readonly sourceLocationId?: SourceLocationId;
  readonly summary: ComponentSummary;
  readonly template?: ComponentTemplateFact;
  readonly templateHash?: TemplateHash;
}

export interface ComponentSourceSpan {
  readonly endOffset: number;
  readonly endPosition: SourcePositionInput;
  readonly id: SourceLocationId;
  readonly moduleId: string;
  readonly startOffset: number;
  readonly startPosition: SourcePositionInput;
}

export interface ComponentTemplateFact {
  readonly hash: TemplateHash;
  readonly parts: readonly ComponentTemplatePartFact[];
}

export interface ComponentTemplatePartFact {
  readonly effectiveRuntimePath: readonly number[];
  readonly expression?: ComponentSourceSpan;
  readonly expressions?: readonly ComponentSourceSpan[];
  readonly id: TemplatePartId;
  readonly kind: TemplatePlanPart["kind"];
  readonly name?: string;
  readonly path: readonly number[];
  readonly valueIndex?: number;
  readonly valueIndexes?: readonly number[];
}

export function createComponentDevtoolsFacts(
  inputs: readonly ComponentDevtoolsFactInput[],
): readonly ComponentDevtoolsFact[] {
  return inputs.map(createComponentDevtoolsFact);
}

export function deriveComponentDevtoolsFactInputs(
  input: DeriveComponentIdentityInput,
): readonly ComponentDevtoolsFactInput[] {
  return deriveComponentIdentities(input).map((identity) => ({
    displayName: identity.displayName,
    exportName: identity.exportName,
    moduleId: identity.moduleId,
    source: identity.source,
  }));
}

export function deriveComponentIdentities(
  input: DeriveComponentIdentityInput,
): readonly DerivedComponentIdentity[] {
  const sourceFile = componentIdentitySourceFile(input);
  const context = componentIdentityContext(input);
  const declarations = componentDeclarationIndex(sourceFile, context);
  const direct = directComponentIdentities(input.moduleId, sourceFile, context);
  const aliases = aliasComponentIdentities(input.moduleId, sourceFile, declarations);
  return [...direct, ...aliases].sort(compareComponentIdentities);
}

export function createComponentDevtoolsFact(
  input: ComponentDevtoolsFactInput,
): ComponentDevtoolsFact {
  const componentId = makeComponentId(`${input.moduleId}#${input.exportName}`);
  const displayName = input.displayName ?? input.exportName;
  const source = createComponentSourceSpan(input);
  const template =
    input.template === undefined
      ? undefined
      : createTemplateFact(input.moduleId, input.template, input.sourceText);
  const fxNodeIds = (input.fxRoots ?? []).map((root) => createFxNodeId(input, root));
  const refSubjectIds = (input.refSubjects ?? []).map((refSubject) =>
    createRefSubjectId(input, refSubject),
  );
  const hmrBoundaryId = input.hmrBoundary ? makeHmrBoundaryId(input.hmrBoundary) : undefined;
  const templateHash = template?.hash;
  const sourceLocationId = source?.id;
  const summary = componentSummary({
    componentId,
    displayName,
    fxNodeIds,
    hmrBoundaryId,
    refSubjectIds,
    sourceLocationId,
    templateHash,
  });

  return {
    componentId,
    displayName,
    fxNodeIds,
    hmrBoundaryId,
    moduleId: input.moduleId,
    refSubjectIds,
    summary,
    ...(source && { source, sourceLocationId }),
    ...(template && { template, templateHash }),
  };
}

interface ComponentDeclaration {
  readonly identityNode: ts.Node;
  readonly localName: string;
}

interface ComponentIdentityContext {
  readonly checker?: ts.TypeChecker;
  readonly componentType?: ts.Type;
}

function componentIdentitySourceFile(input: DeriveComponentIdentityInput): ts.SourceFile {
  if (input.sourceFile) return input.sourceFile;
  return (input.ts ?? ts).createSourceFile(
    input.moduleId,
    input.sourceText ?? "",
    (input.ts ?? ts).ScriptTarget.Latest,
    true,
  );
}

function componentIdentityContext(input: DeriveComponentIdentityInput): ComponentIdentityContext {
  if (!input.checker || !input.componentType) return {};
  return { checker: input.checker, componentType: input.componentType };
}

function componentDeclarationIndex(
  sourceFile: ts.SourceFile,
  context: ComponentIdentityContext,
): ReadonlyMap<string, ComponentDeclaration> {
  const declarations = new Map<string, ComponentDeclaration>();
  for (const statement of sourceFile.statements) {
    const declaration = namedComponentDeclaration(statement, context);
    if (declaration) declarations.set(declaration.localName, declaration);
  }
  return declarations;
}

function directComponentIdentities(
  moduleId: string,
  sourceFile: ts.SourceFile,
  context: ComponentIdentityContext,
): readonly DerivedComponentIdentity[] {
  return sourceFile.statements.flatMap((statement) => {
    const declaration = namedComponentDeclaration(statement, context);
    if (!declaration || !isExported(statement)) return [];
    const exportName = isDefaultExport(statement) ? "default" : declaration.localName;
    const kind = directDeclarationKind(statement, exportName);
    return [
      componentIdentity(
        moduleId,
        sourceFile,
        declaration.identityNode,
        exportName,
        declaration.localName,
        kind,
      ),
    ];
  });
}

function aliasComponentIdentities(
  moduleId: string,
  sourceFile: ts.SourceFile,
  declarations: ReadonlyMap<string, ComponentDeclaration>,
): readonly DerivedComponentIdentity[] {
  return sourceFile.statements.flatMap((statement) => [
    ...variableAliasIdentities(moduleId, sourceFile, declarations, statement),
    ...exportAliasIdentities(moduleId, sourceFile, declarations, statement),
  ]);
}

function namedComponentDeclaration(
  statement: ts.Statement,
  context: ComponentIdentityContext,
): ComponentDeclaration | undefined {
  if (
    ts.isFunctionDeclaration(statement) &&
    statement.name &&
    hasComponentReturnType(statement, context)
  ) {
    return { identityNode: statement.name, localName: statement.name.text };
  }
  if (!ts.isVariableStatement(statement)) return undefined;
  const declaration = statement.declarationList.declarations[0];
  if (
    !declaration ||
    !ts.isIdentifier(declaration.name) ||
    !hasComponentVariableType(declaration)
  ) {
    return undefined;
  }
  return { identityNode: declaration.name, localName: declaration.name.text };
}

function variableAliasIdentities(
  moduleId: string,
  sourceFile: ts.SourceFile,
  declarations: ReadonlyMap<string, ComponentDeclaration>,
  statement: ts.Statement,
): readonly DerivedComponentIdentity[] {
  if (!ts.isVariableStatement(statement) || !isExported(statement)) return [];
  return statement.declarationList.declarations.flatMap((declaration) =>
    variableAliasIdentity(moduleId, sourceFile, declarations, declaration),
  );
}

function variableAliasIdentity(
  moduleId: string,
  sourceFile: ts.SourceFile,
  declarations: ReadonlyMap<string, ComponentDeclaration>,
  declaration: ts.VariableDeclaration,
): readonly DerivedComponentIdentity[] {
  const initializer = declaration.initializer;
  if (!ts.isIdentifier(declaration.name) || !initializer || !ts.isIdentifier(initializer)) {
    return [];
  }
  if (!declarations.has(initializer.text)) return [];
  return [
    componentIdentity(
      moduleId,
      sourceFile,
      declaration.name,
      declaration.name.text,
      initializer.text,
      "alias",
    ),
  ];
}

function exportAliasIdentities(
  moduleId: string,
  sourceFile: ts.SourceFile,
  declarations: ReadonlyMap<string, ComponentDeclaration>,
  statement: ts.Statement,
): readonly DerivedComponentIdentity[] {
  const exportClause = ts.isExportDeclaration(statement) ? statement.exportClause : undefined;
  if (!exportClause || !ts.isNamedExports(exportClause)) return [];
  return exportClause.elements.flatMap((specifier) =>
    exportSpecifierIdentity(moduleId, sourceFile, declarations, specifier),
  );
}

function exportSpecifierIdentity(
  moduleId: string,
  sourceFile: ts.SourceFile,
  declarations: ReadonlyMap<string, ComponentDeclaration>,
  specifier: ts.ExportSpecifier,
): readonly DerivedComponentIdentity[] {
  const localName = specifier.propertyName?.text ?? specifier.name.text;
  if (!declarations.has(localName)) return [];
  return [
    componentIdentity(
      moduleId,
      sourceFile,
      specifier.name,
      specifier.name.text,
      localName,
      "export-alias",
    ),
  ];
}

function componentIdentity(
  moduleId: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  exportName: string,
  localName: string,
  declarationKind: DerivedComponentDeclarationKind,
): DerivedComponentIdentity {
  const source = sourceSpanFromNode(moduleId, sourceFile, node);
  return {
    componentId: makeComponentId(`${moduleId}#${exportName}`),
    declarationKind,
    displayName: exportName === "default" ? localName : exportName,
    exportName,
    localName,
    moduleId,
    source,
  };
}

function directDeclarationKind(
  statement: ts.Statement,
  exportName: string,
): DerivedComponentDeclarationKind {
  if (ts.isVariableStatement(statement)) {
    return exportName === "default" ? "default-alias" : "const";
  }
  return exportName === "default" ? "default-function" : "function";
}

function hasComponentVariableType(declaration: ts.VariableDeclaration): boolean {
  if (isComponentTypeText(declaration.type?.getText())) return true;
  const initializer = declaration.initializer;
  return isFunctionExpressionLike(initializer) && hasComponentReturnType(initializer, {});
}

function hasComponentReturnType(
  node: ts.SignatureDeclaration,
  context: ComponentIdentityContext,
): boolean {
  if (isCheckerComponentReturn(node, context)) return true;
  return isComponentTypeText(node.type?.getText());
}

function isCheckerComponentReturn(
  node: ts.SignatureDeclaration,
  context: ComponentIdentityContext,
): boolean {
  if (!context.checker || !context.componentType) return false;
  const signature = context.checker.getSignatureFromDeclaration(node);
  if (!signature) return false;
  const returnType = context.checker.getReturnTypeOfSignature(signature);
  return context.checker.isTypeAssignableTo(returnType, context.componentType);
}

function isComponentTypeText(typeText: string | undefined): boolean {
  return typeText === "Component" || typeText?.startsWith("Component<") === true;
}

function isFunctionExpressionLike(
  node: ts.Node | undefined,
): node is ts.ArrowFunction | ts.FunctionExpression {
  return node !== undefined && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));
}

function sourceSpanFromNode(
  moduleId: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
): ComponentSourceSpan {
  const start = node.getStart(sourceFile);
  return sourceSpan(moduleId, {
    endOffset: node.getEnd(),
    endPosition: positionAt(sourceFile.text, node.getEnd()),
    startOffset: start,
    startPosition: positionAt(sourceFile.text, start),
  });
}

function isExported(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function isDefaultExport(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.DefaultKeyword);
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) === true
  );
}

function compareComponentIdentities(
  left: DerivedComponentIdentity,
  right: DerivedComponentIdentity,
): number {
  const sourceOrder = left.source.startOffset - right.source.startOffset;
  return sourceOrder === 0 ? left.exportName.localeCompare(right.exportName) : sourceOrder;
}

function componentSummary(input: ComponentSummary): ComponentSummary {
  return {
    componentId: input.componentId,
    displayName: input.displayName,
    fxNodeIds: input.fxNodeIds,
    refSubjectIds: input.refSubjectIds,
    ...(input.hmrBoundaryId && { hmrBoundaryId: input.hmrBoundaryId }),
    ...(input.sourceLocationId && { sourceLocationId: input.sourceLocationId }),
    ...(input.templateHash && { templateHash: input.templateHash }),
  };
}

function createComponentSourceSpan(
  input: ComponentDevtoolsFactInput,
): ComponentSourceSpan | undefined {
  if (input.source) return sourceSpan(input.moduleId, input.source);
  if (!input.template || !isTemplateModuleTemplate(input.template) || !input.sourceText)
    return undefined;
  return sourceSpanFromOffsets(input.moduleId, input.sourceText, input.template.templateSpan);
}

function sourceSpan(moduleId: string, source: ComponentSourceSpanInput): ComponentSourceSpan {
  return {
    endOffset: source.endOffset,
    endPosition: source.endPosition,
    id: makeSourceLocationId(`${moduleId}:${source.startOffset}`),
    moduleId,
    startOffset: source.startOffset,
    startPosition: source.startPosition,
  };
}

function sourceSpanFromOffsets(
  moduleId: string,
  sourceText: string,
  span: SourceSpan,
): ComponentSourceSpan {
  return sourceSpan(moduleId, {
    endOffset: span.end,
    endPosition: positionAt(sourceText, span.end),
    startOffset: span.start,
    startPosition: positionAt(sourceText, span.start),
  });
}

function createTemplateFact(
  moduleId: string,
  template: TemplateModuleTemplate | Pick<TemplatePlan, "nodes" | "parts" | "templateHash">,
  sourceText: string | undefined,
): ComponentTemplateFact {
  const plan = isTemplateModuleTemplate(template) ? template.plan : template;
  const hash = makeTemplateHash(plan.templateHash);
  return {
    hash,
    parts: plan.parts.map((part) =>
      createTemplatePartFact(moduleId, plan, template, sourceText, part),
    ),
  };
}

function createTemplatePartFact(
  moduleId: string,
  plan: Pick<TemplatePlan, "nodes" | "templateHash">,
  template: TemplateModuleTemplate | Pick<TemplatePlan, "nodes" | "parts" | "templateHash">,
  sourceText: string | undefined,
  part: TemplatePlanPart,
): ComponentTemplatePartFact {
  const effectiveRuntimePath =
    part.kind === "node" ? (nodePartAnchorPath(plan, part.valueIndex) ?? part.path) : part.path;
  const expressions = partExpressionSpans(moduleId, template, sourceText, part);
  return {
    effectiveRuntimePath,
    ...(expressions[0] && { expression: expressions[0] }),
    ...(expressions.length > 0 && { expressions }),
    id: makeTemplatePartId(
      `${plan.templateHash}#${templatePartIdentity(effectiveRuntimePath, part)}`,
    ),
    kind: part.kind,
    ...("name" in part && part.name !== undefined && { name: part.name }),
    path: part.path,
    ...("valueIndex" in part && { valueIndex: part.valueIndex }),
    ...(!("valueIndex" in part) && { valueIndexes: sparseValueIndexes(part) }),
  };
}

function createFxNodeId(input: ComponentDevtoolsFactInput, root: ComponentFxRootInput): FxNodeId {
  return makeFxNodeId(root.id ?? `${input.moduleId}#${input.exportName}#${root.localName}`);
}

function createRefSubjectId(
  input: ComponentDevtoolsFactInput,
  refSubject: ComponentRefSubjectInput,
): RefSubjectId {
  return makeRefSubjectId(
    refSubject.id ??
      refSubject.serviceId ??
      `${input.moduleId}#${input.exportName}#${refSubject.localName}`,
  );
}

function pathKey(path: readonly number[]): string {
  return path.length === 0 ? "root" : path.join(".");
}

function templatePartIdentity(path: readonly number[], part: TemplatePlanPart): string {
  if ("valueIndex" in part) return `${pathKey(path)}#${part.valueIndex}`;
  const name = "name" in part && part.name ? part.name : "unnamed";
  return `${part.kind}#${name}#${pathKey(path)}#${sparseValueIndexes(part).join(".")}`;
}

function partExpressionSpans(
  moduleId: string,
  template: TemplateModuleTemplate | Pick<TemplatePlan, "nodes" | "parts" | "templateHash">,
  sourceText: string | undefined,
  part: TemplatePlanPart,
): readonly ComponentSourceSpan[] {
  if (!sourceText || !isTemplateModuleTemplate(template)) return [];
  return sparseValueIndexes(part).flatMap((index) => {
    const expression = template.expressions.find((candidate) => candidate.index === index);
    return expression ? [sourceSpanFromOffsets(moduleId, sourceText, expression.span)] : [];
  });
}

function sparseValueIndexes(part: TemplatePlanPart): readonly number[] {
  if ("valueIndex" in part) return [part.valueIndex];
  return part.nodes.flatMap((node) => (node.kind === "part" ? [node.valueIndex] : []));
}

function isTemplateModuleTemplate(
  value: TemplateModuleTemplate | Pick<TemplatePlan, "nodes" | "parts" | "templateHash">,
): value is TemplateModuleTemplate {
  return "plan" in value && "templateSpan" in value && "expressions" in value;
}

function positionAt(sourceText: string, offset: number): SourcePositionInput {
  const lines = sourceText.slice(0, offset).split("\n");
  return { column: lines.at(-1)!.length + 1, line: lines.length };
}

function nodePartAnchorPath(
  plan: Pick<TemplatePlan, "nodes">,
  valueIndex: number,
): readonly number[] | null {
  return findNodePartAnchorPath(plan.nodes, valueIndex, []);
}

function findNodePartAnchorPath(
  nodes: readonly TemplatePlanNode[],
  valueIndex: number,
  parentPath: readonly number[],
): readonly number[] | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]!;
    const path = [...parentPath, index];
    if (node.kind === "part" && node.valueIndex === valueIndex) return path;
    const childPath = childNodePartAnchorPath(node, valueIndex, path);
    if (childPath) return childPath;
  }
  return null;
}

function childNodePartAnchorPath(
  node: TemplatePlanNode,
  valueIndex: number,
  path: readonly number[],
): readonly number[] | null {
  if (node.kind === "element") return findNodePartAnchorPath(node.children, valueIndex, path);
  if (node.kind !== "textOnlyElement") return null;
  if (node.textContent?.kind === "part" && node.textContent.valueIndex === valueIndex) return path;
  return null;
}
