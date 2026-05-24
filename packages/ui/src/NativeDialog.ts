import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";

export interface State {
  readonly open: boolean;
}

interface DialogElement extends HTMLElement {
  readonly open?: boolean;
  show?: () => void;
  showModal?: () => void;
  close?: () => void;
}

export type FocusTarget =
  | string
  | HTMLElement
  | (() => HTMLElement | null | undefined);

export interface Options {
  readonly modal?: boolean;
  readonly initialFocus?: FocusTarget;
  readonly finalFocus?: FocusTarget;
}

const elements = new WeakMap<object, DialogElement>();
const invokers = new WeakMap<object, HTMLElement>();
const optionsByState = new WeakMap<object, Options>();

export function register<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  options: Options = {},
): (element: HTMLElement) => Effect.Effect<void, E, R> {
  return (element) =>
    Effect.gen(function* () {
      const dialog = element as DialogElement;
      elements.set(state, dialog);
      optionsByState.set(state, options);
      const current = yield* state;
      if (current.open) openElement(dialog, options);
    });
}

export function showModal<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  source?: Event | HTMLElement,
): Effect.Effect<S, E, R> {
  return Effect.gen(function* () {
    rememberInvoker(state, source);
    const options = optionsByState.get(state);
    openElement(elements.get(state), options);
    return yield* RefSubject.update(state, (current) => ({ ...current, open: true }));
  });
}

export function close<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): Effect.Effect<S, E, R> {
  return Effect.gen(function* () {
    const options = optionsByState.get(state);
    const invoker = focusTarget(elements.get(state), options?.finalFocus) ?? invokers.get(state);
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

function openElement(element: DialogElement | undefined, options: Options = {}): void {
  if (!element) return;
  if (options.modal === false && typeof element.show === "function" && element.open !== true) {
    element.show();
    focusInitial(element, options);
    return;
  }

  if (typeof element.showModal === "function" && element.open !== true) {
    element.showModal();
    focusInitial(element, options);
    return;
  }

  element.setAttribute("open", "");
  focusInitial(element, options);
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
  focusElement(element);
}

function focusInitial(element: DialogElement, options: Options): void {
  const target = focusTarget(element, options.initialFocus);
  if (target) focusElement(target);
}

function focusTarget(element: DialogElement | undefined, target: FocusTarget | undefined): HTMLElement | undefined {
  if (!element || target === undefined) return undefined;
  if (typeof target === "string") {
    const found = element.ownerDocument?.querySelector(target);
    return isFocusableElement(found) ? found : undefined;
  }
  if (typeof target === "function") {
    const found = target();
    return isFocusableElement(found) ? found : undefined;
  }
  return target;
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

function focusElement(element: HTMLElement): void {
  element.focus();

  const window = element.ownerDocument?.defaultView;
  window?.requestAnimationFrame(() => element.focus());
  window?.setTimeout(() => element.focus(), 0);
  window?.setTimeout(() => element.focus(), 50);
  window?.setTimeout(() => element.focus(), 100);
}
