export const TemplatePlanTypeId = Symbol.for("@typed/compiler/TemplatePlan");

export interface TemplatePlan {
  readonly kind: "TemplatePlan";
  readonly version: 1;
  readonly templateHash: string;
  readonly nodes: readonly TemplatePlanNode[];
  readonly parts: readonly TemplatePlanPart[];
}

export type TemplatePlanNode =
  | TemplatePlanElementNode
  | TemplatePlanSelfClosingElementNode
  | TemplatePlanTextOnlyElementNode
  | TemplatePlanTextNode
  | TemplatePlanSparseTextNode
  | TemplatePlanPartNode
  | TemplatePlanCommentNode
  | TemplatePlanSparseCommentNode
  | TemplatePlanDocTypeNode;

export interface TemplatePlanElementNode {
  readonly kind: "element";
  readonly tagName: string;
  readonly attributes: readonly TemplatePlanAttribute[];
  readonly children: readonly TemplatePlanNode[];
}

export interface TemplatePlanSelfClosingElementNode {
  readonly kind: "selfClosingElement";
  readonly tagName: string;
  readonly attributes: readonly TemplatePlanAttribute[];
}

export interface TemplatePlanTextOnlyElementNode {
  readonly kind: "textOnlyElement";
  readonly tagName: string;
  readonly attributes: readonly TemplatePlanAttribute[];
  readonly textContent: TemplatePlanTextContent | null;
}

export interface TemplatePlanTextNode {
  readonly kind: "text";
  readonly value: string;
}

export interface TemplatePlanSparseTextNode {
  readonly kind: "sparseText";
  readonly nodes: readonly TemplatePlanSparsePart[];
}

export type TemplatePlanTextContent =
  | TemplatePlanTextNode
  | TemplatePlanSparseTextNode
  | TemplatePlanPartNode;

export interface TemplatePlanPartNode {
  readonly kind: "part";
  readonly valueIndex: number;
}

export interface TemplatePlanCommentNode {
  readonly kind: "comment";
  readonly value: string;
}

export interface TemplatePlanSparseCommentNode {
  readonly kind: "sparseComment";
  readonly nodes: readonly TemplatePlanSparsePart[];
}

export interface TemplatePlanDocTypeNode {
  readonly kind: "doctype";
  readonly name: string;
  readonly publicId?: string;
  readonly systemId?: string;
}

export type TemplatePlanAttribute =
  | TemplatePlanStaticAttribute
  | TemplatePlanDynamicAttribute
  | TemplatePlanSparseAttribute
  | TemplatePlanEventAttribute
  | TemplatePlanRefAttribute
  | TemplatePlanPropertiesAttribute;

export interface TemplatePlanStaticAttribute {
  readonly kind: "attribute";
  readonly name: string;
  readonly value: string;
}

export interface TemplatePlanDynamicAttribute {
  readonly kind: "dynamicAttribute" | "boolean" | "className" | "data" | "property";
  readonly name: string;
  readonly valueIndex: number;
}

export interface TemplatePlanSparseAttribute {
  readonly kind: "sparseAttribute" | "sparseClassName";
  readonly name: string;
  readonly nodes: readonly TemplatePlanSparsePart[];
}

export interface TemplatePlanEventAttribute {
  readonly kind: "event";
  readonly name: string;
  readonly valueIndex: number;
}

export interface TemplatePlanRefAttribute {
  readonly kind: "ref";
  readonly valueIndex: number;
}

export interface TemplatePlanPropertiesAttribute {
  readonly kind: "properties";
  readonly valueIndex: number;
}

export type TemplatePlanSparsePart =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "part"; readonly valueIndex: number };

export type TemplatePlanPart =
  | TemplatePlanNodePart
  | TemplatePlanNamedPart
  | TemplatePlanSparsePartDescriptor;

export interface TemplatePlanNodePart {
  readonly kind: "node" | "text" | "comment" | "properties" | "ref";
  readonly valueIndex: number;
  readonly path: readonly number[];
}

export interface TemplatePlanNamedPart {
  readonly kind: "attr" | "boolean" | "className" | "data" | "event" | "property";
  readonly valueIndex: number;
  readonly path: readonly number[];
  readonly name: string;
}

export interface TemplatePlanSparsePartDescriptor {
  readonly kind: "sparseText" | "sparseAttr" | "sparseClassName" | "sparseComment";
  readonly path: readonly number[];
  readonly nodes: readonly TemplatePlanSparsePart[];
  readonly name?: string;
}

export type TemplatePlanInput = Omit<TemplatePlan, "kind" | "version">;

export function createTemplatePlan(input: TemplatePlanInput): TemplatePlan {
  return {
    kind: "TemplatePlan",
    version: 1,
    templateHash: input.templateHash,
    nodes: input.nodes,
    parts: input.parts,
  };
}

export function isTemplatePlan(value: unknown): value is TemplatePlan {
  return (
    isRecord(value) &&
    value.kind === "TemplatePlan" &&
    value.version === 1 &&
    typeof value.templateHash === "string" &&
    Array.isArray(value.nodes) &&
    Array.isArray(value.parts)
  );
}

export function templatePlanFingerprint(plan: TemplatePlan): string {
  return `template-plan:v${plan.version}:${stableStringify(plan)}`;
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  const entries = objectEntries(value).map(
    ([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`,
  );
  return `{${entries.join(",")}}`;
}

function objectEntries(value: Record<PropertyKey, unknown>): readonly [string, unknown][] {
  return Object.keys(value)
    .sort()
    .map((key) => [key, value[key]]);
}
