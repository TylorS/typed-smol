import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as DataAttr from "./DataAttr.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;
type OptionalBoolean = ReactiveValue<boolean | undefined, any, any>;

export interface State<Value extends string = string> {
  readonly value: Value | null;
  readonly activeId: string | null;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
}

export interface InitialState<Value extends string = string> {
  readonly value?: Value | null;
  readonly activeId?: string | null;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
}

export interface Item<Value extends string = string> extends Collection.Item<Value> {
  readonly value: Value;
}

export const optionData = DataAttr.schema({
  active: Schema.Boolean,
  disabled: Schema.Boolean,
  selected: Schema.Boolean,
});

export function makeState<Value extends string = string>(
  initial: InitialState<Value> = {},
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  const state: State<Value> = {
    value: initial.value ?? null,
    activeId: initial.activeId ?? null,
    orientation: initial.orientation ?? "vertical",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
  };

  return RefSubject.make(state);
}

export function select<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, value }));
}

export function move<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State<Value>> {
  return Effect.gen(function* () {
    const current = yield* state;
    const enabled = Collection.enabledItems(Collection.byDomOrder(items));
    const activeId = nextActiveId(enabled, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface RootOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function Root<const Opts extends RootOptions>(options: Opts): Component<Opts> {
  const orientation = RefSubject.map(options.state, (current) => current.orientation);
  const activeDescendant = RefSubject.map(options.state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
  );

  return html`<div
    id=${options.id}
    role="listbox"
    aria-label=${options.label}
    aria-orientation=${orientation}
    aria-activedescendant=${activeDescendant}
  >
    ${options.content}
  </div>`;
}

export interface OptionOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly id: RequiredString;
  readonly value: ReactiveValue<Value, any, any>;
  readonly content: AnyContent;
  readonly disabled?: OptionalBoolean;
}

export function Option<const Opts extends OptionOptions>(options: Opts): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const value = yield* makeRef(options.value);
    const disabledValue = yield* makeRef(options.disabled ?? false);
    const disabled = isDisabled(disabledValue);
    const active = isActive(options.state, id);
    const selected = isSelected(options.state, value);
    const onClick = EventHandler.make(() =>
      Effect.gen(function* () {
        if (yield* disabled) return;
        yield* select(options.state, yield* id, yield* value);
      }),
    );
    const props = {
      id,
      "data-value": value,
      role: "option",
      "aria-disabled": boolString(disabled),
      "aria-selected": selected,
      tabindex: RefSubject.mapEffect(options.state, (state) =>
        Effect.gen(function* () {
          const itemId = yield* id;
          const itemDisabled = yield* disabled;
          return state.virtualFocus || itemDisabled ? -1 : state.activeId === itemId ? 0 : -1;
        }),
      ),
      "data-active": dataActive(options.state, id, disabled),
      "data-disabled": boolString(disabled),
      "data-selected": dataSelected(options.state, value, disabled),
      onclick: onClick,
    } as const;

    return html`<div ...${props}>${options.content}</div>`;
  });
}

function isActive<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  id: RefSubject.Computed<string, any, any>,
) {
  return RefSubject.mapEffect(state, (current) => Effect.map(id, (id) => current.activeId === id));
}

function isSelected<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: RefSubject.Computed<Value, any, any>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(value, (value) => current.value === value),
  );
}

function dataActive<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  id: RefSubject.Computed<string, any, any>,
  disabled: RefSubject.Computed<boolean, any, any>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.gen(function* () {
      const itemId = yield* id;
      const itemDisabled = yield* disabled;
      const encoded = yield* DataAttr.encode(optionData, {
        active: current.activeId === itemId,
        disabled: itemDisabled,
        selected: false,
      });
      return encoded.active ?? "false";
    }),
  );
}

function dataSelected<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: RefSubject.Computed<Value, any, any>,
  disabled: RefSubject.Computed<boolean, any, any>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.gen(function* () {
      const itemValue = yield* value;
      const itemDisabled = yield* disabled;
      const encoded = yield* DataAttr.encode(optionData, {
        active: false,
        disabled: itemDisabled,
        selected: current.value === itemValue,
      });
      return encoded.selected ?? "false";
    }),
  );
}

function isDisabled(disabled: RefSubject.Computed<boolean | undefined, any, any>) {
  return RefSubject.map(disabled, (value) => value === true);
}

function boolString(value: RefSubject.Computed<boolean, any, any>) {
  return RefSubject.map(value, String);
}

function nextActiveId<Value extends string>(
  items: readonly Item<Value>[],
  state: State<Value>,
  direction: Composite.Move,
): string | null {
  if (items.length === 0) return null;
  if (direction === "first") return items[0]?.id ?? null;
  if (direction === "last") return items[items.length - 1]?.id ?? null;

  const index = Math.max(
    0,
    items.findIndex((item) => item.id === state.activeId),
  );
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;
  if (state.loop) return items[(next + items.length) % items.length]?.id ?? null;
  return items[Math.min(Math.max(next, 0), items.length - 1)]?.id ?? null;
}
