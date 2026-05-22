import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, type Renderable, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as DataAttr from "./DataAttr.js";
import { toEffect } from "./internal/renderable.js";

type AnyContent = Renderable<unknown, any, any>;
type RequiredString = Renderable<string, any, any>;
type OptionalBoolean = Renderable<boolean | undefined, any, any>;

export type Mode = "auto" | "hint" | "manual";

export interface State {
  readonly id: string;
  readonly open: boolean;
  readonly activeId: string | null;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
  readonly mode: Mode;
}

export interface InitialState {
  readonly id: string;
  readonly open?: boolean;
  readonly activeId?: string | null;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
  readonly mode?: Mode;
}

export interface Item<Value = unknown> extends Collection.Item<Value> {}

export const data = DataAttr.schema({
  open: Schema.Boolean,
  mode: Schema.Literals(["auto", "hint", "manual"]),
});

export const itemData = DataAttr.schema({
  active: Schema.Boolean,
  disabled: Schema.Boolean,
});

export function makeState(
  initial: InitialState,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make({
    id: initial.id,
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: initial.orientation ?? "vertical",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
    mode: initial.mode ?? "auto",
  });
}

export function setOpen(
  state: RefSubject.RefSubject<State>,
  open: boolean,
): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function setActive(
  state: RefSubject.RefSubject<State>,
  activeId: string | null,
): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

export function move<Value>(
  state: RefSubject.RefSubject<State>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State> {
  return Effect.gen(function* () {
    const current = yield* state;
    const enabled = Collection.enabledItems(Collection.byDomOrder(items));
    const activeId = nextActiveId(enabled, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface TriggerOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts) {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="toggle"
    aria-haspopup="menu"
    aria-expanded=${open}
    .data=${{ open }}
  >${options.content}</button>`;
}

export interface ContentOptions {
  readonly state: RefSubject.RefSubject<State>;
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
    role="menu"
    popover=${mode}
    aria-label=${options.label}
    aria-orientation=${orientation}
    aria-activedescendant=${activeDescendant}
    .data=${{ open }}
    ontoggle=${onToggle}
  >${options.content}</div>`;
}

export interface ItemOptions {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: RequiredString;
  readonly content: AnyContent;
  readonly disabled?: OptionalBoolean;
}

export function Item<const Opts extends ItemOptions>(options: Opts) {
  const active = isActive(options.state, options.id);
  const disabled = isDisabled(options.disabled);
  const props = {
    id: options.id,
    role: "menuitem",
    "aria-disabled": boolString(disabled),
    tabindex: RefSubject.mapEffect(options.state, (state) =>
      Effect.gen(function* () {
        const id = yield* toEffect(options.id);
        const disabled = yield* isDisabled(options.disabled);
        return state.activeId === id && !disabled ? 0 : -1;
      })
    ),
    "data-active": dataActive(options.state, options.id, options.disabled),
    "data-disabled": boolString(disabled),
  } as const;

  return html`<div ...${props}>${options.content}</div>`;
}

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
}

function isActive(state: RefSubject.RefSubject<State>, id: RequiredString) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(toEffect(id), (id) => current.activeId === id)
  );
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

function dataActive(
  state: RefSubject.RefSubject<State>,
  id: RequiredString,
  disabled: OptionalBoolean | undefined,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.gen(function* () {
      const itemId = yield* toEffect(id);
      const itemDisabled = yield* isDisabled(disabled);
      const encoded = yield* DataAttr.encode(itemData, {
        active: current.activeId === itemId,
        disabled: itemDisabled,
      });
      return encoded.active ?? "false";
    })
  );
}

function isDisabled(disabled: OptionalBoolean | undefined): Effect.Effect<boolean, any, any> {
  return Effect.map(toEffect(disabled ?? false), (value) => value === true);
}

function boolString(value: Effect.Effect<boolean, any, any>) {
  return Effect.map(value, String);
}

function nextActiveId<Value>(
  items: readonly Item<Value>[],
  state: State,
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
