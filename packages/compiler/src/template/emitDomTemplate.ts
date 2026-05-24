import * as Effect from "effect/Effect";
import { EventHandler } from "@typed/template";
import type {
  TemplatePlan,
  TemplatePlanAttribute,
  TemplatePlanNode,
  TemplatePlanSparsePart,
  TemplatePlanTextContent,
} from "./TemplatePlan.js";

export interface CompiledDomTemplate {
  readonly plan: TemplatePlan;
  readonly renderInto: (root: HTMLElement, values?: ArrayLike<unknown>) => Promise<readonly Node[]>;
}

export function emitDomTemplate(plan: TemplatePlan): CompiledDomTemplate {
  return {
    plan,
    renderInto: async (root, values = []) => {
      const nodes = await renderRootNodes(root.ownerDocument, plan, values);
      root.replaceChildren(...nodes);
      return nodes;
    },
  };
}

async function renderRootNodes(
  document: Document,
  plan: TemplatePlan,
  values: ArrayLike<unknown>,
): Promise<readonly Node[]> {
  const nodes = await renderNodes(document, plan.nodes, values);
  if (nodes.length <= 1) return nodes;
  return [
    document.createComment(`t_${plan.templateHash}`),
    ...nodes,
    document.createComment(`/t_${plan.templateHash}`),
  ];
}

async function renderNodes(
  document: Document,
  nodes: readonly TemplatePlanNode[],
  values: ArrayLike<unknown>,
): Promise<readonly Node[]> {
  const rendered = await Promise.all(nodes.map((node) => renderNode(document, node, values)));
  return rendered.flat();
}

async function renderNode(
  document: Document,
  node: TemplatePlanNode,
  values: ArrayLike<unknown>,
): Promise<readonly Node[]> {
  switch (node.kind) {
    case "element":
      return renderElement(document, node.tagName, node.attributes, node.children, values);
    case "selfClosingElement":
      return renderElement(document, node.tagName, node.attributes, [], values);
    case "textOnlyElement":
      return renderTextOnlyElement(document, node, values);
    case "text":
      return [document.createTextNode(node.value)];
    case "sparseText":
      return [document.createTextNode(await renderSparse(node.nodes, values))];
    case "part":
      return renderNodePart(document, node.valueIndex, values);
    case "comment":
      return [document.createComment(node.value)];
    case "commentPart":
      return [document.createComment(await renderValue(values[node.valueIndex]))];
    case "sparseComment":
      return [document.createComment(await renderSparse(node.nodes, values))];
    case "doctype":
      return [
        document.implementation.createDocumentType(
          node.name,
          node.publicId ?? "",
          node.systemId ?? "",
        ),
      ];
  }
}

async function renderElement(
  document: Document,
  tagName: string,
  attributes: readonly TemplatePlanAttribute[],
  children: readonly TemplatePlanNode[],
  values: ArrayLike<unknown>,
): Promise<readonly Node[]> {
  const element = document.createElement(tagName);
  await applyAttributes(element, attributes, values);
  element.append(...(await renderNodes(document, children, values)));
  return [element];
}

async function renderTextOnlyElement(
  document: Document,
  node: Extract<TemplatePlanNode, { readonly kind: "textOnlyElement" }>,
  values: ArrayLike<unknown>,
): Promise<readonly Node[]> {
  const element = document.createElement(node.tagName);
  await applyAttributes(element, node.attributes, values);
  if (node.textContent !== null) {
    element.textContent = await renderTextContent(node.textContent, values);
  }
  return [element];
}

async function renderTextContent(
  content: TemplatePlanTextContent,
  values: ArrayLike<unknown>,
): Promise<string> {
  if (content.kind === "text") return content.value;
  if (content.kind === "sparseText") return renderSparse(content.nodes, values);
  return renderValue(values[content.valueIndex]);
}

async function renderNodePart(
  document: Document,
  index: number,
  values: ArrayLike<unknown>,
): Promise<readonly Node[]> {
  const comment = document.createComment(`/n_${index}`);
  const value = await resolveValue(values[index]);
  if (value === null || value === undefined) return [comment];
  return [...renderValueAsNodes(document, value), comment];
}

async function applyAttributes(
  element: HTMLElement,
  attributes: readonly TemplatePlanAttribute[],
  values: ArrayLike<unknown>,
): Promise<void> {
  for (const attribute of attributes) {
    await applyAttribute(element, attribute, values);
  }
}

async function applyAttribute(
  element: HTMLElement,
  attribute: TemplatePlanAttribute,
  values: ArrayLike<unknown>,
): Promise<void> {
  switch (attribute.kind) {
    case "attribute":
      return setStaticAttribute(element, attribute.name, attribute.value);
    case "dynamicAttribute":
      return setAttribute(
        element,
        attribute.name,
        await resolveValue(values[attribute.valueIndex]),
      );
    case "boolean": {
      element.toggleAttribute(attribute.name, !!(await resolveValue(values[attribute.valueIndex])));
      return;
    }
    case "className":
      return setClassList(element, await resolveValue(values[attribute.valueIndex]));
    case "sparseAttribute":
      return setAttribute(element, attribute.name, await renderSparse(attribute.nodes, values));
    case "sparseClassName":
      return setSparseClassList(element, attribute.nodes, values);
    case "data":
      return setDataset(element, await resolveValue(values[attribute.valueIndex]));
    case "event":
      return setupEvent(element, attribute.name, values[attribute.valueIndex]);
    case "property":
      return setProperty(element, attribute.name, await resolveValue(values[attribute.valueIndex]));
    case "properties":
      return applyProperties(element, await resolveValue(values[attribute.valueIndex]));
    case "ref":
      return setupRef(element, values[attribute.valueIndex]);
  }
}

