import { existsSync, statSync } from "node:fs";
import { basename, dirname, relative } from "node:path";
import type {
  ConstructorTypeNode,
  ExportedTypeInfo,
  FunctionSignature,
  FunctionTypeNode,
  ObjectProperty,
  OverloadSetTypeNode,
  TypeInfoApi,
  TypeNode,
  VirtualModuleBuildContext,
  VirtualModuleBuildError,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import { isCallableNode, typeNodeToRuntimeKind } from "./internal/routeTypeNode.js";
import { ModuleSource } from "./internal/moduleSource.js";
import { pathIsUnderBase, resolvePathUnderBase, toPosixPath } from "./internal/path.js";
import { pathToIdentifier } from "./internal/routeIdentifiers.js";
import { COMPONENT_TYPE_TARGET_SPECS } from "./internal/typeTargetSpecs.js";

const DEFAULT_PREFIX = "typed:component";
const DEFAULT_PLUGIN_NAME = "typed-component-virtual-module";
const COMPONENT_EXPORTS = [
  "entrypoint",
  "Input",
  "InputSchema",
  "InputArbitrary",
  "InputArbitraryLazy",
  "InputEquivalence",
  "InputFormatter",
  "InputRepresentation",
  "InputJsonSchema",
  "InputStandardSchema",
  "InputStandardJsonSchema",
  "argTypes",
  "Component",
  "render",
  "ComponentResult",
  "ComponentError",
  "ComponentServices",
  "makeComponentStory",
  "makeComponentProperty",
] as const;

export type ParseComponentVirtualModuleIdResult =
  | { readonly ok: true; readonly path: string; readonly exportName: string }
  | { readonly ok: false; readonly code: string; readonly reason: string };

export interface ComponentVirtualModulePluginOptions {
  readonly prefix?: string;
  readonly name?: string;
}

type ResolvedComponentTarget =
  | {
      readonly ok: true;
      readonly exportName: string;
      readonly targetPath: string;
    }
  | { readonly ok: false; readonly code: string; readonly reason: string };

type ComponentSignature = {
  readonly inputType: TypeNode;
  readonly renderType: TypeNode;
  readonly callable: boolean;
};

type CallableComponentTypeNode = FunctionTypeNode | ConstructorTypeNode | OverloadSetTypeNode;

export function parseComponentVirtualModuleId(
  id: string,
  prefix = DEFAULT_PREFIX,
): ParseComponentVirtualModuleIdResult {
  if (id !== prefix && !id.startsWith(`${prefix}?`)) {
    return { ok: false, code: "CVM-COMPONENT-ID-001", reason: `id must be "${prefix}?path=<path>"` };
  }
  const params = new URLSearchParams(id === prefix ? "" : id.slice(prefix.length + 1));
  const unsupported = [...params.keys()].find((key) => key !== "path" && key !== "export");
  if (unsupported) {
    return {
      ok: false,
      code: "CVM-COMPONENT-QUERY-001",
      reason: `typed:component does not support query option "${unsupported}"`,
    };
  }
  const paths = params.getAll("path");
  if (paths.length !== 1) {
    return {
      ok: false,
      code: "CVM-COMPONENT-PATH-001",
      reason: 'typed:component requires exactly one "path" query option',
    };
  }
  const path = paths[0]!;
  if (path.includes("://") || path.startsWith("/") || !path.startsWith("./") && !path.startsWith("../")) {
    return {
      ok: false,
      code: "CVM-COMPONENT-PATH-002",
      reason: "typed:component path must be a relative path",
    };
  }
  const exportName = params.get("export") ?? "default";
  return { ok: true, path, exportName };
}

export function createComponentVirtualModulePlugin(
  options: ComponentVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    typeTargetSpecs: COMPONENT_TYPE_TARGET_SPECS,
    shouldResolve(id, importer) {
      return Boolean(importer) && (id === prefix || id.startsWith(`${prefix}?`));
    },
    build(id, importer, api, context) {
      const resolved = resolveComponentTarget(id, importer, prefix, context?.rootImporter);
      if (!resolved.ok) return buildError(resolved.code, resolved.reason, name);
      if (!existsSync(resolved.targetPath) || !statSync(resolved.targetPath).isFile()) {
        return buildError(
          "CVM-COMPONENT-PATH-003",
          `component target does not exist: ${resolved.targetPath}`,
          name,
        );
      }
      if (!shouldEmitAnyComponentExport(context)) return "export {};";
      return emitComponentSource(resolved, importer, api, name, context);
    },
  };
}

