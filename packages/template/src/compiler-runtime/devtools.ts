export type DomTemplateDevtoolsBindingKind =
  | "attr"
  | "boolean"
  | "className"
  | "comment"
  | "data"
  | "event"
  | "node"
  | "properties"
  | "property"
  | "ref"
  | "text";

export interface DomTemplateDevtoolsBindingInput {
  readonly kind: DomTemplateDevtoolsBindingKind;
  readonly name?: string;
  readonly path: readonly number[];
  readonly templateHash: string;
  readonly valueIndex?: number;
}

export interface DomTemplateDevtoolsBindingEvent extends DomTemplateDevtoolsBindingInput {
  readonly bindingId: string;
  readonly node: Node;
}

export interface DomTemplateDevtoolsMountedEvent {
  readonly nodes: readonly Node[];
  readonly root: HTMLElement;
  readonly templateHash: string;
}

export interface DomTemplateDevtoolsUnmountedEvent {
  readonly root: HTMLElement;
  readonly templateHash: string;
}

export interface DomTemplateDevtoolsObserver {
  readonly onTemplateBinding?: (event: DomTemplateDevtoolsBindingEvent) => void;
  readonly onTemplateMounted?: (event: DomTemplateDevtoolsMountedEvent) => void;
  readonly onTemplateUnmounted?: (event: DomTemplateDevtoolsUnmountedEvent) => void;
}

export function createDomTemplateBindingId(input: DomTemplateDevtoolsBindingInput): string {
  return [
    input.templateHash,
    "#",
    input.kind,
    ":",
    input.path.join("."),
    input.name ? `:${input.name}` : "",
    input.valueIndex === undefined ? "" : `:${input.valueIndex}`,
  ].join("");
}

export function notifyDomTemplateBinding(
  devtools: DomTemplateDevtoolsObserver | undefined,
  node: Node,
  input: DomTemplateDevtoolsBindingInput,
): void {
  try {
    devtools?.onTemplateBinding?.({
      ...input,
      bindingId: createDomTemplateBindingId(input),
      node,
    });
  } catch {
    // DevTools hooks are diagnostic-only and must not affect template rendering.
  }
}

export function notifyDomTemplateMounted(
  devtools: DomTemplateDevtoolsObserver | undefined,
  event: DomTemplateDevtoolsMountedEvent,
): void {
  try {
    devtools?.onTemplateMounted?.(event);
  } catch {
    // DevTools hooks are diagnostic-only and must not affect template rendering.
  }
}

export function notifyDomTemplateUnmounted(
  devtools: DomTemplateDevtoolsObserver | undefined,
  event: DomTemplateDevtoolsUnmountedEvent,
): void {
  try {
    devtools?.onTemplateUnmounted?.(event);
  } catch {
    // DevTools hooks are diagnostic-only and must not affect template rendering.
  }
}
