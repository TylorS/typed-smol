import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, type Renderable, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";

type AnyContent = Renderable<unknown, unknown, unknown>;
type OptionalString = Renderable<string | undefined, unknown, unknown>;

export interface State {
  readonly open: boolean;
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
});

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

export function toggle(state: RefSubject.RefSubject<State>): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, open: !current.open }));
}

export interface ButtonOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly controls?: OptionalString;
  readonly content: AnyContent;
}

export function Button<const Opts extends ButtonOptions>(options: Opts) {
  const open = dataOpen(options.state);
  const onClick = EventHandler.make(() => toggle(options.state));

  return html`<button
    type="button"
    aria-expanded=${open}
    aria-controls=${options.controls}
    .data=${{ open }}
    onclick=${onClick}
  >${options.content}</button>`;
}

export interface ContentOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id?: OptionalString;
  readonly content: AnyContent;
}

export function Content<const Opts extends ContentOptions>(options: Opts) {
  const open = dataOpen(options.state);
  const hidden = RefSubject.map(options.state, (current) => !current.open);

  return html`<div id=${options.id} ?hidden=${hidden} .data=${{ open }}>${options.content}</div>`;
}

function dataOpen(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}