function shouldEmitAnyComponentExport(context: VirtualModuleBuildContext | undefined): boolean {
  if (!context || context.requestedExports.kind === "all") return true;
  return COMPONENT_EXPORTS.some((name) => requestsComponentExport(context, name));
}

function resolveComponentTarget(
  id: string,
  importer: string,
  prefix: string,
  rootImporter = importer,
): ResolvedComponentTarget {
  const parsed = parseComponentVirtualModuleId(id, prefix);
  if (!parsed.ok) return parsed;
  const importerDir = dirname(toPosixPath(rootImporter));
  const resolved = resolvePathUnderBase(importerDir, parsed.path);
  if (!resolved.ok || !pathIsUnderBase(importerDir, resolved.path)) {
    return {
      ok: false,
      code: "CVM-COMPONENT-PATH-004",
      reason: "resolved component path escapes importer base directory",
    };
  }
  return { ok: true, exportName: parsed.exportName, targetPath: toPosixPath(resolved.path) };
}

function emitComponentSource(
  target: Extract<ResolvedComponentTarget, { readonly ok: true }>,
  importer: string,
  api: TypeInfoApi,
  pluginName: string,
  context: VirtualModuleBuildContext | undefined,
): string | VirtualModuleBuildError {
  const source = api.file(`./${basename(target.targetPath)}`, {
    baseDir: dirname(target.targetPath),
    watch: true,
  });
  if (!source.ok) {
    return buildError("CVM-COMPONENT-FILE-001", `could not inspect ${target.targetPath}`, pluginName);
  }
  const componentExport = source.snapshot.exports.find((entry) => entry.name === target.exportName);
  if (!componentExport) {
    return buildError(
      "CVM-COMPONENT-EXPORT-001",
      `component export ${JSON.stringify(target.exportName)} was not found in ${target.targetPath}`,
      pluginName,
    );
  }
  const signature = componentSignature(componentExport.type, api);
  if (!signature) {
    return buildError(
      "CVM-COMPONENT-INPUT-001",
      `component export ${JSON.stringify(target.exportName)} must accept at most one input object`,
      pluginName,
    );
  }
  if (typeNodeToRuntimeKind(signature.renderType, api) === "unknown") {
    return buildError("CVM-COMPONENT-RENDER-001", "component export is not renderable", pluginName);
  }

  const inputType = preferExportedInputType(signature.inputType, source.snapshot.exports);

  return emitComponentModule(target, importer, signature, inputType, api, pluginName, context);
}

function componentSignature(type: TypeNode, api: TypeInfoApi): ComponentSignature | undefined {
  if (!isCallableNode(type)) {
    return { callable: false, inputType: emptyInputNode(), renderType: type };
  }

  const candidates = callableSignatures(type)
    .map((signature) => componentSignatureFromCallable(signature, api))
    .filter((signature): signature is ComponentSignature => signature !== undefined);
  const distinct = distinctComponentSignatures(candidates);

  return distinct.length === 1 ? distinct[0] : undefined;
}

function componentSignatureFromCallable(
  signature: FunctionSignature,
  api: TypeInfoApi,
): ComponentSignature | undefined {
  const params = signature.parameters;
  if (!params || params.length === 0) {
    return { callable: true, inputType: emptyInputNode(), renderType: signature.returnType };
  }
  if (params.length !== 1) return undefined;
  const input = componentInputNode(params[0]!.type);
  if (input.kind !== "object" && !api.schemaOrigin(input)) return undefined;
  return { callable: true, inputType: input, renderType: signature.returnType };
}

function componentInputNode(node: TypeNode): TypeNode {
  return node.kind === "tuple" && node.elements.length === 1 ? node.elements[0]! : node;
}

function preferExportedInputType(
  inputType: TypeNode,
  exports: readonly ExportedTypeInfo[],
): TypeNode {
  const exported = exports.find((entry) => entry.name === inputType.text);
  return exported?.type.kind === "object" ? exported.type : inputType;
}

