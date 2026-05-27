import ts from "typescript";
import { planCompileCapabilities } from "../capabilities/compileCapabilities.js";
import type { TypedCompilerDiagnostic } from "../diagnostics/diagnostics.js";
import {
  analyzeComponentHmr,
  type ComponentHmrServiceDescriptor,
} from "../hmr/analyzeComponentHmr.js";
import {
  deriveComponentResumabilityFacts,
  type ComponentResumabilityFact,
} from "../resumability/componentFacts.js";
import { emitViteHmrRuntime } from "../hmr/viteHmr.js";
import { createRouteModuleMatcher, type RouteModuleMatcher } from "../route/routeModuleMatcher.js";
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
  readonly projectRoot?: string;
  readonly routeDirectories?: readonly string[];
  readonly routeModuleMatcher?: RouteModuleMatcher;
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

type TemplateValueKind =
  | "plain"
  | "effect"
  | "stream"
  | "fx"
  | "nested-template"
  | "html-render-event"
  | "dom-render-event"
  | "unknown";

type TemplateValueKinds = ReadonlyMap<number, TemplateValueKind>;

interface ValueKindFacts {
  readonly effectNamespaces: ReadonlySet<string>;
  readonly fxNamespaces: ReadonlySet<string>;
  readonly streamNamespaces: ReadonlySet<string>;
  readonly bindings: ReadonlyMap<string, TemplateValueKind>;
}

interface MutableValueKindFacts {
  readonly effectNamespaces: Set<string>;
  readonly fxNamespaces: Set<string>;
  readonly streamNamespaces: Set<string>;
  readonly bindings: Map<string, TemplateValueKind>;
}

const EMPTY_VALUE_KINDS: TemplateValueKinds = new Map();

