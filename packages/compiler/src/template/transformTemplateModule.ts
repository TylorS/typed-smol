import ts from "typescript";
import { planCompileCapabilities } from "../capabilities/compileCapabilities.js";
import type { TypedCompilerDiagnostic } from "../diagnostics/diagnostics.js";
import {
  analyzeComponentHmr,
  type ComponentHmrServiceDescriptor,
} from "../hmr/analyzeComponentHmr.js";
import { emitViteHmrRuntime } from "../hmr/viteHmr.js";
import {
  analyzeTemplateModule,
  type AnalyzeTemplateModuleInput,
  type TemplateModuleAnalysis,
  type TemplateModuleTemplate,
} from "./analyzeTemplateModule.js";
import type {
  TemplatePlan,
  TemplatePlanAttribute,
  TemplatePlanNode,
  TemplatePlanSparsePart,
  TemplatePlanTextContent,
} from "./TemplatePlan.js";

export interface TransformTemplateModuleInput extends AnalyzeTemplateModuleInput {
  readonly target?: "dom" | "server";
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
  const templates = directEligibleTemplates(
    input.moduleId,
    sourceFile,
    topLevelTemplates(analysis.templates),
  );
  if (templates.length === 0) return unchanged(input, analysis);
  const target = directTargetFor(input.target ?? "dom", templates);
  if (target === null) return unchanged(input, analysis);
  const bindings = createTemplateBindings(input.sourceText, templates);
  const edits = createTemplateEdits(templates, bindings);
  const hmr = hmrTemplateSupport(input, target, templates);
  const declarationText = directTemplateDeclarations(
    sourceFile,
    templates,
    bindings,
    target,
    hmr.runtime,
  );
  const sourceText = applyEdits(input.sourceText, [
    declarationEdit(sourceFile, declarationText),
    ...hmr.edits,
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

function topLevelTemplates(
  templates: readonly TemplateModuleTemplate[],
): readonly TemplateModuleTemplate[] {
  return templates.filter((template) => !isNestedTemplate(template, templates));
}

function directEligibleTemplates(
  moduleId: string,
  sourceFile: ts.SourceFile,
  templates: readonly TemplateModuleTemplate[],
): readonly TemplateModuleTemplate[] {
  return templates.filter((template) => {
    const node = findTaggedTemplate(sourceFile, template.templateSpan.start, template.templateSpan.end);
    return (
      node !== null &&
      !hasFunctionAncestor(node) &&
      !isRouteTemplateExport(moduleId, node)
    );
  });
}

function findTaggedTemplate(
  sourceFile: ts.SourceFile,
  start: number,
  end: number,
): ts.TaggedTemplateExpression | null {
  let found: ts.TaggedTemplateExpression | null = null;
  const visit = (node: ts.Node): void => {
    if (found !== null) return;
    if (ts.isTaggedTemplateExpression(node) && node.getStart(sourceFile) === start && node.end === end) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function hasFunctionAncestor(node: ts.Node): boolean {
  let current = node.parent;
  while (current !== undefined) {
    if (ts.isFunctionLike(current)) return true;
    current = current.parent;
  }
  return false;
}

function isRouteTemplateExport(moduleId: string, node: ts.TaggedTemplateExpression): boolean {
  if (!moduleId.includes("/routes/")) return false;
  const declaration = node.parent;
  if (!ts.isVariableDeclaration(declaration)) return false;
  if (!ts.isIdentifier(declaration.name)) return false;
  return declaration.name.text === "template" || declaration.name.text === "layout";
}

function isNestedTemplate(
  template: TemplateModuleTemplate,
  templates: readonly TemplateModuleTemplate[],
): boolean {
  return templates.some(
    (other) =>
      other !== template &&
      other.templateSpan.start < template.templateSpan.start &&
      other.templateSpan.end > template.templateSpan.end,
  );
}

function directTargetFor(
  target: "dom" | "server",
  templates: readonly TemplateModuleTemplate[],
): "dom" | "server" | null {
  return templates.every((template) => canEmitDirectTemplate(template.plan, target)) ? target : null;
}

function canEmitDirectTemplate(plan: TemplatePlan, target: "dom" | "server"): boolean {
  return plan.parts.every((part) => {
    if (target === "dom") return domDirectParts.has(part.kind);
    return serverDirectParts.has(part.kind);
  });
}

const domDirectParts = new Set<TemplatePlan["parts"][number]["kind"]>([
  "attr",
  "boolean",
  "className",
  "comment",
  "data",
  "event",
  "node",
  "property",
  "ref",
  "text",
]);

const serverDirectParts = new Set<TemplatePlan["parts"][number]["kind"]>([
  "attr",
  "boolean",
  "className",
  "comment",
  "node",
  "property",
  "sparseComment",
  "sparseText",
  "text",
]);

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
  templates: readonly TemplateModuleTemplate[],
  bindings: readonly string[],
): readonly TextEdit[] {
  return templates.map((template, index) => ({
    start: template.templateSpan.start,
    end: template.templateSpan.end,
    text: directTemplateCall(template, bindings[index] ?? "__typed_template"),
  }));
}

interface HmrTemplateSupport {
  readonly edits: readonly TextEdit[];
  readonly runtime: string;
}

function hmrTemplateSupport(
  input: TransformTemplateModuleInput,
  target: "dom" | "server",
  templates: readonly TemplateModuleTemplate[],
): HmrTemplateSupport {
  if (target !== "dom") return { edits: [], runtime: "" };

  const component = analyzeComponentHmr({
    boundary: "route-component",
    moduleId: input.moduleId,
    sourceText: input.sourceText,
  });
  const plan = planCompileCapabilities({
    boundary: "route-component",
    component,
    moduleId: input.moduleId,
    templates: templates.map((template) => template.plan),
  });
  const runtime = emitViteHmrRuntime({
    eligible: plan.hmr.eligible,
    moduleId: input.moduleId,
    rejected: plan.hmr.rejected,
    services: plan.hmr.services,
  });

  return { edits: inlineHmrStateEdits(input.sourceText, component.services), runtime };
}

function inlineHmrStateEdits(
  sourceText: string,
  services: readonly ComponentHmrServiceDescriptor[],
): readonly TextEdit[] {
  const edits: TextEdit[] = [];
  for (const service of services) {
    if (service.kind !== "inline-refsubject") continue;
    const initializerSource = service.initializerSource;
    if (initializerSource.length === 0) continue;
    const start = sourceText.indexOf(`yield* ${initializerSource}`);
    if (start === -1) continue;
    const end = start + `yield* ${initializerSource}`.length;
    edits.push({
      start,
      end,
      text: `yield* __typedGetHmrStateEffect(${JSON.stringify(service.serviceId)}, () => ${initializerSource})`,
    });
  }
  return edits;
}

function directTemplateDeclarations(
  sourceFile: ts.SourceFile,
  templates: readonly TemplateModuleTemplate[],
  bindings: readonly string[],
  target: "dom" | "server",
  hmrRuntime: string,
): string {
  const effectNamespace = findNamespaceImport(sourceFile, "effect/Effect");
  const importText =
    target === "dom"
      ? `${effectNamespace ? "" : 'import * as __typedTemplateEffect from "effect/Effect";\n'}import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath } from "@typed/template/compiler-runtime/dom";`
      : 'import { defineServerTemplate, renderServerChunks } from "@typed/template/compiler-runtime/server";';
  const effectRuntime = effectNamespace ?? "__typedTemplateEffect";
  return [
    importText,
    hmrRuntime,
    ...templates.map((template, index) =>
      target === "dom"
        ? domTemplateDeclaration(template, bindings[index] ?? "__typed_template", effectRuntime)
        : serverTemplateDeclaration(template, bindings[index] ?? "__typed_template"),
    ),
  ].join("\n");
}

function findNamespaceImport(sourceFile: ts.SourceFile, moduleSpecifier: string): string | null {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== moduleSpecifier) continue;
    const namedBindings = statement.importClause?.namedBindings;
    if (namedBindings && ts.isNamespaceImport(namedBindings)) return namedBindings.name.text;
  }
  return null;
}

function directTemplateCall(template: TemplateModuleTemplate, binding: string): string {
  const expressions = template.expressions.map((expression) => expression.sourceText);
  return `${binding}(${expressions.join(", ")})`;
}

function domTemplateDeclaration(
  template: TemplateModuleTemplate,
  binding: string,
  effectRuntime: string,
): string {
  const effects = template.plan.parts.map((part) => {
    if (part.kind === "node") {
      const anchorPath = nodePartAnchorPath(template.plan, part.valueIndex) ?? part.path;
      return `bindNode(getCommentAtPath(instance.root, ${jsonSource(anchorPath)}), values[${part.valueIndex}], "unknown", runtime)`;
    }
    if (part.kind === "text" || part.kind === "comment") {
      return `bindText(getNodeAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}], "unknown", runtime)`;
    }
    if (part.kind === "attr") {
      return `bindAttr(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}], "unknown", runtime)`;
    }
    if (part.kind === "property") {
      return `bindProperty(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}], "unknown", runtime)`;
    }
    if (part.kind === "boolean") {
      return `bindBoolean(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}], "unknown", runtime)`;
    }
    if (part.kind === "className") {
      return `bindClass(getElementAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}], "unknown", runtime)`;
    }
    if (part.kind === "data") {
      return `bindData(getElementAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}], "unknown", runtime)`;
    }
    if (part.kind === "event") {
      return `bindEvent(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}])`;
    }
    if (part.kind === "ref") {
      return `bindRef(getElementAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}])`;
    }
    if (part.kind === "properties") return `${effectRuntime}.void`;
    return `${effectRuntime}.void`;
  });
  return [
    `const ${binding} = defineDomTemplate({`,
    `  templateHash: ${JSON.stringify(template.plan.templateHash)},`,
    `  html: ${JSON.stringify(domStaticHtml(template.plan))},`,
    "  mount(instance, values, runtime) {",
    `    return ${effectRuntime}.all([${effects.join(", ")}], { concurrency: "unbounded" });`,
    "  }",
    "});",
  ].join("\n");
}

function serverTemplateDeclaration(template: TemplateModuleTemplate, binding: string): string {
  const chunks = serverChunks(template.plan);
  return [
    `const ${binding} = defineServerTemplate({`,
    `  templateHash: ${JSON.stringify(template.plan.templateHash)},`,
    `  chunks: ${jsonSource(chunks)},`,
    "  render(values, runtime) {",
    `    return renderServerChunks(values, runtime, ${jsonSource(chunks)});`,
    "  }",
    "});",
  ].join("\n");
}

function domStaticHtml(plan: TemplatePlan): string {
  return plan.nodes.map(domNodeHtml).join("");
}

function domNodeHtml(node: TemplatePlanNode): string {
  switch (node.kind) {
    case "element":
      return `<${node.tagName}${domAttributesHtml(node.attributes)}>${node.children
        .map(domNodeHtml)
        .join("")}</${node.tagName}>`;
    case "selfClosingElement":
      return `<${node.tagName}${domAttributesHtml(node.attributes)}>`;
    case "textOnlyElement":
      return `<${node.tagName}${domAttributesHtml(node.attributes)}>${node.textContent ? domTextContentHtml(node.textContent) : ""}</${node.tagName}>`;
    case "text":
      return escapeHtml(node.value);
    case "sparseText":
      return node.nodes.map((part) => (part.kind === "text" ? escapeHtml(part.value) : "")).join("");
    case "part":
      return `<!--n_${node.valueIndex}-->`;
    case "commentPart":
      return "";
    case "comment":
      return `<!--${node.value}-->`;
    case "sparseComment":
      return `<!--${node.nodes.map((part) => (part.kind === "text" ? part.value : "")).join("")}-->`;
    case "doctype":
      return `<!DOCTYPE ${node.name}>`;
  }
}

function domTextContentHtml(node: TemplatePlanTextContent): string {
  if (node.kind === "text") return escapeHtml(node.value);
  if (node.kind === "sparseText") {
    return node.nodes.map((part) => (part.kind === "text" ? escapeHtml(part.value) : "")).join("");
  }
  if (node.kind === "part") return "";
  return "";
}

function domAttributesHtml(attributes: readonly TemplatePlanAttribute[]): string {
  return attributes
    .filter((attribute) => attribute.kind === "attribute")
    .map((attribute) => {
      const value = attribute.value === "" ? "" : `="${escapeAttribute(attribute.value)}"`;
      return ` ${attribute.name}${value}`;
    })
    .join("");
}

function serverChunks(plan: TemplatePlan): readonly object[] {
  return flattenServerNodes(plan.nodes);
}

function flattenServerNodes(nodes: readonly TemplatePlanNode[]): readonly object[] {
  return nodes.flatMap(serverNodeChunks);
}

function serverNodeChunks(node: TemplatePlanNode): readonly object[] {
  switch (node.kind) {
    case "element":
      return [
        textChunk(`<${node.tagName}`),
        ...serverAttributeChunks(node.attributes),
        textChunk(">"),
        ...flattenServerNodes(node.children),
        textChunk(`</${node.tagName}>`),
      ];
    case "selfClosingElement":
      return [textChunk(`<${node.tagName}`), ...serverAttributeChunks(node.attributes), textChunk("/>")];
    case "textOnlyElement":
      return [
        textChunk(`<${node.tagName}`),
        ...serverAttributeChunks(node.attributes),
        textChunk(">"),
        ...(node.textContent ? serverTextContentChunks(node.textContent) : []),
        textChunk(`</${node.tagName}>`),
      ];
    case "text":
      return [textChunk(escapeHtml(node.value))];
    case "sparseText":
      return sparseChunks(node.nodes);
    case "part":
      return [
        textChunk(`<!--n_${node.valueIndex}-->`),
        slotChunk(node.valueIndex),
        textChunk(`<!--/n_${node.valueIndex}-->`),
      ];
    case "commentPart":
      return [textChunk("<!--"), slotChunk(node.valueIndex), textChunk("-->")];
    case "comment":
      return [textChunk(`<!--${node.value}-->`)];
    case "sparseComment":
      return [textChunk("<!--"), ...sparseChunks(node.nodes), textChunk("-->")];
    case "doctype":
      return [textChunk(`<!DOCTYPE ${node.name}>`)];
  }
}

function serverTextContentChunks(
  node: TemplatePlanTextContent,
): readonly object[] {
  if (node.kind === "text") return [textChunk(node.value)];
  if (node.kind === "sparseText") return sparseChunks(node.nodes);
  if (node.kind === "part") return [slotChunk(node.valueIndex)];
  return [];
}

function sparseChunks(parts: readonly TemplatePlanSparsePart[]): readonly object[] {
  return parts.map((part) =>
    part.kind === "text" ? textChunk(part.value) : slotChunk(part.valueIndex),
  );
}

function serverAttributeChunks(attributes: readonly TemplatePlanAttribute[]): readonly object[] {
  return attributes.flatMap((attribute) => {
    if (attribute.kind === "attribute") return [textChunk(` ${attribute.name}="${attribute.value}"`)];
    if (attribute.kind === "dynamicAttribute" || attribute.kind === "className") {
      return [slotChunk(attribute.valueIndex, "attr", attribute.name)];
    }
    if (attribute.kind === "boolean") return [slotChunk(attribute.valueIndex, "boolean", attribute.name)];
    if (attribute.kind === "property") return [slotChunk(attribute.valueIndex, "attr", attribute.name)];
    return [];
  });
}

function textChunk(text: string): object {
  return { kind: "text", text };
}

function slotChunk(valueIndex: number, mode: string = "node", name?: string): object {
  return name
    ? { kind: "slot", valueIndex, valueKind: "unknown", mode, name }
    : { kind: "slot", valueIndex, valueKind: "unknown", mode };
}

function nodePartAnchorPath(plan: TemplatePlan, valueIndex: number): readonly number[] | null {
  return findNodePartAnchorPath(plan.nodes, valueIndex, []);
}

function findNodePartAnchorPath(
  nodes: readonly TemplatePlanNode[],
  valueIndex: number,
  parentPath: readonly number[],
): readonly number[] | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
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

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function jsonSource(value: unknown): string {
  return JSON.stringify(value, null, 2);
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
