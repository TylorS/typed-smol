import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
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

export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  selectedId: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: selectedId, selectedId }));
}

export function move<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  items: readonly Collection.Item[],
  direction: Composite.Move,
): Effect.Effect<State, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    return yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId: activeId ?? value.activeId,
      selectedId: value.activationMode === "automatic" && activeId !== null ? activeId : value.selectedId,
    }));
  });
}

export interface ListOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly content: AnyContent;
  readonly items?: readonly Collection.Item[];
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function List<const E, const R, const Opts extends ListOptions<E, R>>(
  options: Opts,
): Component<Opts> {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  const items = options.items;
  const onKeyDown =
    items === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const current = yield* options.state;
            const typeaheadId = Composite.typeaheadFromEvent(event, items);
            if (typeaheadId) {
              yield* RefSubject.update(options.state, (value) => ({
                ...value,
                activeId: typeaheadId,
                selectedId:
                  value.activationMode === "automatic" ? typeaheadId : value.selectedId,
              }));
              return;
            }

            const direction = Composite.keyMove(event, current);
            if (!direction) return;

            event.preventDefault();
            yield* move(options.state, items, direction);
          }),
        );
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    role: "tablist",
    "aria-label": options.label,
    "aria-orientation": orientation,
    onkeydown: onKeyDown,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;
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

export interface TabOptions<E = never, R = never> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id: RequiredString;
  readonly panelId: RequiredString;
  readonly content: AnyContent;
}

export function Tab<const E, const R, const Opts extends TabOptions<E, R>>(
  options: Opts,
): Component<Opts> {
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

    if (options.host) return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;
    return html`<button ...${props}>${options.content}</button>`;
  });
}

export interface PanelOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id: RequiredString;
  readonly tabId: RequiredString;
  readonly content: AnyContent;
}

export function Panel<const E, const R, const Opts extends PanelOptions<E, R>>(
  options: Opts,
): Component<Opts> {
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

    const mergedProps = Dom.mergeProps(options.props, { ...props, "?hidden": hidden });
    if (options.host) return options.host(mergedProps, options.content) as Component<Opts>;
    return html`<div ...${props} ?hidden=${hidden}>${options.content}</div>`;
  });
}

function isSelected<E, R, E2, R2>(
  state: RefSubject.RefSubject<State, E, R>,
  id: RefSubject.Computed<string, E2, R2>,
) {
  return RefSubject.mapEffect(state, (value) => Effect.map(id, (id) => value.selectedId === id));
}
