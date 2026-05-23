import ts from "typescript";
import {
  createCompilerDiagnostic,
  sortDiagnostics,
  type SourceSpan,
  type TypedCompilerDiagnostic,
} from "../diagnostics/diagnostics.js";
import { analyzeTemplate } from "./analyzeTemplate.js";
import type { TemplatePlan } from "./TemplatePlan.js";

export interface AnalyzeTemplateModuleInput {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly ts?: typeof ts;
}

export interface TemplateModuleAnalysis {
  readonly moduleId: string;
  readonly templates: readonly TemplateModuleTemplate[];
  readonly diagnostics: readonly TypedCompilerDiagnostic[];
}

export interface TemplateModuleTemplate {
  readonly tagName: string;
  readonly localName?: string;
  readonly plan: TemplatePlan;
  readonly templateSpan: SourceSpan;
  readonly tagSpan: SourceSpan;
  readonly quasis: readonly TemplateModuleQuasi[];
  readonly expressions: readonly TemplateModuleExpression[];
}

export interface TemplateModuleQuasi {
  readonly index: number;
  readonly text: string;
  readonly rawText: string;
  readonly span: SourceSpan;
}

export interface TemplateModuleExpression {
  readonly index: number;
  readonly sourceText: string;
  readonly span: SourceSpan;
}

interface HtmlImports {
  readonly named: ReadonlySet<string>;
  readonly namespaces: ReadonlySet<string>;
}

export function analyzeTemplateModule(input: AnalyzeTemplateModuleInput): TemplateModuleAnalysis {
  const tsMod = input.ts ?? ts;
  const sourceFile = tsMod.createSourceFile(
    input.moduleId,
    input.sourceText,
    tsMod.ScriptTarget.Latest,
    true,
  );
  const htmlImports = collectHtmlImports(tsMod, sourceFile);
  const templates: TemplateModuleTemplate[] = [];
  const diagnostics: TypedCompilerDiagnostic[] = [];

  visitNodes(tsMod, sourceFile, (node) => {
    if (!tsMod.isTaggedTemplateExpression(node)) return;
    const tagName = htmlTagName(tsMod, node.tag, htmlImports);
    if (!tagName) return;
    const template = analyzeTaggedTemplate(tsMod, sourceFile, node, tagName, input.moduleId);
    if (isDiagnostic(template)) diagnostics.push(template);
    else templates.push(template);
  });

  return {
    moduleId: input.moduleId,
    templates,
    diagnostics: sortDiagnostics(diagnostics),
  };
}

function collectHtmlImports(tsMod: typeof ts, sourceFile: ts.SourceFile): HtmlImports {
  const named = new Set<string>();
  const namespaces = new Set<string>();
  for (const statement of sourceFile.statements) {
    collectImportAliases(tsMod, statement, named, namespaces);
  }
  return { named, namespaces };
}

