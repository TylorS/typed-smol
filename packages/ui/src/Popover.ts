import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, type Renderable, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";

export interface State {
  readonly id: string;
  readonly open: boolean;
  readonly mode: "auto" | "hint" | "manual";
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
  mode: Schema.Literals(["auto", "hint", "manual"]),
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

export function Trigger<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
}) {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="toggle"
    aria-expanded=${open}
    .data=${{ open }}
  >${options.content}</button>`;
}

export function Content<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
}) {
  const id = RefSubject.map(options.state, (current) => current.id);
  const mode = dataMode(options.state);
  const open = dataOpen(options.state);
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    setOpen(options.state, event.newState === "open"),
  );

  return html`<div
    id=${id}
    popover=${mode}
    .data=${{ open, mode }}
    ontoggle=${onToggle}
  >${options.content}</div>`;
}

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
}

function dataOpen(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
  );
}