function setStaticAttribute(element: HTMLElement, name: string, value: string): void {
  if (value === "") element.toggleAttribute(name, true);
  else element.setAttribute(name, value);
}

function setAttribute(element: HTMLElement, name: string, value: unknown): void {
  if (value === null || value === undefined) element.removeAttribute(name);
  else element.setAttribute(name, renderValueSync(value));
}

function setClassList(element: HTMLElement, value: unknown): void {
  element.className = getClassList(value).join(" ");
}

function setDataset(element: HTMLElement, value: unknown): void {
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    setAttribute(element, `data-${key}`, child);
  }
}

function setProperty(element: HTMLElement, name: string, value: unknown): void {
  (element as any)[name] = value;
}

async function applyProperties(element: HTMLElement, value: unknown): Promise<void> {
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    await applyPropertyEntry(element, key, child);
  }
}

async function applyPropertyEntry(
  element: HTMLElement,
  key: string,
  value: unknown,
): Promise<void> {
  if (key === "class" || key === "className" || key === "classname") {
    setClassList(element, await resolveValue(value));
  } else if (key === ".data") {
    setDataset(element, await resolveValue(value));
  } else if (key === ".props" || key === ".properties") {
    await applyProperties(element, await resolveValue(value));
  } else if (key === "ref") {
    await setupRef(element, value);
  } else if (key.startsWith("?")) {
    element.toggleAttribute(key.slice(1), !!(await resolveValue(value)));
  } else if (key.startsWith(".")) {
    setProperty(element, key.slice(1), await resolveValue(value));
  } else if (key.startsWith("@")) {
    setupEvent(element, uncapitalize(key.slice(1)), value);
  } else if (key.startsWith("on") && key.length > 2) {
    setupEvent(element, uncapitalize(key.slice(2)), value);
  } else {
    setAttribute(element, key, await resolveValue(value));
  }
}

function setupEvent(element: HTMLElement, name: string, value: unknown): void {
  if (value === null || value === undefined) return;
  const handler = EventHandler.fromEffectOrEventHandler(value as any);
  element.addEventListener(
    name,
    (event) => {
      void Effect.runPromise(handler.handler(event));
    },
    handler.options,
  );
}

async function setupRef(element: HTMLElement, value: unknown): Promise<void> {
  if (value === null || value === undefined) return;
  if (typeof value !== "function") throw new Error("Invalid value provided to ref part");
  const result = value(element);
  if (Effect.isEffect(result)) throw new Error("Effect refs require a typed compiled binding");
}

async function renderSparse(
  nodes: readonly TemplatePlanSparsePart[],
  values: ArrayLike<unknown>,
): Promise<string> {
  const rendered = await Promise.all(
    nodes.map((node) => (node.kind === "text" ? node.value : renderValue(values[node.valueIndex]))),
  );
  return rendered.join("");
}

async function setSparseClassList(
  element: HTMLElement,
  nodes: readonly TemplatePlanSparsePart[],
  values: ArrayLike<unknown>,
): Promise<void> {
  const parts = await Promise.all(
    nodes.map((node) =>
      node.kind === "text" ? node.value : resolveValue(values[node.valueIndex]),
    ),
  );
  element.className = parts.flatMap(getClassList).join(" ");
}

async function renderValue(value: unknown): Promise<string> {
  return renderValueSync(await resolveValue(value));
}

async function resolveValue(value: unknown): Promise<unknown> {
  if (Effect.isEffect(value)) throw new Error("Effect values require a typed compiled binding");
  return value;
}

function renderValueAsNodes(document: Document, value: unknown): readonly Node[] {
  if (Array.isArray(value)) return value.flatMap((child) => renderValueAsNodes(document, child));
  if (isNode(document, value)) return [value];
  return [document.createTextNode(renderValueSync(value))];
}

function renderValueSync(value: unknown): string {
  if (Array.isArray(value)) return value.map(renderValueSync).join("");
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (hasCustomToString(value)) return value.toString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getClassList(value: unknown): readonly string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(getClassList);
  return renderValueSync(value).split(/\s+/).filter(Boolean);
}

function hasCustomToString(value: unknown): value is { readonly toString: () => string } {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as { readonly toString?: unknown }).toString === "function" &&
    (value as { readonly toString: () => string }).toString() !== "[object Object]"
  );
}

function isNode(document: Document, value: unknown): value is Node {
  return value instanceof document.defaultView!.Node;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function uncapitalize(value: string): string {
  return value.length === 0 ? value : value[0].toLowerCase() + value.slice(1);
}