function callableSignatures(type: CallableComponentTypeNode): readonly FunctionSignature[] {
  if (type.kind === "function") return [{ parameters: type.parameters, returnType: type.returnType }];
  if (type.kind === "constructor") return [{ parameters: type.parameters, returnType: type.returnType }];
  return type.signatures;
}

function distinctComponentSignatures(
  signatures: readonly ComponentSignature[],
): readonly ComponentSignature[] {
  const seen = new Set<string>();
  const distinct: ComponentSignature[] = [];

  for (const signature of signatures) {
    const key = `${signature.inputType.text}->${signature.renderType.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    distinct.push(signature);
  }

  return distinct;
}

function emptyInputNode(): TypeNode {
  return { kind: "object", text: "{}", properties: [] };
}

function emitComponentModule(
  target: Extract<ResolvedComponentTarget, { readonly ok: true }>,
  importer: string,
  signature: ComponentSignature,
  inputType: TypeNode,
  api: TypeInfoApi,
  pluginName: string,
  context?: VirtualModuleBuildContext,
): string | VirtualModuleBuildError {
  if (context && context.requestedExports.kind === "names") {
    return emitPrunedComponentModule(target, importer, signature, inputType, api, pluginName, context);
  }
  return emitFullComponentModule(target, importer, signature, inputType, api, pluginName);
}

function emitFullComponentModule(
  target: Extract<ResolvedComponentTarget, { readonly ok: true }>,
  importer: string,
  signature: ComponentSignature,
  inputType: TypeNode,
  api: TypeInfoApi,
  pluginName: string,
): string | VirtualModuleBuildError {
  const source = new ModuleSource();
  const targetSpecifier = toImportSpecifier(dirname(toPosixPath(importer)), target.targetPath);
  source.importLine('import * as Schema from "effect/Schema";');
  source.importLine('import type { LayerOrGroup } from "@typed/app/runtime";');
  source.importLine('import { defineTypedStoryRuntime } from "@typed/storybook";');
  source.importLine('import type { Renderable } from "@typed/template";');
  source.importNamespace("ComponentModule", targetSpecifier);
  const schemaPlan = inputSchemaPlan(inputType, api, source, dirname(toPosixPath(importer)));
  if (!schemaPlan.ok) return buildError("CVM-COMPONENT-SCHEMA-001", schemaPlan.message, pluginName);
  source.add(`export const entrypoint = ${entrypointExpression(target.exportName)};`);
  source.add(`export type Input = ${inputTypeExpression(target.exportName, signature)};`);
  source.add(`export const InputSchema = ${schemaPlan.expression};`);
  source.add("export const InputArbitrary = Schema.toArbitrary(InputSchema);");
  source.add("export const InputArbitraryLazy = Schema.toArbitraryLazy(InputSchema);");
  source.add("export const InputEquivalence = Schema.toEquivalence(InputSchema);");
  source.add("export const InputFormatter = Schema.toFormatter(InputSchema);");
  source.add("export const InputRepresentation = Schema.toRepresentation(InputSchema);");
  source.add("export const InputJsonSchema = Schema.toJsonSchemaDocument(InputSchema);");
  source.add("export type InputStandardSchema = ReturnType<typeof Schema.toStandardSchemaV1<typeof InputSchema>>;");
  source.add("export const InputStandardSchema: InputStandardSchema = Schema.toStandardSchemaV1(InputSchema);");
  source.add("export type InputStandardJsonSchema = ReturnType<typeof Schema.toStandardJSONSchemaV1<typeof InputSchema>>;");
  source.add("export const InputStandardJsonSchema: InputStandardJsonSchema = Schema.toStandardJSONSchemaV1(InputSchema);");
  source.add(`export const argTypes = ${argTypesExpression(inputType)} as const;`);
  source.add(`export const Component = ${componentExpression(target.exportName, signature)};`);
  source.add("export const render = Component;");
  source.add("type ComponentErrorOf<Result> = Renderable.Error<Result>;");
  source.add("type ComponentServicesOf<Result> = Renderable.Services<Result>;");
  source.add("export type ComponentResult = ReturnType<typeof Component>;");
  source.add("export type ComponentError = ComponentErrorOf<ComponentResult>;");
  source.add("export type ComponentServices = ComponentServicesOf<ComponentResult>;");
  source.add("const decodeInput = Schema.decodeUnknownSync(InputSchema);");
  source.add(`type Layers = readonly LayerOrGroup[];
type TestLayers = readonly LayerOrGroup[];

interface ComponentStoryOptions {
  readonly input: Input;
  readonly layers?: Layers;
  readonly testLayers?: TestLayers;
}

interface ComponentPropertyOptions {
  readonly assert?: (input: Input, result: ComponentResult) => void | Promise<void>;
}

export function makeComponentStory<const Options extends ComponentStoryOptions>(options: Options) {
  return {
    args: options.input,
    argTypes,
    parameters: makeComponentParameters(options),
    render: (args: unknown) => Component(decodeInput(args)),
  };
}

export function makeComponentProperty(options: ComponentPropertyOptions = {}) {
  return async (input: Input) => {
    const decoded = decodeInput(input);
    const result = Component(decoded);
    await options.assert?.(decoded, result);
  };
}

function makeComponentParameters<const Options extends Pick<ComponentStoryOptions, "layers" | "testLayers">>(
  options: Options,
) {
  return {
    typed: defineTypedStoryRuntime({
      layers: options.layers,
      testLayers: options.testLayers,
    }),
  };
}`);
  return source.emit();
}

interface ComponentEmitPlan {
  readonly entrypoint: boolean;
  readonly input: boolean;
  readonly inputSchema: boolean;
  readonly inputArbitrary: boolean;
  readonly inputArbitraryLazy: boolean;
  readonly inputEquivalence: boolean;
  readonly inputFormatter: boolean;
  readonly inputRepresentation: boolean;
  readonly inputJsonSchema: boolean;
  readonly inputStandardSchema: boolean;
  readonly inputStandardJsonSchema: boolean;
  readonly argTypes: boolean;
  readonly component: boolean;
  readonly render: boolean;
  readonly componentResult: boolean;
  readonly componentError: boolean;
  readonly componentServices: boolean;
  readonly makeComponentStory: boolean;
  readonly makeComponentProperty: boolean;
}

function emitPrunedComponentModule(
  target: Extract<ResolvedComponentTarget, { readonly ok: true }>,
  importer: string,
  signature: ComponentSignature,
  inputType: TypeNode,
  api: TypeInfoApi,
  pluginName: string,
  context: VirtualModuleBuildContext,
): string | VirtualModuleBuildError {
  const plan = componentEmitPlan(context);
  const deps = componentPlanDependencies(plan);
  const source = new ModuleSource();
  const componentDir = dirname(toPosixPath(importer));
  const targetSpecifier = toImportSpecifier(componentDir, target.targetPath);
  addPrunedComponentImports(source, deps, targetSpecifier);
  const schemaPlan = deps.inputSchema ? inputSchemaPlan(inputType, api, source, componentDir) : undefined;
  if (schemaPlan && !schemaPlan.ok) {
    return buildError("CVM-COMPONENT-SCHEMA-001", schemaPlan.message, pluginName);
  }
  addPrunedComponentBindings(source, target.exportName, signature, inputType, plan, deps, schemaPlan);
  return source.emit() || "export {};";
}

function componentEmitPlan(context: VirtualModuleBuildContext): ComponentEmitPlan {
  return {
    entrypoint: requestsComponentExport(context, "entrypoint"),
    input: requestsComponentExport(context, "Input"),
    inputSchema: requestsComponentExport(context, "InputSchema"),
    inputArbitrary: requestsComponentExport(context, "InputArbitrary"),
    inputArbitraryLazy: requestsComponentExport(context, "InputArbitraryLazy"),
    inputEquivalence: requestsComponentExport(context, "InputEquivalence"),
    inputFormatter: requestsComponentExport(context, "InputFormatter"),
    inputRepresentation: requestsComponentExport(context, "InputRepresentation"),
    inputJsonSchema: requestsComponentExport(context, "InputJsonSchema"),
    inputStandardSchema: requestsComponentExport(context, "InputStandardSchema"),
    inputStandardJsonSchema: requestsComponentExport(context, "InputStandardJsonSchema"),
    argTypes: requestsComponentExport(context, "argTypes"),
    component: requestsComponentExport(context, "Component"),
    render: requestsComponentExport(context, "render"),
    componentResult: requestsComponentExport(context, "ComponentResult"),
    componentError: requestsComponentExport(context, "ComponentError"),
    componentServices: requestsComponentExport(context, "ComponentServices"),
    makeComponentStory: requestsComponentExport(context, "makeComponentStory"),
    makeComponentProperty: requestsComponentExport(context, "makeComponentProperty"),
  };
}

function requestsComponentExport(
  context: VirtualModuleBuildContext,
  name: (typeof COMPONENT_EXPORTS)[number],
): boolean {
  if (context.requestedExports.kind === "all") return true;
  return context.requestedExports.names.has(name) || context.requestedExports.typeOnlyNames.has(name);
}

interface ComponentPlanDependencies {
  readonly entrypoint: boolean;
  readonly input: boolean;
  readonly inputSchema: boolean;
  readonly argTypes: boolean;
  readonly component: boolean;
  readonly componentResult: boolean;
  readonly componentStoryRuntime: boolean;
  readonly decodeInput: boolean;
  readonly renderableTypes: boolean;
}

function componentPlanDependencies(plan: ComponentEmitPlan): ComponentPlanDependencies {
  const component =
    plan.component ||
    plan.render ||
    plan.componentResult ||
    plan.componentError ||
    plan.componentServices ||
    plan.makeComponentStory ||
    plan.makeComponentProperty;
  const input =
    plan.input ||
    component ||
    plan.makeComponentStory ||
    plan.makeComponentProperty;
  const inputSchema =
    plan.inputSchema ||
    plan.inputArbitrary ||
    plan.inputArbitraryLazy ||
    plan.inputEquivalence ||
    plan.inputFormatter ||
    plan.inputRepresentation ||
    plan.inputJsonSchema ||
    plan.inputStandardSchema ||
    plan.inputStandardJsonSchema ||
    plan.makeComponentStory ||
    plan.makeComponentProperty;
  return {
    entrypoint: plan.entrypoint || input || component,
    input,
    inputSchema,
    argTypes: plan.argTypes || plan.makeComponentStory,
    component,
    componentResult:
      plan.componentResult || plan.componentError || plan.componentServices || plan.makeComponentProperty,
    componentStoryRuntime: plan.makeComponentStory,
    decodeInput: plan.makeComponentStory || plan.makeComponentProperty,
    renderableTypes: plan.componentError || plan.componentServices,
  };
}

function addPrunedComponentImports(
  source: ModuleSource,
  deps: ComponentPlanDependencies,
  targetSpecifier: string,
): void {
  if (deps.inputSchema || deps.decodeInput) source.importLine('import * as Schema from "effect/Schema";');
  if (deps.componentStoryRuntime) {
    source.importLine('import type { LayerOrGroup } from "@typed/app/runtime";');
    source.importLine('import { defineTypedStoryRuntime } from "@typed/storybook";');
  }
  if (deps.renderableTypes) source.importLine('import type { Renderable } from "@typed/template";');
  if (deps.entrypoint || deps.component) source.importNamespace("ComponentModule", targetSpecifier);
}

function addPrunedComponentBindings(
  source: ModuleSource,
  exportName: string,
  signature: ComponentSignature,
  inputType: TypeNode,
  plan: ComponentEmitPlan,
  deps: ComponentPlanDependencies,
  schemaPlan: Extract<SchemaPlan, { readonly ok: true }> | undefined,
): void {
  if (deps.entrypoint) addBinding(source, plan.entrypoint, `const entrypoint = ${entrypointExpression(exportName)};`);
  if (deps.input) addBinding(source, plan.input, `type Input = ${inputTypeExpression(exportName, signature)};`);
  if (schemaPlan) addInputSchemaBindings(source, plan, schemaPlan.expression);
  if (deps.argTypes) addBinding(source, plan.argTypes, `const argTypes = ${argTypesExpression(inputType)} as const;`);
  if (deps.component) addBinding(source, plan.component, `const Component = ${componentExpression(exportName, signature)};`);
  if (plan.render) source.add("export const render = Component;");
  if (deps.renderableTypes) addRenderableTypeHelpers(source);
  if (deps.componentResult) addBinding(source, plan.componentResult, "type ComponentResult = ReturnType<typeof Component>;");
  if (plan.componentError) source.add("export type ComponentError = ComponentErrorOf<ComponentResult>;");
  if (plan.componentServices) source.add("export type ComponentServices = ComponentServicesOf<ComponentResult>;");
  if (deps.decodeInput) source.add("const decodeInput = Schema.decodeUnknownSync(InputSchema);");
  if (plan.makeComponentStory) source.add(componentStorySource());
  if (plan.makeComponentProperty) source.add(componentPropertySource());
}

function addBinding(source: ModuleSource, exported: boolean, declaration: string): void {
  source.add(exported ? `export ${declaration}` : declaration);
}

function addInputSchemaBindings(source: ModuleSource, plan: ComponentEmitPlan, expression: string): void {
  addBinding(source, plan.inputSchema, `const InputSchema = ${expression};`);
  if (plan.inputArbitrary) source.add("export const InputArbitrary = Schema.toArbitrary(InputSchema);");
  if (plan.inputArbitraryLazy) source.add("export const InputArbitraryLazy = Schema.toArbitraryLazy(InputSchema);");
  if (plan.inputEquivalence) source.add("export const InputEquivalence = Schema.toEquivalence(InputSchema);");
  if (plan.inputFormatter) source.add("export const InputFormatter = Schema.toFormatter(InputSchema);");
  if (plan.inputRepresentation) source.add("export const InputRepresentation = Schema.toRepresentation(InputSchema);");
  if (plan.inputJsonSchema) source.add("export const InputJsonSchema = Schema.toJsonSchemaDocument(InputSchema);");
  if (plan.inputStandardSchema) {
    source.add("export type InputStandardSchema = ReturnType<typeof Schema.toStandardSchemaV1<typeof InputSchema>>;");
    source.add("export const InputStandardSchema: InputStandardSchema = Schema.toStandardSchemaV1(InputSchema);");
  }
  if (plan.inputStandardJsonSchema) {
    source.add("export type InputStandardJsonSchema = ReturnType<typeof Schema.toStandardJSONSchemaV1<typeof InputSchema>>;");
    source.add("export const InputStandardJsonSchema: InputStandardJsonSchema = Schema.toStandardJSONSchemaV1(InputSchema);");
  }
}

function addRenderableTypeHelpers(source: ModuleSource): void {
  source.add("type ComponentErrorOf<Result> = Renderable.Error<Result>;");
  source.add("type ComponentServicesOf<Result> = Renderable.Services<Result>;");
}

function componentStorySource(): string {
  return `type Layers = readonly LayerOrGroup[];
type TestLayers = readonly LayerOrGroup[];

interface ComponentStoryOptions {
  readonly input: Input;
  readonly layers?: Layers;
  readonly testLayers?: TestLayers;
}

export function makeComponentStory<const Options extends ComponentStoryOptions>(options: Options) {
  return {
    args: options.input,
    argTypes,
    parameters: makeComponentParameters(options),
    render: (args: unknown) => Component(decodeInput(args)),
  };
}

function makeComponentParameters<const Options extends Pick<ComponentStoryOptions, "layers" | "testLayers">>(
  options: Options,
) {
  return {
    typed: defineTypedStoryRuntime({
      layers: options.layers,
      testLayers: options.testLayers,
    }),
  };
}`;
}

function componentPropertySource(): string {
  return `interface ComponentPropertyOptions {
  readonly assert?: (input: Input, result: ComponentResult) => void | Promise<void>;
}

export function makeComponentProperty(options: ComponentPropertyOptions = {}) {
  return async (input: Input) => {
    const decoded = decodeInput(input);
    const result = Component(decoded);
    await options.assert?.(decoded, result);
  };
}`;
}

function inputTypeExpression(_exportName: string, signature: ComponentSignature): string {
  if (!signature.callable) return "{}";
  return "Parameters<typeof entrypoint>[0]";
}

function entrypointExpression(exportName: string): string {
  return exportName === "default"
    ? "ComponentModule.default"
    : `ComponentModule${propertyAccessExpression(exportName)}`;
}

function componentExpression(exportName: string, signature: ComponentSignature): string {
  const entrypoint = entrypointExpression(exportName);
  return signature.callable
    ? `(input: Input) => ${entrypoint}(input)`
    : `(_input: Input) => ${entrypoint}`;
}

type SchemaPlan =
  | { readonly ok: true; readonly expression: string }
  | { readonly ok: false; readonly message: string };

function inputSchemaPlan(
  inputType: TypeNode,
  api: TypeInfoApi,
  source: ModuleSource,
  componentDir: string,
): SchemaPlan {
  const fullOrigin = api.schemaOrigin(inputType);
  if (fullOrigin) {
    return { ok: true, expression: schemaOriginExpression(fullOrigin, source, componentDir) };
  }
  if (inputType.kind !== "object") return { ok: true, expression: "Schema.Struct({})" };
  if (inputType.indexSignature) {
    return unsupportedInputSchema(inputType, "component input");
  }
  const fields: string[] = [];
  for (const property of inputType.properties) {
    const plan = schemaExpression(property, api, source, componentDir);
    if (!plan.ok) return plan;
    fields.push(`${JSON.stringify(property.name)}: ${plan.expression}`);
  }
  const expression = fields.length === 0 ? "Schema.Struct({})" : `Schema.Struct({\n  ${fields.join(",\n  ")}\n})`;
  return { ok: true, expression };
}

function schemaExpression(
  property: ObjectProperty,
  api: TypeInfoApi,
  source: ModuleSource,
  componentDir: string,
): SchemaPlan {
  const plan = schemaExpressionFromType(
    property.optional ? withoutUndefined(property.type) : property.type,
    api,
    source,
    componentDir,
  );
  if (!plan.ok) return unsupportedInputSchema(property.type, property.name);
  const expression = property.optional ? `Schema.optional(${plan.expression})` : plan.expression;
  return { ok: true, expression };
}

function schemaOriginExpression(
  origin: NonNullable<ReturnType<TypeInfoApi["schemaOrigin"]>>,
  source: ModuleSource,
  componentDir: string,
): string {
  const alias = `${pathToIdentifier(origin.exportName)}Schema`;
  const specifier = toImportSpecifier(componentDir, origin.filePath);
  source.importNamed(`${origin.exportName} as ${alias}`, specifier);
  return alias;
}

function schemaExpressionFromType(
  type: TypeNode,
  api: TypeInfoApi,
  source: ModuleSource,
  componentDir: string,
): SchemaPlan {
  const origin = api.schemaOrigin(type);
  if (origin) {
    return { ok: true, expression: schemaOriginExpression(origin, source, componentDir) };
  }

  if (type.kind === "primitive") return primitiveSchema(type);
  if (type.kind === "literal") return { ok: true, expression: `Schema.Literal(${type.text})` };
  if (type.kind === "array") {
    const element = type.elements[0];
    if (!element) return unsupportedInputSchema(type, "array element");
    const plan = schemaExpressionFromType(element, api, source, componentDir);
    return plan.ok ? { ok: true, expression: `Schema.Array(${plan.expression})` } : plan;
  }
  if (type.kind === "tuple") {
    const elements: string[] = [];
    for (const element of type.elements) {
      const plan = schemaExpressionFromType(element, api, source, componentDir);
      if (!plan.ok) return plan;
      elements.push(plan.expression);
    }
    return { ok: true, expression: `Schema.Tuple(${elements.join(", ")})` };
  }
  if (type.kind === "union") {
    const normalized = simplifyUnion(type.elements);
    if (normalized.length === 1) {
      return schemaExpressionFromType(normalized[0]!, api, source, componentDir);
    }
    if (isBooleanLiteralUnion(normalized)) {
      return { ok: true, expression: "Schema.Boolean" };
    }
    const elements: string[] = [];
    for (const element of normalized) {
      const plan = schemaExpressionFromType(element, api, source, componentDir);
      if (!plan.ok) return plan;
      elements.push(plan.expression);
    }
    return { ok: true, expression: `Schema.Union([${elements.join(", ")}])` };
  }
  if (type.kind === "object") {
    if (type.indexSignature) return unsupportedInputSchema(type, "index signature");
    const fields: string[] = [];
    for (const property of type.properties) {
      const plan = schemaExpression(property, api, source, componentDir);
      if (!plan.ok) return plan;
      fields.push(`${JSON.stringify(property.name)}: ${plan.expression}`);
    }
    const expression = fields.length === 0 ? "Schema.Struct({})" : `Schema.Struct({ ${fields.join(", ")} })`;
    return { ok: true, expression };
  }
  return unsupportedInputSchema(type, "type");
}

function primitiveSchema(type: Extract<TypeNode, { readonly kind: "primitive" }>): SchemaPlan {
  if (type.text === "string" || type.text === "String") return { ok: true, expression: "Schema.String" };
  if (type.text === "number" || type.text === "Number") return { ok: true, expression: "Schema.Number" };
  if (type.text === "boolean" || type.text === "Boolean") return { ok: true, expression: "Schema.Boolean" };
  if (type.text === "bigint" || type.text === "BigInt") return { ok: true, expression: "Schema.BigInt" };
  if (type.text === "null") return { ok: true, expression: "Schema.Null" };
  if (type.text === "undefined" || type.text === "void") return { ok: true, expression: "Schema.Undefined" };
  return unsupportedInputSchema(type, "primitive");
}

function unsupportedInputSchema(type: TypeNode, field: string): SchemaPlan {
  return {
    ok: false,
    message: `Could not generate an input schema for ${JSON.stringify(field)} from type ${type.text}`,
  };
}

function withoutUndefined(type: TypeNode): TypeNode {
  if (type.kind !== "union") return type;
  const elements = type.elements.filter((element) => !typeNodeIsUndefined(element));
  if (elements.length === 1) return elements[0]!;
  return { ...type, elements };
}

function simplifyUnion(elements: readonly TypeNode[]): readonly TypeNode[] {
  const seen = new Set<string>();
  const normalized: TypeNode[] = [];
  for (const element of elements) {
    const key = `${element.kind}:${element.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(element);
  }
  return normalized;
}

function isBooleanLiteralUnion(elements: readonly TypeNode[]): boolean {
  if (elements.length !== 2) return false;
  const values = new Set(elements.map((element) => element.kind === "literal" ? element.text : ""));
  return values.has("true") && values.has("false");
}

function typeNodeIsUndefined(type: TypeNode): boolean {
  return type.kind === "primitive" && (type.text === "undefined" || type.text === "void");
}

function argTypesExpression(inputType: TypeNode): string {
  if (inputType.kind !== "object") return "{}";
  const controls = inputType.properties.flatMap((property) => {
    const control = controlExpression(property.optional ? withoutUndefined(property.type) : property.type);
    return control ? [`${JSON.stringify(property.name)}: ${control}`] : [];
  });
  return controls.length === 0 ? "{}" : `{\n  ${controls.join(",\n  ")}\n}`;
}

function controlExpression(type: TypeNode): string | undefined {
  if (type.kind === "primitive") return primitiveControl(type.text);
  if (type.kind === "union") return unionControl(type.elements);
  return undefined;
}

function primitiveControl(text: string): string | undefined {
  if (text === "string" || text === "String") return '{ control: { type: "text" } }';
  if (text === "number" || text === "Number") return '{ control: { type: "number" } }';
  if (text === "boolean" || text === "Boolean") return '{ control: { type: "boolean" } }';
  return undefined;
}

function unionControl(elements: readonly TypeNode[]): string | undefined {
  const normalized = simplifyUnion(elements.filter((element) => !typeNodeIsUndefined(element)));
  if (isBooleanLiteralUnion(normalized)) return '{ control: { type: "boolean" } }';
  if (!normalized.every((element) => element.kind === "literal")) return undefined;
  const options = normalized.map((element) => element.text);
  if (!options.every((text) => literalCanBeStorybookOption(text))) return undefined;
  return `{ control: { type: "select" }, options: [${options.join(", ")}] }`;
}

function literalCanBeStorybookOption(text: string): boolean {
  return text.startsWith('"') || text.startsWith("'") || /^-?\d+(?:\.\d+)?$/.test(text);
}

function propertyAccessExpression(property: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(property) ? `.${property}` : `[${JSON.stringify(property)}]`;
}

function toImportSpecifier(fromDir: string, absolutePath: string): string {
  const relativePath = toPosixPath(relative(fromDir, absolutePath));
  const specifier = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  return specifier.replace(/\.(tsx?|mts|cts|jsx?|mjs|cjs)$/, ".js");
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
