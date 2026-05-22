import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { EventHandler, type Renderable, html } from "@typed/template";

export type ActivationMode = "automatic" | "manual";
export type Orientation = "horizontal" | "vertical";

export interface State {
  readonly selectedId: string;
  readonly activationMode: ActivationMode;
  readonly orientation: Orientation;
}

export interface InitialState {
  readonly selectedId: string;
  readonly activationMode?: ActivationMode;
  readonly orientation?: Orientation;
}

export function makeState(
  initial: InitialState,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make({
    selectedId: initial.selectedId,
    activationMode: initial.activationMode ?? "automatic",
    orientation: initial.orientation ?? "horizontal",
  });
}

export function select(
  state: RefSubject.RefSubject<State>,
  selectedId: string,
): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, selectedId }));
}

export function List<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: Content;
  readonly id?: Renderable<string, any, any>;
  readonly label?: Renderable<string, any, any>;
}) {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  return html`<div
    id=${options.id}
    role="tablist"
    aria-label=${options.label}
    aria-orientation=${orientation}
  >${options.content}</div>`;
}

export function Tab<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: string;
  readonly panelId: string;
  readonly content: Content;
}) {
  const selected = isSelected(options.state, options.id);
  const onClick = EventHandler.make(() => select(options.state, options.id));
  const props = {
    id: options.id,
    type: "button",
    role: "tab",
    "aria-controls": options.panelId,
    "aria-selected": selected,
    tabindex: RefSubject.map(selected, (value) => value ? 0 : -1),
    "data-selected": selected,
    onclick: onClick,
  } as const;

  return html`<button ...${props}>${options.content}</button>`;
}

export function Panel<const Content extends Renderable.Any>(options: {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: string;
  readonly tabId: string;
  readonly content: Content;
}) {
  const selected = isSelected(options.state, options.tabId);
  const props = {
    id: options.id,
    role: "tabpanel",
    "aria-labelledby": options.tabId,
    "data-selected": selected,
  } as const;
  const hidden = RefSubject.map(selected, (value) => !value);

  return html`<div ...${props} ?hidden=${hidden}>${options.content}</div>`;
}

function isSelected(state: RefSubject.RefSubject<State>, id: string) {
  return RefSubject.map(state, (value) => value.selectedId === id);
}
