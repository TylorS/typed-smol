import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, type Renderable, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";

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

export function setOpen(
  state: RefSubject.RefSubject<State>,
  open: boolean,
): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function close(state: RefSubject.RefSubject<State>): Effect.Effect<State> {
  return setOpen(state, false).pipe(Effect.tap(() => focusInvoker(state)));
}

export function Trigger<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly controls?: string;
  readonly content: Content;
}) {
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
  >${options.content}</button>`;
}

export function Close<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
}) {
  const onClick = EventHandler.make(() => close(options.state));

  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export function Content<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly id?: string;
  readonly label: string;
  readonly content: Content;
}) {
  const open = dataOpen(options.state);
  const hidden = RefSubject.map(options.state, (current) => !current.open);

  return html`<div
    id=${options.id}
    role="dialog"
    aria-modal="true"
    aria-label=${options.label}
    ?hidden=${hidden}
    .data=${{ open }}
  >${options.content}</div>`;
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
  const document = typeof value === "object" && value !== null && "ownerDocument" in value
    ? (value as { readonly ownerDocument?: Document }).ownerDocument
    : undefined;
  const activeElement = document?.activeElement ?? null;
  return isFocusableElement(activeElement) ? activeElement : undefined;
}
