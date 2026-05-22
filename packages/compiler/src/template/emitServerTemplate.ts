import type {
  TemplatePlan,
  TemplatePlanAttribute,
  TemplatePlanNode,
  TemplatePlanSparsePart,
  TemplatePlanTextContent,
} from "./TemplatePlan.js";

export interface CompiledServerTemplate {
  readonly plan: TemplatePlan;
  readonly renderToString: (values?: ArrayLike<unknown>) => Promise<string>;
}

export function emitServerTemplate(plan: TemplatePlan): CompiledServerTemplate {
  return {
    plan,
    renderToString: async (values = []) => renderTemplate(plan, values),
  };
}

function renderTemplate(plan: TemplatePlan, values: ArrayLike<unknown>): string {
  return `<!--t_${plan.templateHash}-->${renderNodes(plan.nodes, values)}<!--/t_${plan.templateHash}-->`;
}

function renderNodes(nodes: readonly TemplatePlanNode[], values: ArrayLike<unknown>): string {
  return nodes.map((node) => renderNode(node, values)).join("");
}

function renderNode(node: TemplatePlanNode, values: ArrayLike<unknown>): string {
  switch (node.kind) {
    case "element":
      return renderElement(node.tagName, node.attributes, node.children, values);
    case "selfClosingElement":
      return `<${node.tagName}${renderAttributes(node.attributes, values)}/>`;
    case "textOnlyElement":
      return renderTextOnlyElement(node, values);
    case "text":
      return escapeText(node.value);
    case "sparseText":
      return renderSparse(node.nodes, values, escapeText);
    case "part":
      return renderNodePart(node.valueIndex, values);
    case "comment":
      return `<!--${node.value}-->`;
    case "commentPart":
      return `<!--${renderValue(values[node.valueIndex], escapeText)}-->`;
    case "sparseComment":
      return `<!--${renderSparse(node.nodes, values, String)}-->`;
    case "doctype":
      return renderDocType(node);
  }
}

function renderElement(
  tagName: string,
  attributes: readonly TemplatePlanAttribute[],
  children: readonly TemplatePlanNode[],
  values: ArrayLike<unknown>,
): string {
  return `<${tagName}${renderAttributes(attributes, values)}>${renderNodes(children, values)}</${tagName}>`;
}

function renderTextOnlyElement(
  node: Extract<TemplatePlanNode, { readonly kind: "textOnlyElement" }>,
  values: ArrayLike<unknown>,
): string {
  const content = node.textContent ? renderTextContent(node.textContent, values) : "";
  return `<${node.tagName}${renderAttributes(node.attributes, values)}>${content}</${node.tagName}>`;
}

function renderTextContent(content: TemplatePlanTextContent, values: ArrayLike<unknown>): string {
  if (content.kind === "text") return content.value;
  if (content.kind === "sparseText") return renderSparse(content.nodes, values, String);
  return renderValue(values[content.valueIndex], String);
}

function renderAttributes(
  attributes: readonly TemplatePlanAttribute[],
  values: ArrayLike<unknown>,
): string {
  return attributes
    .map((attribute) => renderAttribute(attribute, values))
    .filter(Boolean)
    .join("");
}

function renderAttribute(attribute: TemplatePlanAttribute, values: ArrayLike<unknown>): string {
  switch (attribute.kind) {
    case "attribute":
      return renderStaticAttribute(attribute.name, attribute.value);
    case "dynamicAttribute":
    case "boolean":
      return values[attribute.valueIndex] ? ` ${attribute.name}` : "";
    case "className":
    case "property":
      return renderNamedAttribute(attribute.name, values[attribute.valueIndex]);
    case "sparseAttribute":
    case "sparseClassName":
      return renderNamedAttribute(attribute.name, renderSparse(attribute.nodes, values, String));
    case "data":
      return renderRecordAttributes(values[attribute.valueIndex], "data-");
    case "properties":
      return renderRecordAttributes(values[attribute.valueIndex], "");
    case "event":
    case "ref":
      return "";
  }
}

function renderNamedAttribute(name: string, value: unknown): string {
  if (value === false || value === null || value === undefined) return "";
  return ` ${name}="${escapeAttribute(String(value))}"`;
}

function renderStaticAttribute(name: string, value: string): string {
  return value === "" ? ` ${name}` : ` ${name}="${value}"`;
}

function renderNodePart(index: number, values: ArrayLike<unknown>): string {
  return `<!--n_${index}-->${renderValue(values[index], escapeText)}<!--/n_${index}-->`;
}

function renderRecordAttributes(value: unknown, prefix: string): string {
  if (!isRecord(value)) return "";
  return Object.entries(value)
    .map(([key, child]) => renderNamedAttribute(`${prefix}${key}`, child))
    .join("");
}

function renderSparse(
  nodes: readonly TemplatePlanSparsePart[],
  values: ArrayLike<unknown>,
  encode: (value: string) => string,
): string {
  return nodes
    .map((node) =>
      node.kind === "text" ? node.value : renderValue(values[node.valueIndex], encode),
    )
    .join("");
}

function renderValue(value: unknown, encode: (value: string) => string): string {
  if (value === null || value === undefined) return "";
  return encode(String(value));
}

function renderDocType(node: Extract<TemplatePlanNode, { readonly kind: "doctype" }>): string {
  const publicId = node.publicId ? ` ${node.publicId}` : "";
  const systemId = node.systemId ? ` ${node.systemId}` : "";
  return `<!DOCTYPE ${node.name}${publicId}${systemId}>`;
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
