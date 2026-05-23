import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";

export interface State {
  readonly open: boolean;
}

interface DialogElement extends HTMLElement {
  readonly open?: boolean;
  showModal?: () => void;
  close?: () => void;
}

const elements = new WeakMap<object, DialogElement>();
const invokers = new WeakMap<object, HTMLElement>();

export function register<S extends State>(
  state: RefSubject.RefSubject<S>,
): (element: HTMLElement) => Effect.Effect<void> {
  return (element) =>
    Effect.gen(function* () {
      const dialog = element as DialogElement;
      elements.set(state, dialog);
      const current = yield* state;
      if (current.open) openElement(dialog);
    });
}

export function showModal<S extends State>(
  state: RefSubject.RefSubject<S>,
  event?: Event,
): Effect.Effect<S> {
  return Effect.gen(function* () {
    rememberInvoker(state, event);
    openElement(elements.get(state));
    return yield* RefSubject.update(state, (current) => ({ ...current, open: true }));
  });
}

export function close<S extends State>(state: RefSubject.RefSubject<S>): Effect.Effect<S> {
  return Effect.gen(function* () {
    closeElement(elements.get(state));
    const next = yield* RefSubject.update(state, (current) => ({ ...current, open: false }));
    invokers.get(state)?.focus();
    return next;
  });
}

export function syncClosed<S extends State>(state: RefSubject.RefSubject<S>): Effect.Effect<S> {
  return RefSubject.update(state, (current) => ({ ...current, open: false }));
}

function rememberInvoker<S extends State>(state: RefSubject.RefSubject<S>, event?: Event): void {
  const target = event?.currentTarget ?? event?.target;
  if (isFocusableElement(target)) {
    invokers.set(state, target);
    return;
  }

  const activeElement = getActiveElement(target);
  if (activeElement) invokers.set(state, activeElement);
}

function openElement(element: DialogElement | undefined): void {
  if (!element) return;
  if (typeof element.showModal === "function" && element.open !== true) {
    element.showModal();
    return;
  }

  element.setAttribute("open", "");
}

function closeElement(element: DialogElement | undefined): void {
  if (!element) return;
  if (typeof element.close === "function" && element.open === true) {
    element.close();
    return;
  }

  element.removeAttribute("open");
}

function isFocusableElement(value: EventTarget | null | undefined): value is HTMLElement {
  return typeof value === "object" && value !== null && "focus" in value;
}

function getActiveElement(value: EventTarget | null | undefined): HTMLElement | undefined {
  const document =
    typeof value === "object" && value !== null && "ownerDocument" in value
      ? (value as { readonly ownerDocument?: Document }).ownerDocument
      : undefined;
  const activeElement = document?.activeElement ?? null;
  return isFocusableElement(activeElement) ? activeElement : undefined;
}
