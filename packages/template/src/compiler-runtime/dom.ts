import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Scope from "effect/Scope";
import * as EventHandler from "../EventHandler.js";
import { renderEventToArray } from "../internal/dom.js";
import { renderToString } from "../internal/encoding.js";
import { isRenderEvent } from "../RenderEvent.js";
import { type RenderableKind, runDomBinding, type DomTemplateRuntime } from "./renderable.js";

export interface DomTemplateInstance {
  readonly root: DocumentFragment;
  readonly dispose: Effect.Effect<void>;
}

export interface DomTemplateSpec<Values extends readonly unknown[]> {
  readonly templateHash: string;
  readonly html: string;
  readonly mount: (
    instance: DomTemplateInstance,
    values: Values,
    runtime: DomTemplateRuntime,
  ) => Effect.Effect<void, unknown, never>;
}

export interface CompiledDomTemplate {
  readonly renderInto: (root: HTMLElement, values?: ArrayLike<unknown>) => Promise<readonly Node[]>;
}

const templateCache = new WeakMap<Document, Map<string, HTMLTemplateElement>>();
const rootScopes = new WeakMap<HTMLElement, Scope.Closeable>();

export function defineDomTemplate<Values extends readonly unknown[]>(
  spec: DomTemplateSpec<Values>,
): (...values: Values) => CompiledDomTemplate {
  return (...captured) => ({
    renderInto: async (root, values = captured) => {
      await closePreviousRootScope(root);
      const scope = Effect.runSync(Scope.make());
      const instance = instantiateDomTemplate(root.ownerDocument, spec.html);

      try {
        await Effect.runPromise(spec.mount(instance, values as unknown as Values, { scope }));
        const nodes = Array.from(instance.root.childNodes);
        rootScopes.set(root, scope);
        root.replaceChildren(...nodes);
        return nodes;
      } catch (error) {
        await Effect.runPromise(Scope.close(scope, Exit.die(error)));
        throw error;
      }
    },
  });
}

async function closePreviousRootScope(root: HTMLElement): Promise<void> {
  const previous = rootScopes.get(root);
  if (!previous) return;

  rootScopes.delete(root);
  await Effect.runPromise(Scope.close(previous, Exit.void));
}

export function instantiateDomTemplate(document: Document, html: string): DomTemplateInstance {
  const template = getTemplate(document, html);
  return {
    root: template.content.cloneNode(true) as DocumentFragment,
    dispose: Effect.void,
  };
}

export function getNodeAtPath<T extends Node = Node>(
  root: ParentNode,
  path: readonly number[],
): T {
  let current: ParentNode | Node = root;
  for (const index of path) {
    const next = current.childNodes.item(index);
    if (!next) throw new RangeError(`Could not find template node at path ${path.join(".")}`);
    current = next;
  }
  return current as T;
}

export function getElementAtPath<T extends Element = Element>(
  root: ParentNode,
  path: readonly number[],
): T {
  const node = getNodeAtPath(root, path);
  if (node.nodeType !== node.ELEMENT_NODE) {
    throw new TypeError(`Expected element at template path ${path.join(".")}`);
  }
  return node as T;
}

export function getCommentAtPath(root: ParentNode, path: readonly number[]): Comment {
  const node = getNodeAtPath(root, path);
  if (node.nodeType !== node.COMMENT_NODE) {
    throw new TypeError(`Expected comment at template path ${path.join(".")}`);
  }
  return node as Comment;
}

export function getAttrAtPath(root: ParentNode, path: readonly number[], name: string): Attr {
  const element = getElementAtPath(root, path);
  const attr = element.getAttributeNode(name) ?? element.ownerDocument.createAttribute(name);
  if (!attr.ownerElement) element.setAttributeNode(attr);
  return attr;
}

export function bindNode(
  anchor: Comment,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  let current: readonly Node[] = [];
  return runDomBinding(kind, value, (next) => {
    const nodes = valueToNodes(anchor.ownerDocument, next);
    current.forEach((node) => node.parentNode?.removeChild(node));
    anchor.before(...nodes);
    current = nodes;
  }, runtime);
}

export function bindText(
  node: Node,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(kind, value, (next) => {
    node.textContent = renderToString(next, "");
  }, runtime);
}

export function bindAttr(
  element: Element,
  name: string,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(kind, value, (next) => {
    if (next === null || next === undefined || next === false) element.removeAttribute(name);
    else element.setAttribute(name, renderToString(next, ""));
  }, runtime);
}

export function bindBoolean(
  element: Element,
  name: string,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(kind, value, (next) => element.toggleAttribute(name, !!next), runtime);
}

export function bindClass(
  element: Element,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(kind, value, (next) => {
    (element as HTMLElement).className = renderToString(next, " ");
  }, runtime);
}

export function bindData(
  element: Element,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(kind, value, (next) => {
    if (!isRecord(next)) return;
    for (const [key, child] of Object.entries(next)) {
      if (child === null || child === undefined || child === false) {
        delete (element as HTMLElement).dataset[key];
      } else {
        (element as HTMLElement).dataset[key] = renderToString(child, "");
      }
    }
  }, runtime);
}

export function bindProperty(
  element: Element,
  name: string,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(kind, value, (next) => {
    (element as never as Record<string, unknown>)[name] = next;
  }, runtime);
}

export function bindRef(element: Element, value: unknown): Effect.Effect<void, unknown, never> {
  return Effect.gen(function* () {
    if (typeof value !== "function") return;
    const result = value(element);
    if (Effect.isEffect(result)) yield* result as Effect.Effect<void, unknown, never>;
  });
}

export function bindEvent(
  element: Element,
  name: string,
  value: unknown,
): Effect.Effect<void> {
  return Effect.sync(() => {
    const handler = EventHandler.fromEffectOrEventHandler(value as never);
    element.addEventListener(name, (event) => void Effect.runPromise(handler.handler(event) as never), handler.options);
  });
}

function getTemplate(document: Document, html: string): HTMLTemplateElement {
  let byHtml = templateCache.get(document);
  if (!byHtml) {
    byHtml = new Map();
    templateCache.set(document, byHtml);
  }

  let template = byHtml.get(html);
  if (!template) {
    template = document.createElement("template");
    template.innerHTML = html;
    byHtml.set(html, template);
  }
  return template;
}

function valueToNodes(document: Document, value: unknown): readonly Node[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((child) => valueToNodes(document, child));
  if (isRenderEvent(value)) return renderEventToArray(document, value);
  if (isNode(document, value)) return [value];
  return [document.createTextNode(renderToString(value, ""))];
}

function isNode(document: Document, value: unknown): value is Node {
  return value instanceof document.defaultView!.Node;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
