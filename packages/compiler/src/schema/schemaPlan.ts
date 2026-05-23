import type {
  IndexSignatureInfo,
  ObjectProperty,
  TypeNode,
} from "@typed/virtual-modules";
import {
  createCompilerDiagnostic,
  sortDiagnostics,
  type SourceSpan,
  type TypedCompilerDiagnostic,
} from "../diagnostics/diagnostics.js";

export type SchemaGenerationPlan = {
  readonly version: 1;
  readonly typeId: string;
  readonly root: SchemaPlanNode;
  readonly fingerprint: string;
};

export type SchemaPlanNode =
  | SchemaPrimitivePlan
  | SchemaLiteralPlan
  | SchemaObjectPlan
  | SchemaArrayPlan
  | SchemaTuplePlan
  | SchemaUnionPlan;

export type SchemaPrimitivePlan = {
  readonly kind: "primitive";
  readonly name: SupportedPrimitive;
};

export type SchemaLiteralPlan = {
  readonly kind: "literal";
  readonly value: string | number | boolean | null;
  readonly text: string;
};

export type SchemaObjectPlan = {
  readonly kind: "object";
  readonly properties: readonly SchemaObjectPropertyPlan[];
  readonly indexSignature?: SchemaIndexSignaturePlan;
};

export type SchemaObjectPropertyPlan = {
  readonly name: string;
  readonly optional: boolean;
  readonly readonly: boolean;
  readonly node: SchemaPlanNode;
};

export type SchemaIndexSignaturePlan = {
  readonly key: "string" | "number";
  readonly readonly: boolean;
  readonly value: SchemaPlanNode;
};

export type SchemaArrayPlan = {
  readonly kind: "array";
  readonly element: SchemaPlanNode;
};

export type SchemaTuplePlan = {
  readonly kind: "tuple";
  readonly elements: readonly SchemaPlanNode[];
};

export type SchemaUnionPlan = {
  readonly kind: "union";
  readonly elements: readonly SchemaPlanNode[];
};

export type SchemaPlanResult =
  | {
      readonly ok: true;
      readonly plan: SchemaGenerationPlan;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly TypedCompilerDiagnostic[];
    };

export type PlanSchemaFromTypeNodeInput = {
  readonly typeId: string;
  readonly node: TypeNode;
  readonly fileName?: string;
  readonly span?: SourceSpan;
};

type SupportedPrimitive = "string" | "number" | "boolean" | "bigint" | "null" | "undefined";

type NodePlanResult =
  | {
      readonly ok: true;
      readonly node: SchemaPlanNode;
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly TypedCompilerDiagnostic[];
    };

const supportedPrimitives = new Set<string>([
  "bigint",
  "boolean",
  "null",
  "number",
  "string",
  "undefined",
]);

export function planSchemaFromTypeNode(input: PlanSchemaFromTypeNodeInput): SchemaPlanResult {
  const planned = planNode(input.node, input.typeId, input);
  if (!planned.ok) {
    return { ok: false, diagnostics: sortDiagnostics(planned.diagnostics) };
  }

  const planWithoutFingerprint = {
    version: 1,
    typeId: input.typeId,
    root: planned.node,
  } satisfies Omit<SchemaGenerationPlan, "fingerprint">;

  return {
    ok: true,
    plan: {
      ...planWithoutFingerprint,
      fingerprint: schemaPlanFingerprint(planWithoutFingerprint),
    },
  };
}

export function schemaPlanFingerprint(
  plan: Omit<SchemaGenerationPlan, "fingerprint"> | SchemaGenerationPlan,
): string {
  return stableStringify({
    root: plan.root,
    typeId: plan.typeId,
    version: plan.version,
  });
}