function collectImportAliases(
  tsMod: typeof ts,
  statement: ts.Statement,
  named: Set<string>,
  namespaces: Set<string>,
): void {
  if (!tsMod.isImportDeclaration(statement) || !isTypedTemplateImport(tsMod, statement)) return;
  const bindings = statement.importClause?.namedBindings;
  if (!bindings) return;
  if (tsMod.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
  else collectNamedAliases(bindings, named);
}

function collectNamedAliases(bindings: ts.NamedImports, named: Set<string>): void {
  for (const element of bindings.elements) {
    const importedName = element.propertyName?.text ?? element.name.text;
    if (importedName === "html") named.add(element.name.text);
  }
}

function isTypedTemplateImport(tsMod: typeof ts, statement: ts.ImportDeclaration): boolean {
  return (
    tsMod.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === "@typed/template"
  );
}

function htmlTagName(
  tsMod: typeof ts,
  tag: ts.LeftHandSideExpression,
  imports: HtmlImports,
): string | null {
  if (tsMod.isIdentifier(tag)) return imports.named.has(tag.text) ? tag.text : null;
  if (!tsMod.isPropertyAccessExpression(tag) || tag.name.text !== "html") return null;
  if (!tsMod.isIdentifier(tag.expression)) return null;
  return imports.namespaces.has(tag.expression.text) ? `${tag.expression.text}.html` : null;
}

function analyzeTaggedTemplate(
  tsMod: typeof ts,
  sourceFile: ts.SourceFile,
  node: ts.TaggedTemplateExpression,
  tagName: string,
  moduleId: string,
): TemplateModuleTemplate | TypedCompilerDiagnostic {
  const quasis = collectQuasis(tsMod, sourceFile, node.template);
  try {
    return {
      tagName,
      localName: localTemplateName(tsMod, node),
      plan: analyzeTemplate(toTemplateStrings(quasis)),
      templateSpan: nodeSpan(sourceFile, node),
      tagSpan: nodeSpan(sourceFile, node.tag),
      quasis,
      expressions: collectExpressions(tsMod, sourceFile, node.template),
    };
  } catch (error) {
    return templateAnalysisDiagnostic(moduleId, nodeSpan(sourceFile, node), error);
  }
}

function collectQuasis(
  tsMod: typeof ts,
  sourceFile: ts.SourceFile,
  node: ts.TemplateLiteral,
): readonly TemplateModuleQuasi[] {
  if (tsMod.isNoSubstitutionTemplateLiteral(node)) return [templateQuasi(0, sourceFile, node)];
  return [
    templateQuasi(0, sourceFile, node.head),
    ...node.templateSpans.map(templateSpanQuasi(sourceFile)),
  ];
}

function templateSpanQuasi(
  sourceFile: ts.SourceFile,
): (templateSpan: ts.TemplateSpan, index: number) => TemplateModuleQuasi {
  return (templateSpan, index) => templateQuasi(index + 1, sourceFile, templateSpan.literal);
}

function templateQuasi(
  index: number,
  sourceFile: ts.SourceFile,
  literal: ts.TemplateLiteralLikeNode,
): TemplateModuleQuasi {
  return {
    index,
    text: literal.text,
    rawText: rawTemplateText(literal),
    span: nodeSpan(sourceFile, literal),
  };
}

function collectExpressions(
  tsMod: typeof ts,
  sourceFile: ts.SourceFile,
  node: ts.TemplateLiteral,
): readonly TemplateModuleExpression[] {
  if (tsMod.isNoSubstitutionTemplateLiteral(node)) return [];
  return node.templateSpans.map((span, index) =>
    templateExpression(sourceFile, span.expression, index),
  );
}

function templateExpression(
  sourceFile: ts.SourceFile,
  expression: ts.Expression,
  index: number,
): TemplateModuleExpression {
  const span = nodeSpan(sourceFile, expression);
  return { index, span, sourceText: sourceFile.text.slice(span.start, span.end) };
}

function localTemplateName(tsMod: typeof ts, node: ts.TaggedTemplateExpression): string | undefined {
  const parent = node.parent;
  if (!tsMod.isVariableDeclaration(parent) || !tsMod.isIdentifier(parent.name)) return undefined;
  return parent.name.text;
}

function toTemplateStrings(quasis: readonly TemplateModuleQuasi[]): TemplateStringsArray {
  const cooked = quasis.map((quasi) => quasi.text);
  const raw = quasis.map((quasi) => quasi.rawText);
  return Object.assign(cooked, { raw }) as unknown as TemplateStringsArray;
}

function rawTemplateText(literal: ts.TemplateLiteralLikeNode): string {
  if ("rawText" in literal && typeof literal.rawText === "string") return literal.rawText;
  return literal.text;
}

function nodeSpan(sourceFile: ts.SourceFile, node: ts.Node): SourceSpan {
  return { start: node.getStart(sourceFile), end: node.getEnd() };
}

function templateAnalysisDiagnostic(
  moduleId: string,
  span: SourceSpan,
  error: unknown,
): TypedCompilerDiagnostic {
  return createCompilerDiagnostic({
    code: "TYPED-TEMPLATE-ANALYZE-001",
    fileName: moduleId,
    message: error instanceof Error ? error.message : "Unable to analyze template module.",
    severity: "error",
    source: "compiler",
    span,
  });
}

function isDiagnostic(
  value: TemplateModuleTemplate | TypedCompilerDiagnostic,
): value is TypedCompilerDiagnostic {
  return "severity" in value;
}

function visitNodes(tsMod: typeof ts, root: ts.Node, onNode: (node: ts.Node) => void): void {
  const visit = (node: ts.Node): void => {
    onNode(node);
    tsMod.forEachChild(node, visit);
  };
  visit(root);
}
