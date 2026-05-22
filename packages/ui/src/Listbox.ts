import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, type Renderable, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as DataAttr from "./DataAttr.js";

type AnyContent = Renderable<unknown, unknown, unknown>;
type RequiredString = Renderable<string, unknown, unknown>;

export interface State<Value = unknown> {
  readonly value: Value | null;
  readonly activeId: string | null;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
}

export interface InitialState<Value = unknown> {
  readonly value?: Value | null;
  readonly activeId?: string | null;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
}

export interface Item<Value = unknown> extends Collection.Item<Value> {
  readonly value: Value;
}

export const optionData = DataAttr.schema({
  active: Schema.Boolean,
  disabled: Schema.Boolean,
  selected: Schema.Boolean,
});

export function makeState<Value = unknown>(
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

export function select<Value>(
  state: RefSubject.RefSubject<State<Value>>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, value }));
}

export function move<Value>(
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

export interface RootOptions<Value = unknown> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
  readonly id?: RequiredString;
  readonly label?: RequiredString;
}

export function Root<const Opts extends RootOptions>(options: Opts) {
  const orientation = RefSubject.map(options.state, (current) => current.orientation);
  const activeDescendant = RefSubject.map(options.state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined
  );

  return html`<div
    id=${options.id}
    role="listbox"
    aria-label=${options.label}
    aria-orientation=${orientation}
    aria-activedescendant=${activeDescendant}
  >${options.content}</div>`;
}

export interface OptionOptions<Value = unknown> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly id: string;
  readonly value: Value;
  readonly content: AnyContent;
  readonly disabled?: boolean;
}

export function Option<const Opts extends OptionOptions>(options: Opts) {
  const disabled = options.disabled === true;
  const active = isActive(options.state, options.id);
  const selected = isSelected(options.state, options.value);
  const onClick = EventHandler.make(() =>
    disabled ? Effect.void : select(options.state, options.id, options.value),
  );
  const props = {
    id: options.id,
    role: "option",
    "aria-disabled": String(disabled),
    "aria-selected": selected,
    tabindex: RefSubject.map(options.state, (state) =>
      state.virtualFocus || disabled ? -1 : state.activeId === options.id ? 0 : -1
    ),
    "data-active": dataActive(options.state, options.id, disabled),
    "data-disabled": String(disabled),
    "data-selected": dataSelected(options.state, options.value, disabled),
    onclick: onClick,
  } as const;

  return html`<div ...${props}>${options.content}</div>`;
}

function isActive<Value>(state: RefSubject.RefSubject<State<Value>>, id: string) {
  return RefSubject.map(state, (current) => current.activeId === id);
}

function isSelected<Value>(state: RefSubject.RefSubject<State<Value>>, value: Value) {
  return RefSubject.map(state, (current) => current.value === value);
}

function dataActive<Value>(
  state: RefSubject.RefSubject<State<Value>>,
  id: string,
  disabled: boolean,
) {
  return RefSubject.mapEffect(state, (current) =>
    DataAttr.encode(optionData, {
      active: current.activeId === id,
      disabled,
      selected: false,
    }).pipe(Effect.map((encoded) => encoded.active ?? "false")),
  );
}

function dataSelected<Value>(
  state: RefSubject.RefSubject<State<Value>>,
  value: Value,
  disabled: boolean,
) {
  return RefSubject.mapEffect(state, (current) =>
    DataAttr.encode(optionData, {
      active: false,
      disabled,
      selected: current.value === value,
    }).pipe(Effect.map((encoded) => encoded.selected ?? "false")),
  );
}

function nextActiveId<Value>(
  items: readonly Item<Value>[],
  state: State<Value>,
  direction: Composite.Move,
): string | null {
  if (items.length === 0) return null;
  if (direction === "first") return items[0]?.id ?? null;
  if (direction === "last") return items[items.length - 1]?.id ?? null;

  const index = Math.max(0, items.findIndex((item) => item.id === state.activeId));
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;
  if (state.loop) return items[(next + items.length) % items.length]?.id ?? null;
  return items[Math.min(Math.max(next, 0), items.length - 1)]?.id ?? null;
}
