import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Scope from "effect/Scope";
import * as EventHandler from "../EventHandler.js";
import { renderEventToArray } from "../internal/dom.js";
import { renderToString } from "../internal/encoding.js";
import { isRenderEvent } from "../RenderEvent.js";
import {
  notifyDomTemplateBinding,
  notifyDomTemplateMounted,
  notifyDomTemplateUnmounted,
  type DomTemplateDevtoolsObserver,
} from "./devtools.js";
import { type RenderableKind, runDomBinding, type DomTemplateRuntime } from "./renderable.js";

export interface DomTemplateInstance {
  readonly root: DocumentFragment;
  readonly templateHash: string;
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
  readonly renderInto: (
    root: HTMLElement,
    values?: ArrayLike<unknown>,
    runtime?: Omit<DomTemplateRuntime, "scope">,
  ) => Promise<readonly Node[]>;
}

export type DomSparsePart = string | { readonly valueIndex: number };

export type DomTemplateBinding =
  | {
      readonly kind: "node";
      readonly path: readonly number[];
      readonly valueIndex: number;
      readonly valueKind: RenderableKind;
    }
  | {
      readonly kind: "text" | "comment";
      readonly path: readonly number[];
      readonly valueIndex: number;
      readonly valueKind: RenderableKind;
    }
  | {
      readonly kind: "attr" | "boolean" | "property";
      readonly path: readonly number[];
      readonly name: string;
      readonly valueIndex: number;
      readonly valueKind: RenderableKind;
    }
  | {
      readonly kind: "className" | "data" | "properties";
      readonly path: readonly number[];
      readonly valueIndex: number;
      readonly valueKind: RenderableKind;
    }
  | {
      readonly kind: "event";
      readonly path: readonly number[];
      readonly name: string;
      readonly valueIndex: number;
    }
  | { readonly kind: "ref"; readonly path: readonly number[]; readonly valueIndex: number };

const templateCache = new WeakMap<Document, Map<string, HTMLTemplateElement>>();
interface MountedDomRoot {
  readonly devtools?: DomTemplateDevtoolsObserver;
  readonly scope: Scope.Closeable;
  readonly templateHash: string;
}

const rootScopes = new WeakMap<HTMLElement, MountedDomRoot>();

export function defineDomTemplate<Values extends readonly unknown[]>(
  spec: DomTemplateSpec<Values>,
): (...values: Values) => CompiledDomTemplate {
  return (...captured) => ({
    renderInto: async (root, values = captured, runtime = {}) => {
      await closePreviousRootScope(root);
      const scope = Effect.runSync(Scope.make());
      const instance = instantiateDomTemplate(root.ownerDocument, spec.html, spec.templateHash);
      const templateRuntime = { ...runtime, scope };

      try {
        await Effect.runPromise(spec.mount(instance, values as unknown as Values, templateRuntime));
        const nodes = Array.from(instance.root.childNodes);
        rootScopes.set(root, {
          devtools: runtime.devtools,
          scope,
          templateHash: spec.templateHash,
        });
        root.replaceChildren(...nodes);
        notifyDomTemplateMounted(runtime.devtools, {
          nodes,
          root,
          templateHash: spec.templateHash,
        });
        return nodes;
      } catch (error) {
        await Effect.runPromise(Scope.close(scope, Exit.die(error)));
        throw error;
      }
    },
  });
}

export function defineStaticDomTemplate(
  spec: Pick<DomTemplateSpec<readonly []>, "html" | "templateHash">,
): () => CompiledDomTemplate {
  return defineDomTemplate({ ...spec, mount: () => Effect.void });
}

async function closePreviousRootScope(root: HTMLElement): Promise<void> {
  const previous = rootScopes.get(root);
  if (!previous) return;

  rootScopes.delete(root);
  notifyDomTemplateUnmounted(previous.devtools, {
    root,
    templateHash: previous.templateHash,
  });
  await Effect.runPromise(Scope.close(previous.scope, Exit.void));
}

