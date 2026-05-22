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

export type Mode = "auto" | "hint" | "manual";

export interface State<Value = unknown> {
  readonly id: string;
  readonly value: Value | null;
  readonly activeId: string | null;
  readonly open: boolean;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
  readonly mode: Mode;
}

export interface InitialState<Value = unknown> {
  readonly id: string;
  readonly value?: Value | null;
  readonly activeId?: string | null;
  readonly open?: boolean;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
  readonly mode?: Mode;
}

export interface Item<Value = unknown> extends Collection.Item<Value> {
  readonly value: Value;
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
  mode: Schema.Literals(["auto", "hint", "manual"]),
});

export const optionData = DataAttr.schema({
  active: Schema.Boolean,
  disabled: Schema.Boolean,
  selected: Schema.Boolean,
});

export function makeState<Value = unknown>(
  initial: InitialState<Value>,
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  const state: State<Value> = {
    id: initial.id,
    value: initial.value ?? null,
    activeId: initial.activeId ?? null,
    open: initial.open ?? false,
    orientation: initial.orientation ?? "vertical",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
    mode: initial.mode ?? "auto",
  };

  return RefSubject.make(state);
}

export function setOpen<Value>(
  state: RefSubject.RefSubject<State<Value>>,
  open: boolean,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function select<Value>(
  state: RefSubject.RefSubject<State<Value>>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, open: false, value }));
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

export interface TriggerOptions<Value = unknown> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts) {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="toggle"
    aria-haspopup="listbox"
    aria-expanded=${open}
    .data=${{ open }}
  >${options.content}</button>`;
}

export interface ContentOptions<Value = unknown> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
  readonly label?: RequiredString;
}

export function Content<const Opts extends ContentOptions>(options: Opts) {
  const id = RefSubject.map(options.state, (current) => current.id);
  const mode = dataMode(options.state);
  const open = dataOpen(options.state);
  const orientation = RefSubject.map(options.state, (current) => current.orientation);
  const activeDescendant = RefSubject.map(options.state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined
  );
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    setOpen(options.state, event.newState === "open"),
  );

  return html`<div
    id=${id}
    role="listbox"
    popover=${mode}
    aria-label=${options.label}
    aria-orientation=${orientation}
    aria-activedescendant=${activeDescendant}
    .data=${{ open }}
    ontoggle=${onToggle}
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
  const selected = RefSubject.map(options.state, (current) => current.value === options.value);
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

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
}

function dataOpen<Value>(state: RefSubject.RefSubject<State<Value>>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode<Value>(state: RefSubject.RefSubject<State<Value>>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
  );
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
