import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;

export type ActivationMode = "automatic" | "manual";
export type Orientation = "horizontal" | "vertical";

export interface State {
  readonly selectedId: string;
  readonly activeId: string;
  readonly activationMode: ActivationMode;
  readonly orientation: Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
}

export interface InitialState {
  readonly selectedId: string;
  readonly activeId?: string;
  readonly activationMode?: ActivationMode;
  readonly orientation?: Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
}

export function makeState(
  initial: InitialState,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make({
    selectedId: initial.selectedId,
    activeId: initial.activeId ?? initial.selectedId,
    activationMode: initial.activationMode ?? "automatic",
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
  });
}

export function select(
  state: RefSubject.RefSubject<State>,
  selectedId: string,
): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: selectedId, selectedId }));
}

export function move(
  state: RefSubject.RefSubject<State>,
  items: readonly Collection.Item[],
  direction: Composite.Move,
): Effect.Effect<State> {
  return Effect.gen(function* () {
    const current = yield* state;
    const enabled = Collection.enabledItems(Collection.byDomOrder(items));
    const activeId = nextActiveId(enabled, current, direction);
    return yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId: activeId ?? value.activeId,
      selectedId: value.activationMode === "automatic" && activeId !== null ? activeId : value.selectedId,
    }));
  });
}

export interface ListOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly items?: readonly Collection.Item[];
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function List<const Opts extends ListOptions>(options: Opts): Component<Opts> {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  const items = options.items;
  const onKeyDown =
    items === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const current = yield* options.state;
            const direction = Composite.keyMove(event, current);
            if (!direction) return;

            event.preventDefault();
            yield* move(options.state, items, direction);
          }),
        );
  return html`<div
    id=${options.id}
    role="tablist"
    aria-label=${options.label}
    aria-orientation=${orientation}
    onkeydown=${onKeyDown}
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

function nextActiveId(
  items: readonly Collection.Item[],
  state: State,
  direction: Composite.Move,
): string | null {
  if (items.length === 0) return null;
  if (direction === "first") return items[0]?.id ?? null;
  if (direction === "last") return items[items.length - 1]?.id ?? null;

  const index = Math.max(
    0,
    items.findIndex((item) => item.id === state.activeId),
  );
  const next = index + (direction === "next" ? 1 : -1);
  if (state.loop) return items[(next + items.length) % items.length]?.id ?? null;
  return items[Math.min(Math.max(next, 0), items.length - 1)]?.id ?? null;
}