export function emitSerializableDescriptorSource(
  plan: SchemaGenerationPlan,
  exportName = "serializable",
): string {
  assertIdentifier(exportName);
  return [
    'import { Serializable } from "@typed/app";',
    "",
    `export const ${exportName} = Serializable.generated(`,
    `  ${JSON.stringify(plan.typeId)},`,
    "  {",
    "    version: 1,",
    `    typeId: ${JSON.stringify(plan.typeId)},`,
    `    fingerprint: ${JSON.stringify(plan.fingerprint)},`,
    "  },",
    ");",
  ].join("\n");
}

function planNode(
  node: TypeNode,
  path: string,
  input: PlanSchemaFromTypeNodeInput,
): NodePlanResult {
  if (node.kind === "primitive") return planPrimitive(node, path, input);
  if (node.kind === "literal") return { ok: true, node: planLiteral(node.text) };
  if (node.kind === "object") return planObject(node.properties, node.indexSignature, path, input);
  if (node.kind === "array") return planArray(node.elements, path, input);
  if (node.kind === "tuple") return planTuple(node.elements, path, input);
  if (node.kind === "union") return planUnion(node.elements, path, input);
  return unsupported(node, path, input);
}

function planPrimitive(
  node: Extract<TypeNode, { kind: "primitive" }>,
  path: string,
  input: PlanSchemaFromTypeNodeInput,
): NodePlanResult {
  if (supportedPrimitives.has(node.text)) {
    return { ok: true, node: { kind: "primitive", name: node.text as SupportedPrimitive } };
  }

  return unsupported(node, path, input);
}

function planLiteral(text: string): SchemaLiteralPlan {
  return {
    kind: "literal",
    text,
    value: parseLiteralText(text),
  };
}

function planArray(
  elements: readonly TypeNode[],
  path: string,
  input: PlanSchemaFromTypeNodeInput,
): NodePlanResult {
  const element = elements[0];
  if (!element) return unsupported({ kind: "unknown", text: "unknown" }, `${path}[]`, input);
  const planned = planNode(element, `${path}[]`, input);
  return planned.ok ? { ok: true, node: { kind: "array", element: planned.node } } : planned;
}

function planTuple(
  elements: readonly TypeNode[],
  path: string,
  input: PlanSchemaFromTypeNodeInput,
): NodePlanResult {
  return collectIndexed(elements, path, input, (nodes) => ({ kind: "tuple", elements: nodes }));
}

function planUnion(
  elements: readonly TypeNode[],
  path: string,
  input: PlanSchemaFromTypeNodeInput,
): NodePlanResult {
  return collectIndexed(elements, path, input, (nodes) => ({
    kind: "union",
    elements: nodes.toSorted(comparePlanNodes),
  }));
}

function planObject(
  properties: readonly ObjectProperty[],
  indexSignature: IndexSignatureInfo | undefined,
  path: string,
  input: PlanSchemaFromTypeNodeInput,
): NodePlanResult {
  const plannedProperties = planProperties(properties, path, input);
  const plannedIndex = indexSignature ? planIndexSignature(indexSignature, path, input) : undefined;
  const diagnostics = collectDiagnostics([plannedProperties, plannedIndex]);
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  return {
    ok: true,
    node: {
      kind: "object",
      properties: plannedProperties.ok ? plannedProperties.properties : [],
      ...(plannedIndex?.ok && { indexSignature: plannedIndex.indexSignature }),
    },
  };
}

function planProperties(
  properties: readonly ObjectProperty[],
  path: string,
  input: PlanSchemaFromTypeNodeInput,
):
  | { readonly ok: true; readonly properties: readonly SchemaObjectPropertyPlan[] }
  | { readonly ok: false; readonly diagnostics: readonly TypedCompilerDiagnostic[] } {
  const planned = properties.toSorted(compareProperties).map((property) =>
    planProperty(property, path, input),
  );
  const diagnostics = collectDiagnostics(planned);
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return { ok: true, properties: planned.filter(isOk).map((result) => result.property) };
}