export function instantiateDomTemplate(
  document: Document,
  html: string,
  templateHash = "",
): DomTemplateInstance {
  const template = getTemplate(document, html);
  return {
    root: template.content.cloneNode(true) as DocumentFragment,
    templateHash,
    dispose: Effect.void,
  };
}

export function getNodeAtPath<T extends Node = Node>(root: ParentNode, path: readonly number[]): T {
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
  return runDomBinding(
    kind,
    value,
    (next) => {
      const nodes = valueToNodes(anchor.ownerDocument, next);
      current.forEach((node) => node.parentNode?.removeChild(node));
      anchor.before(...nodes);
      current = nodes;
    },
    runtime,
  );
}

export function bindText(
  node: Node,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(
    kind,
    value,
    (next) => {
      node.textContent = renderToString(next, "");
    },
    runtime,
  );
}

export function bindAttr(
  element: Element,
  name: string,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(
    kind,
    value,
    (next) => {
      if (next === null || next === undefined || next === false) element.removeAttribute(name);
      else element.setAttribute(name, renderToString(next, ""));
    },
    runtime,
  );
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
  return runDomBinding(
    kind,
    value,
    (next) => {
      (element as HTMLElement).className = renderToString(next, " ");
    },
    runtime,
  );
}

export function bindData(
  element: Element,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(
    kind,
    value,
    (next) => {
      if (!isRecord(next)) return;
      for (const [key, child] of Object.entries(next)) {
        if (child === null || child === undefined || child === false) {
          delete (element as HTMLElement).dataset[key];
        } else {
          (element as HTMLElement).dataset[key] = renderToString(child, "");
        }
      }
    },
    runtime,
  );
}

export const bindDataAttr = bindData;

export function bindProperty(
  element: Element,
  name: string,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(
    kind,
    value,
    (next) => {
      (element as never as Record<string, unknown>)[name] = next;
    },
    runtime,
  );
}

export function bindRef(element: Element, value: unknown): Effect.Effect<void, unknown, never> {
  return Effect.gen(function* () {
    if (typeof value !== "function") return;
    const result = value(element);
    if (Effect.isEffect(result)) yield* result as Effect.Effect<void, unknown, never>;
  });
}

export function bindSparseAttr(
  element: Element,
  name: string,
  parts: readonly DomSparsePart[],
  values: ArrayLike<unknown>,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return bindSparse(element, parts, values, runtime, (value) => {
    if (value === "") element.removeAttribute(name);
    else element.setAttribute(name, value);
  });
}

export function bindSparseClass(
  element: Element,
  parts: readonly DomSparsePart[],
  values: ArrayLike<unknown>,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return bindSparse(element, parts, values, runtime, (value) => {
    (element as HTMLElement).className = value.split(/\s+/).filter(Boolean).join(" ");
  });
}

export function bindProperties(
  element: Element,
  value: unknown,
  kind: RenderableKind,
  runtime: DomTemplateRuntime,
): Effect.Effect<void, unknown, never> {
  return runDomBinding(kind, value, (next) => applyProperties(element, next), runtime);
}

export function bindEvent(element: Element, name: string, value: unknown): Effect.Effect<void> {
  return Effect.sync(() => {
    const handler = EventHandler.fromEffectOrEventHandler(value as never);
    element.addEventListener(
      name,
      (event) => void Effect.runPromise(handler.handler(event) as never),
      handler.options,
    );
  });
}

export function mountDomTemplateBindings(
  instance: DomTemplateInstance,
  values: ArrayLike<unknown>,
  runtime: DomTemplateRuntime,
  bindings: readonly DomTemplateBinding[],
): Effect.Effect<void, unknown, never> {
  return Effect.all(
    bindings.map((binding) => mountDomTemplateBinding(instance, values, runtime, binding)),
    {
      concurrency: "unbounded",
    },
  );
}