export function transformTemplateModule(
  input: TransformTemplateModuleInput,
): TransformTemplateModuleResult {
  const analysis = analyzeTemplateModule(input);
  if (analysis.templates.length === 0 || analysis.diagnostics.length > 0) {
    return unchanged(input, analysis);
  }

  const tsMod = input.ts ?? ts;
  const sourceFile = sourceFileFor(tsMod, input);
  const routeModuleMatcher = routeModuleMatcherFor(input);
  const componentFacts = deriveComponentResumabilityFacts({
    moduleId: input.moduleId,
    sourceFile,
  });
  const templates = directEligibleTemplates(
    input.moduleId,
    routeModuleMatcher,
    sourceFile,
    componentFacts,
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
    actionDescriptorMap(componentFacts),
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
  routeModuleMatcher: RouteModuleMatcher,
  sourceFile: ts.SourceFile,
  components: readonly ComponentResumabilityFact[],
  templates: readonly TemplateModuleTemplate[],
): readonly TemplateModuleTemplate[] {
  return templates.filter((template) => {
    const node = findTaggedTemplate(
      sourceFile,
      template.templateSpan.start,
      template.templateSpan.end,
    );
    return (
      node !== null &&
      (!hasFunctionAncestor(node) || hasComponentFunctionAncestor(node, components)) &&
      !isRouteTemplateExport(moduleId, routeModuleMatcher, node)
    );
  });
}

function routeModuleMatcherFor(input: TransformTemplateModuleInput): RouteModuleMatcher {
  return (
    input.routeModuleMatcher ??
    createRouteModuleMatcher({
      projectRoot: input.projectRoot,
      routeDirectories: input.routeDirectories,
    })
  );
}

function findTaggedTemplate(
  sourceFile: ts.SourceFile,
  start: number,
  end: number,
): ts.TaggedTemplateExpression | null {
  let found: ts.TaggedTemplateExpression | null = null;
  const visit = (node: ts.Node): void => {
    if (found !== null) return;
    if (
      ts.isTaggedTemplateExpression(node) &&
      node.getStart(sourceFile) === start &&
      node.end === end
    ) {
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

function hasComponentFunctionAncestor(
  node: ts.Node,
  components: readonly ComponentResumabilityFact[],
): boolean {
  let current = node.parent;
  const names = new Set(components.map((component) => component.localName));
  while (current !== undefined) {
    const name = functionLikeName(current);
    if (name && names.has(name)) return true;
    current = current.parent;
  }
  return false;
}

function functionLikeName(node: ts.Node): string | undefined {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
  if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return undefined;
  const parent = node.parent;
  return ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)
    ? parent.name.text
    : undefined;
}

function isRouteTemplateExport(
  moduleId: string,
  routeModuleMatcher: RouteModuleMatcher,
  node: ts.TaggedTemplateExpression,
): boolean {
  if (!routeModuleMatcher(moduleId)) return false;
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
  return templates.every((template) => canEmitDirectTemplate(template.plan, target))
    ? target
    : null;
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
  "event",
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
  while (sourceText.includes(candidate) || bindings.includes(candidate))
    candidate = `${candidate}_`;
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
  actionDescriptors: ReadonlyMap<string, object>,
): string {
  const effectNamespace = findNamespaceImport(sourceFile, "effect/Effect");
  const valueKinds = templateValueKinds(sourceFile, templates);
  const importText =
    target === "dom"
      ? `${effectNamespace ? "" : 'import * as __typedTemplateEffect from "effect/Effect";\n'}import { ${domRuntimeImports(templates, actionDescriptors)} } from "@typed/template/compiler-runtime/dom";`
      : 'import { defineServerTemplate, renderServerChunks } from "@typed/template/compiler-runtime/server";';
  const effectRuntime = effectNamespace ?? "__typedTemplateEffect";
  return [
    importText,
    hmrRuntime,
    ...templates.map((template, index) =>
      target === "dom"
        ? domTemplateDeclaration(
            template,
            bindings[index] ?? "__typed_template",
            effectRuntime,
            actionDescriptors,
            valueKinds.get(template) ?? EMPTY_VALUE_KINDS,
          )
        : serverTemplateDeclaration(
            template,
            bindings[index] ?? "__typed_template",
            actionDescriptors,
            valueKinds.get(template) ?? EMPTY_VALUE_KINDS,
          ),
    ),
  ].join("\n");
}

function domRuntimeImports(
  templates: readonly TemplateModuleTemplate[],
  actionDescriptors: ReadonlyMap<string, object>,
): string {
  return [
    "bindAttr",
    "bindBoolean",
    "bindClass",
    "bindData",
    "bindEvent",
    "bindNode",
    "bindProperty",
    "bindRef",
    "bindText",
    ...(templates.some((template) => hasActionResumeDescriptor(template, actionDescriptors))
      ? ["bootActionResume"]
      : []),
    ...(templates.some((template) => hasRouteResumeMarker(template.plan))
      ? ["bootRouteResume"]
      : []),
    "defineDomTemplate",
    "getCommentAtPath",
    "getElementAtPath",
    "getNodeAtPath",
    "mountDomTemplateBindings",
  ].join(", ");
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

function templateValueKinds(
  sourceFile: ts.SourceFile,
  templates: readonly TemplateModuleTemplate[],
): ReadonlyMap<TemplateModuleTemplate, TemplateValueKinds> {
  const facts = collectValueKindFacts(sourceFile);
  return new Map(
    templates.map((template) => [
      template,
      new Map(
        template.expressions.map((expression) => [
          expression.index,
          valueKindForTemplateExpression(sourceFile, expression, facts),
        ]),
      ),
    ]),
  );
}

function collectValueKindFacts(sourceFile: ts.SourceFile): ValueKindFacts {
  const facts: MutableValueKindFacts = {
    bindings: new Map(),
    effectNamespaces: new Set(),
    fxNamespaces: new Set(),
    streamNamespaces: new Set(),
  };
  for (const statement of sourceFile.statements) collectRenderableImport(statement, facts);
  for (const statement of sourceFile.statements) collectValueKindBindings(statement, facts);
  return facts;
}

function collectRenderableImport(statement: ts.Statement, facts: MutableValueKindFacts): void {
  if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return;
  const bindings = statement.importClause?.namedBindings;
  if (!bindings) return;
  const moduleSpecifier = statement.moduleSpecifier.text;
  if (ts.isNamespaceImport(bindings)) {
    registerNamespaceImport(moduleSpecifier, bindings.name.text, facts);
    return;
  }
  for (const element of bindings.elements) {
    registerNamedImport(
      moduleSpecifier,
      element.propertyName?.text ?? element.name.text,
      element.name.text,
      facts,
    );
  }
}

function registerNamespaceImport(
  moduleSpecifier: string,
  localName: string,
  facts: MutableValueKindFacts,
): void {
  if (moduleSpecifier === "effect/Effect") facts.effectNamespaces.add(localName);
  if (moduleSpecifier === "effect/Stream") facts.streamNamespaces.add(localName);
  if (moduleSpecifier === "@typed/fx") facts.fxNamespaces.add(localName);
}

function registerNamedImport(
  moduleSpecifier: string,
  importedName: string,
  localName: string,
  facts: MutableValueKindFacts,
): void {
  if (moduleSpecifier === "effect" && importedName === "Effect")
    facts.effectNamespaces.add(localName);
  if (moduleSpecifier === "effect" && importedName === "Stream")
    facts.streamNamespaces.add(localName);
  if (moduleSpecifier === "@typed/fx" && importedName === "Fx") facts.fxNamespaces.add(localName);
}

function collectValueKindBindings(statement: ts.Statement, facts: MutableValueKindFacts): void {
  if (!ts.isVariableStatement(statement)) return;
  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
    facts.bindings.set(declaration.name.text, expressionValueKind(declaration.initializer, facts));
  }
}

function valueKindForTemplateExpression(
  sourceFile: ts.SourceFile,
  expression: TemplateModuleTemplate["expressions"][number],
  facts: ValueKindFacts,
): TemplateValueKind {
  const node = findExpressionAtSpan(sourceFile, expression.span.start, expression.span.end);
  return node ? expressionValueKind(node, facts) : "unknown";
}

function findExpressionAtSpan(
  sourceFile: ts.SourceFile,
  start: number,
  end: number,
): ts.Expression | null {
  let found: ts.Expression | null = null;
  const visit = (node: ts.Node): void => {
    if (found !== null) return;
    if (ts.isExpression(node) && node.getStart(sourceFile) === start && node.end === end) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function expressionValueKind(expression: ts.Expression, facts: ValueKindFacts): TemplateValueKind {
  const unwrapped = unwrapExpression(expression);
  if (ts.isIdentifier(unwrapped)) return facts.bindings.get(unwrapped.text) ?? "unknown";
  if (ts.isCallExpression(unwrapped)) return callExpressionValueKind(unwrapped, facts);
  if (ts.isPropertyAccessExpression(unwrapped))
    return namespaceValueKind(unwrapped.expression, facts);
  return literalValueKind(unwrapped);
}

function callExpressionValueKind(
  expression: ts.CallExpression,
  facts: ValueKindFacts,
): TemplateValueKind {
  const callee = unwrapExpression(expression.expression);
  if (!ts.isPropertyAccessExpression(callee)) return "unknown";
  if (callee.name.text === "pipe") return expressionValueKind(callee.expression, facts);
  return namespaceValueKind(callee.expression, facts);
}

function namespaceValueKind(expression: ts.Expression, facts: ValueKindFacts): TemplateValueKind {
  const root = rootIdentifier(unwrapExpression(expression));
  if (root && facts.effectNamespaces.has(root)) return "effect";
  if (root && facts.fxNamespaces.has(root)) return "fx";
  if (root && facts.streamNamespaces.has(root)) return "stream";
  return "unknown";
}

function rootIdentifier(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return rootIdentifier(expression.expression);
  if (ts.isCallExpression(expression))
    return rootIdentifier(unwrapExpression(expression.expression));
  return undefined;
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(expression)) return unwrapExpression(expression.expression);
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return unwrapExpression(expression.expression);
  }
  if (ts.isNonNullExpression(expression)) return unwrapExpression(expression.expression);
  return expression;
}

function literalValueKind(_expression: ts.Expression): TemplateValueKind {
  return "unknown";
}

function actionDescriptorMap(
  components: readonly ComponentResumabilityFact[],
): ReadonlyMap<string, object> {
  const descriptors = new Map<string, object>();
  for (const component of components) {
    for (const action of component.actions) {
      if (!action.bindingName) continue;
      descriptors.set(action.bindingName, {
        component: action.componentId,
        event: action.event,
        id: action.canonicalId,
      });
    }
  }
  return descriptors;
}

function actionDescriptorArgument(
  template: TemplateModuleTemplate,
  valueIndex: number,
  descriptors: ReadonlyMap<string, object>,
): string {
  const descriptor = actionDescriptorForValue(template, valueIndex, descriptors);
  return descriptor ? `, ${jsonSource(descriptor)}` : "";
}

function actionDescriptorProperty(
  template: TemplateModuleTemplate,
  valueIndex: number,
  descriptors: ReadonlyMap<string, object>,
): object {
  const descriptor = actionDescriptorForValue(template, valueIndex, descriptors);
  return descriptor ? { action: descriptor } : {};
}

function actionDescriptorForValue(
  template: TemplateModuleTemplate,
  valueIndex: number,
  descriptors: ReadonlyMap<string, object>,
): object | undefined {
  const expression = template.expressions.find((candidate) => candidate.index === valueIndex);
  if (!expression) return undefined;
  return descriptors.get(expression.sourceText.trim());
}

function componentIdForTemplate(
  template: TemplateModuleTemplate,
  descriptors: ReadonlyMap<string, object>,
): string | undefined {
  for (const part of template.plan.parts) {
    if (part.kind !== "event") continue;
    const descriptor = actionDescriptorForValue(template, part.valueIndex, descriptors);
    const component = descriptor && "component" in descriptor ? descriptor.component : undefined;
    if (typeof component === "string") return component;
  }
  return undefined;
}

function hasActionResumeDescriptor(
  template: TemplateModuleTemplate,
  descriptors: ReadonlyMap<string, object>,
): boolean {
  return template.plan.parts.some(
    (part) =>
      part.kind === "event" &&
      actionDescriptorForValue(template, part.valueIndex, descriptors) !== undefined,
  );
}

function domTemplateDeclaration(
  template: TemplateModuleTemplate,
  binding: string,
  effectRuntime: string,
  actionDescriptors: ReadonlyMap<string, object>,
  valueKinds: TemplateValueKinds,
): string {
  if (template.plan.parts.length > 32) {
    return tableDomTemplateDeclaration(
      template,
      binding,
      effectRuntime,
      actionDescriptors,
      valueKinds,
    );
  }
  const effects = [
    ...template.plan.parts.map((part) => {
      if (part.kind === "node") {
        const anchorPath = nodePartAnchorPath(template.plan, part.valueIndex) ?? part.path;
        return `bindNode(getCommentAtPath(instance.root, ${jsonSource(anchorPath)}), values[${part.valueIndex}], ${valueKindSource(valueKinds, part.valueIndex)}, runtime)`;
      }
      if (part.kind === "text" || part.kind === "comment") {
        return `bindText(getNodeAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}], ${valueKindSource(valueKinds, part.valueIndex)}, runtime)`;
      }
      if (part.kind === "attr") {
        return `bindAttr(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}], ${valueKindSource(valueKinds, part.valueIndex)}, runtime)`;
      }
      if (part.kind === "property") {
        return `bindProperty(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}], ${valueKindSource(valueKinds, part.valueIndex)}, runtime)`;
      }
      if (part.kind === "boolean") {
        return `bindBoolean(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}], ${valueKindSource(valueKinds, part.valueIndex)}, runtime)`;
      }
      if (part.kind === "className") {
        return `bindClass(getElementAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}], ${valueKindSource(valueKinds, part.valueIndex)}, runtime)`;
      }
      if (part.kind === "data") {
        return `bindData(getElementAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}], ${valueKindSource(valueKinds, part.valueIndex)}, runtime)`;
      }
      if (part.kind === "event") {
        return `bindEvent(getElementAtPath(instance.root, ${jsonSource(part.path)}), ${JSON.stringify(part.name)}, values[${part.valueIndex}]${actionDescriptorArgument(template, part.valueIndex, actionDescriptors)})`;
      }
      if (part.kind === "ref") {
        return `bindRef(getElementAtPath(instance.root, ${jsonSource(part.path)}), values[${part.valueIndex}])`;
      }
      if (part.kind === "properties") return `${effectRuntime}.void`;
      return `${effectRuntime}.void`;
    }),
    ...(hasActionResumeDescriptor(template, actionDescriptors)
      ? ["bootActionResume(instance.root, runtime)"]
      : []),
    ...(hasRouteResumeMarker(template.plan) ? ["bootRouteResume(instance.root, runtime)"] : []),
  ];
  return [
    `const ${binding} = defineDomTemplate({`,
    `  templateHash: ${JSON.stringify(template.plan.templateHash)},`,
    `  html: ${JSON.stringify(domStaticHtml(template.plan, componentIdForTemplate(template, actionDescriptors)))},`,
    "  mount(instance, values, runtime) {",
    `    return ${effectRuntime}.all([${effects.join(", ")}], { concurrency: "unbounded" });`,
    "  }",
    "});",
  ].join("\n");
}

function tableDomTemplateDeclaration(
  template: TemplateModuleTemplate,
  binding: string,
  effectRuntime: string,
  actionDescriptors: ReadonlyMap<string, object>,
  valueKinds: TemplateValueKinds,
): string {
  const bindingEffect = `mountDomTemplateBindings(instance, values, runtime, ${jsonSource(domBindingTable(template, actionDescriptors, valueKinds))})`;
  const effects = [
    bindingEffect,
    ...(hasActionResumeDescriptor(template, actionDescriptors)
      ? ["bootActionResume(instance.root, runtime)"]
      : []),
    ...(hasRouteResumeMarker(template.plan) ? ["bootRouteResume(instance.root, runtime)"] : []),
  ];
  const mountEffect =
    effects.length > 1
      ? `${effectRuntime}.all([${effects.join(", ")}], { concurrency: "unbounded" })`
      : bindingEffect;
  return [
    `const ${binding} = defineDomTemplate({`,
    `  templateHash: ${JSON.stringify(template.plan.templateHash)},`,
    `  html: ${JSON.stringify(domStaticHtml(template.plan, componentIdForTemplate(template, actionDescriptors)))},`,
    "  mount(instance, values, runtime) {",
    `    return ${mountEffect};`,
    "  }",
    "});",
  ].join("\n");
}

function hasRouteResumeMarker(plan: TemplatePlan): boolean {
  return plan.nodes.some(nodeHasRouteResumeMarker);
}

function nodeHasRouteResumeMarker(node: TemplatePlanNode): boolean {
  if (node.kind === "element") {
    return hasRouteResumeAttribute(node.attributes) || node.children.some(nodeHasRouteResumeMarker);
  }
  if (node.kind === "selfClosingElement" || node.kind === "textOnlyElement") {
    return hasRouteResumeAttribute(node.attributes);
  }
  return false;
}

function hasRouteResumeAttribute(attributes: readonly TemplatePlanAttribute[]): boolean {
  return attributes.some(
    (attribute) => attribute.kind === "attribute" && attribute.name === "data-typed-resume",
  );
}

function domBindingTable(
  template: TemplateModuleTemplate,
  actionDescriptors: ReadonlyMap<string, object>,
  valueKinds: TemplateValueKinds,
): readonly object[] {
  return template.plan.parts.map((part) => {
    if (part.kind === "node") {
      return {
        kind: "node",
        path: nodePartAnchorPath(template.plan, part.valueIndex) ?? part.path,
        valueIndex: part.valueIndex,
        valueKind: valueKindFor(valueKinds, part.valueIndex),
      };
    }
    if (part.kind === "text" || part.kind === "comment") {
      return {
        kind: part.kind,
        path: part.path,
        valueIndex: part.valueIndex,
        valueKind: valueKindFor(valueKinds, part.valueIndex),
      };
    }
    if (part.kind === "attr" || part.kind === "boolean" || part.kind === "property") {
      return {
        kind: part.kind,
        name: part.name,
        path: part.path,
        valueIndex: part.valueIndex,
        valueKind: valueKindFor(valueKinds, part.valueIndex),
      };
    }
    if (part.kind === "className" || part.kind === "data" || part.kind === "properties") {
      return {
        kind: part.kind,
        path: part.path,
        valueIndex: part.valueIndex,
        valueKind: valueKindFor(valueKinds, part.valueIndex),
      };
    }
    if (part.kind === "event") {
      return {
        ...actionDescriptorProperty(template, part.valueIndex, actionDescriptors),
        kind: part.kind,
        name: part.name,
        path: part.path,
        valueIndex: part.valueIndex,
      };
    }
    if (part.kind === "ref") {
      return { kind: part.kind, path: part.path, valueIndex: part.valueIndex };
    }
    return { kind: part.kind, path: part.path, valueKind: "unknown" };
  });
}

function serverTemplateDeclaration(
  template: TemplateModuleTemplate,
  binding: string,
  actionDescriptors: ReadonlyMap<string, object>,
  valueKinds: TemplateValueKinds,
): string {
  const chunks = serverChunks(
    template,
    actionDescriptors,
    componentIdForTemplate(template, actionDescriptors),
    valueKinds,
  );
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

function domStaticHtml(plan: TemplatePlan, componentId: string | undefined): string {
  const injection = { componentId, used: false };
  return plan.nodes.map((node) => domNodeHtml(node, injection)).join("");
}

function domNodeHtml(node: TemplatePlanNode, injection: ComponentDataUiInjection): string {
  switch (node.kind) {
    case "element":
      return `<${node.tagName}${domAttributesHtml(node.attributes, injection)}>${node.children
        .map((child) => domNodeHtml(child, injection))
        .join("")}</${node.tagName}>`;
    case "selfClosingElement":
      return `<${node.tagName}${domAttributesHtml(node.attributes, injection)}>`;
    case "textOnlyElement":
      return `<${node.tagName}${domAttributesHtml(node.attributes, injection)}>${node.textContent ? domTextContentHtml(node.textContent) : ""}</${node.tagName}>`;
    case "text":
      return escapeHtml(node.value);
    case "sparseText":
      return node.nodes
        .map((part) => (part.kind === "text" ? escapeHtml(part.value) : ""))
        .join("");
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

interface ComponentDataUiInjection {
  componentId: string | undefined;
  used: boolean;
  valueKinds?: TemplateValueKinds;
}

function domAttributesHtml(
  attributes: readonly TemplatePlanAttribute[],
  injection: ComponentDataUiInjection,
): string {
  const explicit = hasDataUiAttribute(attributes);
  const injected =
    !explicit && !injection.used && injection.componentId
      ? ` data-ui="${escapeAttribute(injection.componentId)}"`
      : "";
  if (injected) injection.used = true;
  return (
    injected +
    attributes
      .filter((attribute) => attribute.kind === "attribute")
      .map((attribute) => {
        const value = attribute.value === "" ? "" : `="${escapeAttribute(attribute.value)}"`;
        return ` ${attribute.name}${value}`;
      })
      .join("")
  );
}

function hasDataUiAttribute(attributes: readonly TemplatePlanAttribute[]): boolean {
  return attributes.some((attribute) => "name" in attribute && attribute.name === "data-ui");
}

function serverDataUiAttr(
  attributes: readonly TemplatePlanAttribute[],
  injection: ComponentDataUiInjection,
): string {
  if (hasDataUiAttribute(attributes) || injection.used || !injection.componentId) return "";
  injection.used = true;
  return ` data-ui="${escapeAttribute(injection.componentId)}"`;
}

function serverChunks(
  template: TemplateModuleTemplate,
  actionDescriptors: ReadonlyMap<string, object>,
  componentId: string | undefined,
  valueKinds: TemplateValueKinds,
): readonly object[] {
  return flattenServerNodes(template.plan.nodes, template, actionDescriptors, {
    componentId,
    used: false,
    valueKinds,
  });
}

function flattenServerNodes(
  nodes: readonly TemplatePlanNode[],
  template: TemplateModuleTemplate,
  actionDescriptors: ReadonlyMap<string, object>,
  injection: ComponentDataUiInjection,
): readonly object[] {
  return nodes.flatMap((node) => serverNodeChunks(node, template, actionDescriptors, injection));
}

function serverNodeChunks(
  node: TemplatePlanNode,
  template: TemplateModuleTemplate,
  actionDescriptors: ReadonlyMap<string, object>,
  injection: ComponentDataUiInjection,
): readonly object[] {
  switch (node.kind) {
    case "element":
      return [
        textChunk(`<${node.tagName}${serverDataUiAttr(node.attributes, injection)}`),
        ...serverAttributeChunks(node.attributes, template, actionDescriptors, injection),
        textChunk(">"),
        ...flattenServerNodes(node.children, template, actionDescriptors, injection),
        textChunk(`</${node.tagName}>`),
      ];
    case "selfClosingElement":
      return [
        textChunk(`<${node.tagName}${serverDataUiAttr(node.attributes, injection)}`),
        ...serverAttributeChunks(node.attributes, template, actionDescriptors, injection),
        textChunk("/>"),
      ];
    case "textOnlyElement":
      return [
        textChunk(`<${node.tagName}${serverDataUiAttr(node.attributes, injection)}`),
        ...serverAttributeChunks(node.attributes, template, actionDescriptors, injection),
        textChunk(">"),
        ...(node.textContent ? serverTextContentChunks(node.textContent, injection) : []),
        textChunk(`</${node.tagName}>`),
      ];
    case "text":
      return [textChunk(escapeHtml(node.value))];
    case "sparseText":
      return sparseChunks(node.nodes, injection);
    case "part":
      return [
        textChunk(`<!--n_${node.valueIndex}-->`),
        slotChunk(node.valueIndex, injection),
        textChunk(`<!--/n_${node.valueIndex}-->`),
      ];
    case "commentPart":
      return [textChunk("<!--"), slotChunk(node.valueIndex, injection), textChunk("-->")];
    case "comment":
      return [textChunk(`<!--${node.value}-->`)];
    case "sparseComment":
      return [textChunk("<!--"), ...sparseChunks(node.nodes, injection), textChunk("-->")];
    case "doctype":
      return [textChunk(`<!DOCTYPE ${node.name}>`)];
  }
}

function serverTextContentChunks(
  node: TemplatePlanTextContent,
  injection: ComponentDataUiInjection,
): readonly object[] {
  if (node.kind === "text") return [textChunk(node.value)];
  if (node.kind === "sparseText") return sparseChunks(node.nodes, injection);
  if (node.kind === "part") return [slotChunk(node.valueIndex, injection)];
  return [];
}

function sparseChunks(
  parts: readonly TemplatePlanSparsePart[],
  injection: ComponentDataUiInjection,
): readonly object[] {
  return parts.map((part) =>
    part.kind === "text" ? textChunk(part.value) : slotChunk(part.valueIndex, injection),
  );
}

function serverAttributeChunks(
  attributes: readonly TemplatePlanAttribute[],
  template: TemplateModuleTemplate,
  actionDescriptors: ReadonlyMap<string, object>,
  injection: ComponentDataUiInjection,
): readonly object[] {
  return attributes.flatMap((attribute) => {
    if (attribute.kind === "attribute")
      return [textChunk(` ${attribute.name}="${attribute.value}"`)];
    if (attribute.kind === "dynamicAttribute" || attribute.kind === "className") {
      return [slotChunk(attribute.valueIndex, injection, "attr", attribute.name)];
    }
    if (attribute.kind === "boolean")
      return [slotChunk(attribute.valueIndex, injection, "boolean", attribute.name)];
    if (attribute.kind === "property")
      return [slotChunk(attribute.valueIndex, injection, "attr", attribute.name)];
    if (attribute.kind === "event")
      return [
        slotChunk(
          attribute.valueIndex,
          injection,
          "event",
          attribute.name,
          actionDescriptorForValue(template, attribute.valueIndex, actionDescriptors),
        ),
      ];
    return [];
  });
}

function textChunk(text: string): object {
  return { kind: "text", text };
}

function valueKindFor(
  valueKinds: TemplateValueKinds | undefined,
  valueIndex: number,
): TemplateValueKind {
  return valueKinds?.get(valueIndex) ?? "unknown";
}

function valueKindSource(valueKinds: TemplateValueKinds, valueIndex: number): string {
  return JSON.stringify(valueKindFor(valueKinds, valueIndex));
}

function slotChunk(
  valueIndex: number,
  injection: ComponentDataUiInjection,
  mode: string = "node",
  name?: string,
  action?: object,
): object {
  return {
    ...(action ? { action } : {}),
    kind: "slot",
    valueIndex,
    valueKind: valueKindFor(injection.valueKinds, valueIndex),
    mode,
    ...(name ? { name } : {}),
  };
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
