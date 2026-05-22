import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

export interface State<Value extends string = string> {
  readonly value: Value;
  readonly open: boolean;
  readonly activeId: string | null;
}

export interface InitialState<Value extends string = string> {
  readonly value?: Value;
  readonly open?: boolean;
  readonly activeId?: string | null;
}

export const data = DataAttr.schema({
  active: Schema.Boolean,
  open: Schema.Boolean,
  selected: Schema.Boolean,
});

type OptionalString = ReactiveValue<string | undefined, any, any>;
type RequiredString = ReactiveValue<string, any, any>;

export function makeState<Value extends string = string>(
  initial: InitialState<Value> = {},
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  return RefSubject.make({
    value: initial.value ?? ("" as Value),
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
  });
}

export function setOpen<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  open: boolean,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function setValue<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: Value,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, value }));
}

export interface InputOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly id?: OptionalString;
  readonly placeholder?: OptionalString;
}

export function Input<const Value extends string, const Opts extends InputOptions<Value>>(
  options: Opts,
): Component<Opts> {
  const value = RefSubject.map(options.state, (state) => state.value);
  const open = RefSubject.map(options.state, (state) => state.open);
  const activeDescendant = RefSubject.map(options.state, (state) => state.activeId ?? undefined);
  const onInput = EventHandler.make((event: ComboboxInputEvent) =>
    setValue(options.state, event.currentTarget.value as Value),
  );
  const onFocus = EventHandler.make(() => setOpen(options.state, true));

  return html`<input
    id=${options.id}
    role="combobox"
    aria-autocomplete="list"
    aria-expanded=${open}
    aria-activedescendant=${activeDescendant}
    placeholder=${options.placeholder}
    .value=${value}
    oninput=${onInput}
    onfocus=${onFocus}
  />`;
}

export interface LabelOptions {
  readonly content: Content;
  readonly for?: OptionalString;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  return html`<label for=${options.for}>${options.content}</label>`;
}

export interface PopupOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: Content;
  readonly role?: ReactiveValue<string | undefined, any, any>;
}

export function List<const Opts extends PopupOptions>(options: Opts): Component<Opts> {
  const open = dataOpen(options.state);
  return html`<div role=${options.role ?? "listbox"} .data=${{ open }}>${options.content}</div>`;
}

export function Popover<const Opts extends PopupOptions>(options: Opts): Component<Opts> {
  const open = dataOpen(options.state);
  return html`<div role=${options.role ?? "listbox"} popover="auto" .data=${{ open }}>
    ${options.content}
  </div>`;
}

export interface ItemOptions<Value extends string = string> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly id: RequiredString;
  readonly value: ReactiveValue<Value, any, any>;
  readonly content?: Content;
}

export function Item<const Value extends string, const Opts extends ItemOptions<Value>>(
  options: Opts,
): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const value = yield* makeRef(options.value);
    const selected = RefSubject.mapEffect(options.state, (state) =>
      Effect.map(value, (value) => state.value === value),
    );
    const active = RefSubject.mapEffect(options.state, (state) =>
      Effect.map(id, (id) => state.activeId === id),
    );
    const onClick = EventHandler.make(() =>
      Effect.gen(function* () {
        yield* setValue(options.state, yield* value);
        yield* setOpen(options.state, false);
      }),
    );

    return html`<div
      id=${id}
      role="option"
      aria-selected=${selected}
      data-active-item=${active}
      .data=${{ selected }}
      onclick=${onClick}
    >
      ${options.content ?? value}
    </div>`;
  });
}

export interface GroupOptions {
  readonly content: Content;
  readonly label?: OptionalString;
}

export function Group<const Opts extends GroupOptions>(options: Opts): Component<Opts> {
  return html`<div role="group" aria-label=${options.label}>${options.content}</div>`;
}

export function GroupLabel<const Opts extends { readonly content: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<span>${options.content}</span>`;
}

export function Row<const Opts extends { readonly content: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<div role="row">${options.content}</div>`;
}

export function Separator(): Component<{}> {
  return html`<div role="separator"></div>`;
}

export function Value<const Opts extends { readonly state: RefSubject.RefSubject<State> }>(
  options: Opts,
): Component<Opts> {
  return html`${RefSubject.map(options.state, (state) => state.value)}`;
}

export function Cancel<
  const Opts extends { readonly state: RefSubject.RefSubject<State>; readonly content: Content },
>(options: Opts): Component<Opts> {
  const onClick = EventHandler.make(() => setValue(options.state, ""));
  return html`<button type="button" onclick=${onClick}>${options.content}</button>`;
}

export function Disclosure<
  const Opts extends { readonly state: RefSubject.RefSubject<State>; readonly content: Content },
>(options: Opts): Component<Opts> {
  const open = RefSubject.map(options.state, (state) => state.open);
  const onClick = EventHandler.make(() =>
    Effect.flatMap(options.state, (state) => setOpen(options.state, !state.open)),
  );
  return html`<button type="button" aria-expanded=${open} onclick=${onClick}>
    ${options.content}
  </button>`;
}

export function ItemCheck<
  const Opts extends {
    readonly selected: ReactiveValue<boolean, any, any>;
    readonly content?: Content;
  },
>(options: Opts): Component<Opts> {
  return gen(function* () {
    const selected = yield* makeRef(options.selected);
    const hidden = RefSubject.map(selected, (value) => !value);
    return html`<span aria-hidden="true" ?hidden=${hidden}>${options.content ?? "✓"}</span>`;
  });
}

export function ItemValue<const Opts extends { readonly value: Content }>(
  options: Opts,
): Component<Opts> {
  return html`<span>${options.value}</span>`;
}

interface ComboboxInputEvent extends Event {
  readonly currentTarget: HTMLInputElement;
}

function dataOpen<Value extends string>(state: RefSubject.RefSubject<State<Value>>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, {
      active: false,
      open: value.open,
      selected: false,
    }).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}
