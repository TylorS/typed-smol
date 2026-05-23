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

export function register<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): (element: HTMLElement) => Effect.Effect<void, E, R> {
  return (element) =>
    Effect.gen(function* () {
      const dialog = element as DialogElement;
      elements.set(state, dialog);
      const current = yield* state;
      if (current.open) openElement(dialog);
    });
}

export function showModal<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  source?: Event | HTMLElement,
): Effect.Effect<S, E, R> {
  return Effect.gen(function* () {
    rememberInvoker(state, source);
    openElement(elements.get(state));
    return yield* RefSubject.update(state, (current) => ({ ...current, open: true }));
  });
}

export function close<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): Effect.Effect<S, E, R> {
  return Effect.gen(function* () {
    const invoker = invokers.get(state);
    closeElement(elements.get(state));
    const next = yield* RefSubject.update(state, (current) => ({ ...current, open: false }));
    if (invoker) restoreFocus(invoker);
    return next;
  });
}

export function syncClosed<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): Effect.Effect<S, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open: false }));
}

function rememberInvoker<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  source?: Event | HTMLElement,
): void {
  const target = source instanceof Event ? source.currentTarget ?? source.target : source;
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

function restoreFocus(element: HTMLElement): void {
  element.focus();

  const window = element.ownerDocument?.defaultView;
  window?.requestAnimationFrame(() => element.focus());
  window?.setTimeout(() => element.focus(), 0);
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
