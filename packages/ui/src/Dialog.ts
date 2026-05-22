import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type OptionalString = ReactiveValue<string | undefined, any, any>;
type RequiredString = ReactiveValue<string, any, any>;

export interface State {
  readonly open: boolean;
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
});

const invokers = new WeakMap<RefSubject.RefSubject<State>, HTMLElement>();

export function makeState(
  initial: State,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make(initial);
}

export function setOpen(state: RefSubject.RefSubject<State>, open: boolean): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function close(state: RefSubject.RefSubject<State>): Effect.Effect<State> {
  return setOpen(state, false).pipe(Effect.tap(() => focusInvoker(state)));
}

export interface TriggerOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly controls?: OptionalString;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts): Component<Opts> {
  const open = dataOpen(options.state);
  const onClick = EventHandler.make((event: MouseEvent) => {
    const eventTarget = event.currentTarget ?? event.target;
    const activeElement = getActiveElement(eventTarget);
    const target = isFocusableElement(eventTarget) ? eventTarget : activeElement;

    return Effect.gen(function* () {
      if (target) invokers.set(options.state, target);
      yield* setOpen(options.state, true);
    });
  });

  return html`<button
    type="button"
    aria-haspopup="dialog"
    aria-expanded=${open}
    aria-controls=${options.controls}
    .data=${{ open }}
    onclick=${onClick}
  >
    ${options.content}
  </button>`;
}

export interface CloseOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
}

export function Close<const Opts extends CloseOptions>(options: Opts): Component<Opts> {
  const onClick = EventHandler.make(() => close(options.state));

  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export const Dismiss = Close;
export const Disclosure = Trigger;

export interface ContentOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id?: OptionalString;
  readonly label: RequiredString;
  readonly content: AnyContent;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
  const open = dataOpen(options.state);
  const hidden = RefSubject.map(options.state, (current) => !current.open);

  return html`<div
    id=${options.id}
    role="dialog"
    aria-modal="true"
    aria-label=${options.label}
    ?hidden=${hidden}
    .data=${{ open }}
  >
    ${options.content}
  </div>`;
}

export function Heading<
  const Opts extends { readonly id?: OptionalString; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level="1">${options.content}</div>`;
}

export function Description<
  const Opts extends { readonly id?: OptionalString; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  return html`<p id=${options.id}>${options.content}</p>`;
}

function dataOpen(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function focusInvoker(state: RefSubject.RefSubject<State>) {
  return Effect.sync(() => invokers.get(state)?.focus());
}

function isFocusableElement(value: EventTarget | null): value is HTMLElement {
  return typeof value === "object" && value !== null && "focus" in value;
}

function getActiveElement(value: EventTarget | null): HTMLElement | undefined {
  const document =
    typeof value === "object" && value !== null && "ownerDocument" in value
      ? (value as { readonly ownerDocument?: Document }).ownerDocument
      : undefined;
  const activeElement = document?.activeElement ?? null;
  return isFocusableElement(activeElement) ? activeElement : undefined;
}
