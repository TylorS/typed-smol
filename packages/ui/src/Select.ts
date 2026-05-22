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

export type Mode = "auto" | "hint" | "manual";

export interface State<Value extends string = string> {
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

export interface InitialState<Value extends string = string> {
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

export interface Item<Value extends string = string> extends Collection.Item<Value> {
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

export function makeState<Value extends string = string>(
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

export function setOpen<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  open: boolean,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function select<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  activeId: string,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, activeId, open: false, value }));
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

export interface TriggerOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="toggle"
    aria-haspopup="listbox"
    aria-expanded=${open}
    .data=${{ open }}
  >
    ${options.content}
  </button>`;
}

export const Select = Trigger;

export interface ContentOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: AnyContent;
  readonly label?: RequiredString;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const mode = dataMode(options.state);
  const open = dataOpen(options.state);
  const orientation = RefSubject.map(options.state, (current) => current.orientation);
  const activeDescendant = RefSubject.map(options.state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
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
  >
    ${options.content}
  </div>`;
}

export const Popover = Content;
export const List = Content;

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

export const Item = Option;

export function Label<
  const Opts extends { readonly for?: RequiredString; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  return html`<label for=${options.for}>${options.content}</label>`;
}

export function Value<const Opts extends { readonly state: RefSubject.RefSubject<State> }>(
  options: Opts,
): Component<Opts> {
  return html`${RefSubject.map(options.state, (state) => state.value ?? "")}`;
}

export function Arrow<const Opts extends { readonly content?: AnyContent }>(
  options = {} as Opts,
): Component<Opts> {
  return html`<span aria-hidden="true">${options.content ?? "▾"}</span>`;
}

export function Dismiss<
  const Opts extends { readonly state: RefSubject.RefSubject<State>; readonly content: AnyContent },
>(options: Opts): Component<Opts> {
  const onClick = EventHandler.make(() => setOpen(options.state, false));
  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export function Group<
  const Opts extends { readonly content: AnyContent; readonly label?: RequiredString },
>(options: Opts): Component<Opts> {
  return html`<div role="group" aria-label=${options.label}>${options.content}</div>`;
}

export function GroupLabel<const Opts extends { readonly content: AnyContent }>(
  options: Opts,
): Component<Opts> {
  return html`<span>${options.content}</span>`;
}

export function Heading<
  const Opts extends { readonly content: AnyContent; readonly id?: RequiredString },
>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level="1">${options.content}</div>`;
}

export function ItemCheck<
  const Opts extends {
    readonly selected: ReactiveValue<boolean, any, any>;
    readonly content?: AnyContent;
  },
>(options: Opts): Component<Opts> {
  return gen(function* () {
    const selected = yield* makeRef(options.selected);
    const hidden = RefSubject.map(selected, (value) => !value);
    return html`<span aria-hidden="true" ?hidden=${hidden}>${options.content ?? "✓"}</span>`;
  });
}

export function Row<const Opts extends { readonly content: AnyContent }>(
  options: Opts,
): Component<Opts> {
  return html`<div role="row">${options.content}</div>`;
}

export function Separator(): Component<{}> {
  return html`<div role="separator"></div>`;
}

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
}

function dataOpen<Value extends string>(state: RefSubject.RefSubject<State<Value>>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode<Value extends string>(state: RefSubject.RefSubject<State<Value>>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
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

function isSelected<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: RefSubject.Computed<Value, any, any>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.map(value, (value) => current.value === value),
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