function mountDomTemplateBinding(
  instance: DomTemplateInstance,
  values: ArrayLike<unknown>,
  runtime: DomTemplateRuntime,
  binding: DomTemplateBinding,
): Effect.Effect<void, unknown, never> {
  if (binding.kind === "node") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getCommentAtPath(instance.root, binding.path),
      (anchor) => bindNode(anchor, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "text" || binding.kind === "comment") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getNodeAtPath(instance.root, binding.path),
      (node) => bindText(node, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "attr") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getElementAtPath(instance.root, binding.path),
      (element) =>
        bindAttr(element, binding.name, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "boolean") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getElementAtPath(instance.root, binding.path),
      (element) =>
        bindBoolean(element, binding.name, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "property") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getElementAtPath(instance.root, binding.path),
      (element) =>
        bindProperty(element, binding.name, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "className") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getElementAtPath(instance.root, binding.path),
      (element) => bindClass(element, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "data") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getElementAtPath(instance.root, binding.path),
      (element) => bindData(element, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "properties") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getElementAtPath(instance.root, binding.path),
      (element) => bindProperties(element, values[binding.valueIndex], binding.valueKind, runtime),
    );
  }
  if (binding.kind === "event") {
    return withResolvedTemplateBinding(
      runtime,
      instance,
      binding,
      () => getElementAtPath(instance.root, binding.path),
      (element) => bindEvent(element, binding.name, values[binding.valueIndex]),
    );
  }
  return withResolvedTemplateBinding(
    runtime,
    instance,
    binding,
    () => getElementAtPath(instance.root, binding.path),
    (element) => bindRef(element, values[binding.valueIndex]),
  );
}

function withResolvedTemplateBinding<T extends Node>(
  runtime: DomTemplateRuntime,
  instance: DomTemplateInstance,
  binding: DomTemplateBinding,
  resolveNode: () => T,
  bind: (node: T) => Effect.Effect<void, unknown, never>,
): Effect.Effect<void, unknown, never> {
  return Effect.flatMap(
    Effect.sync(() => {
      const node = resolveNode();
      notifyTemplateBinding(runtime, node, instance, binding);
      return node;
    }),
    bind,
  );
}

function notifyTemplateBinding(
  runtime: DomTemplateRuntime,
  node: Node,
  instance: DomTemplateInstance,
  binding: DomTemplateBinding,
): void {
  notifyDomTemplateBinding(runtime.devtools, node, {
    kind: binding.kind,
    path: binding.path,
    templateHash: instance.templateHash,
    ...("name" in binding ? { name: binding.name } : {}),
    ...("valueIndex" in binding ? { valueIndex: binding.valueIndex } : {}),
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

function bindSparse(
  element: Element,
  parts: readonly DomSparsePart[],
  values: ArrayLike<unknown>,
  runtime: DomTemplateRuntime,
  sink: (value: string) => void,
): Effect.Effect<void, unknown, never> {
  const current = parts.map((part) => (typeof part === "string" ? part : values[part.valueIndex]));
  const flush = () => sink(current.map((value) => renderToString(value, "")).join(""));
  const effects = parts.flatMap((part, index) =>
    typeof part === "string"
      ? []
      : [
          runDomBinding(
            "unknown",
            values[part.valueIndex],
            (next) => {
              current[index] = next;
              flush();
            },
            runtime,
          ),
        ],
  );
  flush();
  return Effect.all(effects, { concurrency: "unbounded" });
}

function applyProperties(element: Element, value: unknown): void {
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) applyProperty(element, key, child);
}

function applyProperty(element: Element, key: string, value: unknown): void {
  if (key === "class" || key === "className" || key === "classname") {
    (element as HTMLElement).className = renderToString(value, " ");
  } else if (key === ".data") {
    bindData(element, value, "plain", {}).pipe(Effect.runSync);
  } else if (key.startsWith("?")) {
    element.toggleAttribute(key.slice(1), !!value);
  } else if (key.startsWith(".")) {
    (element as never as Record<string, unknown>)[key.slice(1)] = value;
  } else if (key !== "ref" && !key.startsWith("@") && !key.startsWith("on")) {
    if (value === null || value === undefined || value === false) element.removeAttribute(key);
    else element.setAttribute(key, renderToString(value, ""));
  }
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