function planProperty(
  property: ObjectProperty,
  path: string,
  input: PlanSchemaFromTypeNodeInput,
):
  | { readonly ok: true; readonly property: SchemaObjectPropertyPlan }
  | { readonly ok: false; readonly diagnostics: readonly TypedCompilerDiagnostic[] } {
  const planned = planNode(property.type, `${path}.${property.name}`, input);
  if (!planned.ok) return planned;
  return {
    ok: true,
    property: {
      name: property.name,
      node: planned.node,
      optional: property.optional,
      readonly: property.readonly,
    },
  };
}

function planIndexSignature(
  indexSignature: IndexSignatureInfo,
  path: string,
  input: PlanSchemaFromTypeNodeInput,
):
  | { readonly ok: true; readonly indexSignature: SchemaIndexSignaturePlan }
  | { readonly ok: false; readonly diagnostics: readonly TypedCompilerDiagnostic[] } {
  const key = indexSignatureKey(indexSignature.keyType);
  const value = planNode(indexSignature.valueType, `${path}[index]`, input);
  if (!value.ok) return value;
  if (!key) return unsupported(indexSignature.keyType, `${path}[key]`, input);

  return {
    ok: true,
    indexSignature: {
      key,
      readonly: indexSignature.readonly,
      value: value.node,
    },
  };
}

function collectIndexed(
  elements: readonly TypeNode[],
  path: string,
  input: PlanSchemaFromTypeNodeInput,
  createNode: (nodes: readonly SchemaPlanNode[]) => SchemaPlanNode,
): NodePlanResult {
  const planned = elements.map((element, index) => planNode(element, `${path}[${index}]`, input));
  const diagnostics = collectDiagnostics(planned);
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return { ok: true, node: createNode(planned.filter(isOk).map((result) => result.node)) };
}

function unsupported(
  node: TypeNode,
  path: string,
  input: PlanSchemaFromTypeNodeInput,
): Extract<NodePlanResult, { readonly ok: false }> {
  return {
    ok: false,
    diagnostics: [
      createCompilerDiagnostic({
        code: "TYPED-SERIALIZATION-001",
        fileName: input.fileName,
        message: `Cannot generate Schema for ${path}: ${unsupportedReason(node)}`,
        severity: "error",
        source: "compiler",
        span: input.span,
      }),
    ],
  };
}

function unsupportedReason(node: TypeNode): string {
  if (node.kind === "function") return "function types are not serializable";
  if (node.kind === "constructor") return "constructor types are not serializable";
  if (node.kind === "any") return "`any` is not safe to serialize";
  if (node.kind === "unknown") return "`unknown` needs an explicit Schema";
  if (node.kind === "never") return "`never` cannot be materialized as a runtime Schema";
  return `${node.kind} types need explicit Schema support before serialization`;
}

function parseLiteralText(text: string): string | number | boolean | null {
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null") return null;
  if (isQuoted(text)) return text.slice(1, -1);
  const numberValue = Number(text);
  return Number.isNaN(numberValue) ? text : numberValue;
}

function indexSignatureKey(node: TypeNode): "string" | "number" | undefined {
  if (node.kind !== "primitive") return undefined;
  if (node.text === "string" || node.text === "number") return node.text;
  return undefined;
}

function collectDiagnostics(
  results: readonly ({ readonly ok: true } | { readonly ok: false; readonly diagnostics: readonly TypedCompilerDiagnostic[] } | undefined)[],
): readonly TypedCompilerDiagnostic[] {
  return results.flatMap((result) => (result?.ok === false ? result.diagnostics : []));
}

function compareProperties(left: ObjectProperty, right: ObjectProperty): number {
  return left.name.localeCompare(right.name);
}

function comparePlanNodes(left: SchemaPlanNode, right: SchemaPlanNode): number {
  return stableStringify(left).localeCompare(stableStringify(right));
}

function isOk<T extends { readonly ok: boolean }>(
  result: T,
): result is Extract<T, { readonly ok: true }> {
  return result.ok;
}

function isQuoted(text: string): boolean {
  return (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  );
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(",")}}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertIdentifier(name: string): void {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
    throw new Error(`Invalid serializable descriptor export name: ${name}`);
  }
}
