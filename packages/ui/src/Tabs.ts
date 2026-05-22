import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;

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

export interface ListOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function List<const Opts extends ListOptions>(options: Opts): Component<Opts> {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  return html`<div
    id=${options.id}
    role="tablist"
    aria-label=${options.label}
    aria-orientation=${orientation}
  >
    ${options.content}
  </div>`;
}

export interface TabOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: RequiredString;
  readonly panelId: RequiredString;
  readonly content: AnyContent;
}

export function Tab<const Opts extends TabOptions>(options: Opts): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const panelId = yield* makeRef(options.panelId);
    const selected = isSelected(options.state, id);
    const onClick = EventHandler.make(() =>
      Effect.gen(function* () {
        yield* select(options.state, yield* id);
      }),
    );
    const props = {
      id,
      type: "button",
      role: "tab",
      "aria-controls": panelId,
      "aria-selected": selected,
      tabindex: RefSubject.map(selected, (value) => (value ? 0 : -1)),
      "data-selected": selected,
      onclick: onClick,
    } as const;

    return html`<button ...${props}>${options.content}</button>`;
  });
}

export interface PanelOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: RequiredString;
  readonly tabId: RequiredString;
  readonly content: AnyContent;
}

export function Panel<const Opts extends PanelOptions>(options: Opts): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const tabId = yield* makeRef(options.tabId);
    const selected = isSelected(options.state, tabId);
    const props = {
      id,
      role: "tabpanel",
      "aria-labelledby": tabId,
      "data-selected": selected,
    } as const;
    const hidden = RefSubject.map(selected, (value) => !value);

    return html`<div ...${props} ?hidden=${hidden}>${options.content}</div>`;
  });
}

function isSelected(
  state: RefSubject.RefSubject<State>,
  id: RefSubject.Computed<string, any, any>,
) {
  return RefSubject.mapEffect(state, (value) => Effect.map(id, (id) => value.selectedId === id));
}
