import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import {
  resolveServerValue,
  runServerSlot,
} from "@typed/template/compiler-runtime/renderable";
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

async function renderTemplate(plan: TemplatePlan, values: ArrayLike<unknown>): Promise<string> {
  return `<!--t_${plan.templateHash}-->${await renderNodes(plan.nodes, values)}<!--/t_${plan.templateHash}-->`;
}

async function renderNodes(
  nodes: readonly TemplatePlanNode[],
  values: ArrayLike<unknown>,
): Promise<string> {
  return (await Promise.all(nodes.map((node) => renderNode(node, values)))).join("");
}

async function renderNode(node: TemplatePlanNode, values: ArrayLike<unknown>): Promise<string> {
  switch (node.kind) {
    case "element":
      return renderElement(node.tagName, node.attributes, node.children, values);
    case "selfClosingElement":
      return `<${node.tagName}${await renderAttributes(node.attributes, values)}/>`;
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
      return `<!--${await renderValue(values[node.valueIndex], escapeText)}-->`;
    case "sparseComment":
      return `<!--${await renderSparse(node.nodes, values, String)}-->`;
    case "doctype":
      return renderDocType(node);
  }
}

function renderElement(
  tagName: string,
  attributes: readonly TemplatePlanAttribute[],
  children: readonly TemplatePlanNode[],
  values: ArrayLike<unknown>,
): Promise<string> {
  return Promise.all([renderAttributes(attributes, values), renderNodes(children, values)]).then(
    ([attrs, body]) => `<${tagName}${attrs}>${body}</${tagName}>`,
  );
}

function renderTextOnlyElement(
  node: Extract<TemplatePlanNode, { readonly kind: "textOnlyElement" }>,
  values: ArrayLike<unknown>,
): Promise<string> {
  const content = node.textContent ? renderTextContent(node.textContent, values) : "";
  return Promise.all([renderAttributes(node.attributes, values), content]).then(
    ([attrs, body]) => `<${node.tagName}${attrs}>${body}</${node.tagName}>`,
  );
}

function renderTextContent(
  content: TemplatePlanTextContent,
  values: ArrayLike<unknown>,
): Promise<string> | string {
  if (content.kind === "text") return content.value;
  if (content.kind === "sparseText") return renderSparse(content.nodes, values, String);
  return renderValue(values[content.valueIndex], String);
}

async function renderAttributes(
  attributes: readonly TemplatePlanAttribute[],
  values: ArrayLike<unknown>,
): Promise<string> {
  const rendered = await Promise.all(
    attributes.map((attribute) => renderAttribute(attribute, values)),
  );
  return rendered.filter(Boolean).join("");
}

async function renderAttribute(
  attribute: TemplatePlanAttribute,
  values: ArrayLike<unknown>,
): Promise<string> {
  switch (attribute.kind) {
    case "attribute":
      return renderStaticAttribute(attribute.name, attribute.value);
    case "dynamicAttribute":
      return renderNamedAttribute(
        attribute.name,
        resolveSlotValue(values[attribute.valueIndex]),
      );
    case "boolean":
      return (await resolveSlotValue(values[attribute.valueIndex])) ? ` ${attribute.name}` : "";
    case "className":
    case "property":
      return renderNamedAttribute(attribute.name, resolveSlotValue(values[attribute.valueIndex]));
    case "sparseAttribute":
    case "sparseClassName":
      return renderNamedAttribute(attribute.name, renderSparse(attribute.nodes, values, String));
    case "data":
      return renderRecordAttributes(
        await resolveSlotValue(values[attribute.valueIndex]),
        "data-",
      );
    case "properties":
      return renderRecordAttributes(
        await resolveSlotValue(values[attribute.valueIndex]),
        "",
      );
    case "event":
    case "ref":
      return "";
  }
}

async function renderNamedAttribute(name: string, value: unknown): Promise<string> {
  const rendered = await value;
  if (rendered === false || rendered === null || rendered === undefined) return "";
  return ` ${name}="${escapeAttribute(String(rendered))}"`;
}

function renderStaticAttribute(name: string, value: string): string {
  return value === "" ? ` ${name}` : ` ${name}="${value}"`;
}

async function renderNodePart(index: number, values: ArrayLike<unknown>): Promise<string> {
  return `<!--n_${index}-->${await renderServerValue(values[index])}<!--/n_${index}-->`;
}

async function renderRecordAttributes(value: unknown, prefix: string): Promise<string> {
  if (!isRecord(value)) return "";
  const attributes = await Promise.all(
    Object.entries(value).map(([key, child]) =>
      renderNamedAttribute(`${prefix}${key}`, resolveSlotValue(child)),
    ),
  );
  return attributes.join("");
}

async function renderSparse(
  nodes: readonly TemplatePlanSparsePart[],
  values: ArrayLike<unknown>,
  encode: (value: string) => string,
): Promise<string> {
  const rendered = await Promise.all(
    nodes.map((node) =>
      node.kind === "text" ? node.value : renderValue(values[node.valueIndex], encode),
    ),
  );
  return rendered.join("");
}

async function renderValue(value: unknown, encode: (value: string) => string): Promise<string> {
  return encode(await renderServerValue(value));
}

async function renderServerValue(value: unknown): Promise<string> {
  const events = await Effect.runPromise(Fx.collectAll(runServerSlot("unknown", value, {})));
  return events.map((event) => event.html).join("");
}

function resolveSlotValue(value: unknown): Promise<unknown> {
  return Effect.runPromise(resolveServerValue("unknown", value, {}));
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
