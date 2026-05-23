import ts from "typescript";
import type { TypedCompilerDiagnostic } from "../diagnostics/diagnostics.js";
import {
  analyzeTemplateModule,
  type AnalyzeTemplateModuleInput,
  type TemplateModuleAnalysis,
  type TemplateModuleTemplate,
} from "./analyzeTemplateModule.js";

export interface TransformTemplateModuleInput extends AnalyzeTemplateModuleInput {
  readonly metadataProperty?: string;
}

export interface TransformTemplateModuleResult {
  readonly moduleId: string;
  readonly sourceText: string;
  readonly transformed: boolean;
  readonly analysis: TemplateModuleAnalysis;
  readonly diagnostics: readonly TypedCompilerDiagnostic[];
}

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export function transformTemplateModule(
  input: TransformTemplateModuleInput,
): TransformTemplateModuleResult {
  const analysis = analyzeTemplateModule(input);
  if (analysis.templates.length === 0 || analysis.diagnostics.length > 0) {
    return unchanged(input, analysis);
  }

  const tsMod = input.ts ?? ts;
  const sourceFile = sourceFileFor(tsMod, input);
  const bindings = createTemplateBindings(input.sourceText, analysis.templates);
  const edits = createTemplateEdits(input.sourceText, analysis.templates, bindings);
  const declarationText = templateDeclarations(
    analysis.templates,
    bindings,
    input.metadataProperty ?? "typedTemplatePlan",
  );
  const sourceText = applyEdits(input.sourceText, [
    declarationEdit(sourceFile, declarationText),
    ...edits,
  ]);

  return {
    analysis,
    diagnostics: analysis.diagnostics,
    moduleId: input.moduleId,
    sourceText,
    transformed: true,
  };
}

function unchanged(
  input: TransformTemplateModuleInput,
  analysis: TemplateModuleAnalysis,
): TransformTemplateModuleResult {
  return {
    analysis,
    diagnostics: analysis.diagnostics,
    moduleId: input.moduleId,
    sourceText: input.sourceText,
    transformed: false,
  };
}

function sourceFileFor(tsMod: typeof ts, input: TransformTemplateModuleInput): ts.SourceFile {
  return tsMod.createSourceFile(input.moduleId, input.sourceText, tsMod.ScriptTarget.Latest, true);
}

function createTemplateBindings(
  sourceText: string,
  templates: readonly TemplateModuleTemplate[],
): readonly string[] {
  const bindings: string[] = [];
  for (let index = 0; index < templates.length; index++) {
    bindings.push(nextBindingName(sourceText, bindings, index));
  }
  return bindings;
}

function nextBindingName(sourceText: string, bindings: readonly string[], index: number): string {
  let candidate = `__typed_template_${index}`;
  while (sourceText.includes(candidate) || bindings.includes(candidate)) candidate = `${candidate}_`;
  return candidate;
}

function createTemplateEdits(
  sourceText: string,
  templates: readonly TemplateModuleTemplate[],
  bindings: readonly string[],
): readonly TextEdit[] {
  return templates.map((template, index) => ({
    start: template.templateSpan.start,
    end: template.templateSpan.end,
    text: templateCall(sourceText, template, bindings[index] ?? "__typed_template"),
  }));
}

function templateCall(sourceText: string, template: TemplateModuleTemplate, binding: string): string {
  const tagText = sourceText.slice(template.tagSpan.start, template.tagSpan.end);
  const expressions = template.expressions.map((expression) => expression.sourceText);
  const args = [binding, ...expressions].join(", ");
  return `${tagText}(${args})`;
}

function templateDeclarations(
  templates: readonly TemplateModuleTemplate[],
  bindings: readonly string[],
  metadataProperty: string,
): string {
  return templates
    .map((template, index) =>
      templateDeclaration(template, bindings[index] ?? "__typed_template", metadataProperty),
    )
    .join("\n");
}

function templateDeclaration(
  template: TemplateModuleTemplate,
  binding: string,
  metadataProperty: string,
): string {
  return [
    `const ${binding} = Object.assign(`,
    `${indent(jsonSource(template.quasis.map((quasi) => quasi.text)), 2)},`,
    "  {",
    `    raw: ${jsonSource(template.quasis.map((quasi) => quasi.rawText))},`,
    `    ${propertySource(metadataProperty)}: ${indent(jsonSource(template.plan), 4).trimStart()},`,
    "  },",
    "}) as unknown as TemplateStringsArray;",
  ].join("\n");
}

function jsonSource(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function propertySource(property: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(property) ? property : JSON.stringify(property);
}

function indent(value: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
}

function declarationEdit(sourceFile: ts.SourceFile, declarationText: string): TextEdit {
  const insertion = importInsertionIndex(sourceFile);
  const prefix = insertion === 0 ? "" : "\n";
  return {
    end: insertion,
    start: insertion,
    text: `${prefix}${declarationText}\n\n`,
  };
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
    .reduce(
      (text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end),
      sourceText,
    );
}
