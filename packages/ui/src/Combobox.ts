import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as NativePopover from "./NativePopover.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

export interface State<Value extends string = string> {
  readonly id: string;
  readonly value: string;
  readonly open: boolean;
  readonly activeId: string | null;
  readonly filteredItems: readonly Item<Value>[];
}

export interface InitialState<Value extends string = string> {
  readonly id?: string;
  readonly value?: string;
  readonly open?: boolean;
  readonly activeId?: string | null;
}

export interface Item<Value extends string = string> extends Collection.Item<Value> {
  readonly value: Value;
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
  const state: State<Value> = {
    id: initial.id ?? "combobox-popover",
    value: initial.value ?? "",
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    filteredItems: [],
  };

  return RefSubject.make(state);
}

export function setOpen<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  open: boolean,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function setValue<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  value: string,
): Effect.Effect<State<Value>> {
  return RefSubject.update(state, (current) => ({ ...current, value }));
}

export function move<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State<Value>> {
  return Effect.gen(function* () {
    const current = yield* state;
    const enabled = Collection.enabledItems(Collection.byDomOrder(items));
    const activeId = nextActiveId(enabled, current.activeId, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId, open: true }));
  });
}

export function selectActive<Value extends string>(
  state: RefSubject.RefSubject<State<Value>>,
  items: readonly Item<Value>[],
): Effect.Effect<State<Value>> {
  return Effect.gen(function* () {
    const current = yield* state;
    const active = Collection.enabledItems(Collection.byDomOrder(items)).find(
      (item) => item.id === current.activeId,
    );
    if (!active) return current;
    return yield* RefSubject.update(state, (value) => ({
      ...value,
      value: active.value,
      open: false,
    }));
  });
}

export interface InputOptions<Value extends string = string> extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly items?: ReactiveValue<readonly Item<Value>[], any, any>;
  readonly id?: OptionalString;
  readonly placeholder?: OptionalString;
  readonly filter?: (item: Item<Value>, query: string) => boolean;
  readonly autocomplete?: "none" | "list" | "inline" | "both";
  readonly autoSelect?: boolean;
}

export function Input<const Value extends string, const Opts extends InputOptions<Value>>(
  options: Opts,
): Component<Opts> {
  return gen(function* () {
    const items = options.items === undefined ? undefined : yield* makeRef(options.items);
    const value = RefSubject.map(options.state, (state) => state.value);
    const popupId = RefSubject.map(options.state, (state) => state.id);
    const open = RefSubject.map(options.state, (state) => state.open);
    const activeDescendant = RefSubject.map(options.state, (state) => state.activeId ?? undefined);
    const onInput = EventHandler.make((event: ComboboxInputEvent) =>
      Effect.gen(function* () {
        const query = event.currentTarget.value;
        if (!items) {
          yield* setValue(options.state, query);
          return;
        }

        const filteredItems = filterItems(yield* items, query, options.filter);
        const active = options.autoSelect === true ? filteredItems[0] : undefined;
        const nextValue =
          active && (options.autocomplete === "inline" || options.autocomplete === "both")
            ? active.value
            : query;
        yield* RefSubject.update(options.state, (state) => ({
          ...state,
          activeId: active?.id ?? null,
          filteredItems,
          open: true,
          value: nextValue,
        }));
      }),
    );
    const onFocus = EventHandler.make(() => setOpen(options.state, true));
    const onKeyDown =
      items === undefined
        ? undefined
        : EventHandler.make((event: KeyboardEvent) =>
            Effect.gen(function* () {
              const currentItems = yield* items;
              const typeaheadId = Composite.typeaheadFromEvent(event, currentItems, (item) =>
                item.textValue ?? item.value,
              );
              if (typeaheadId) {
                yield* RefSubject.update(options.state, (state) => ({
                  ...state,
                  activeId: typeaheadId,
                  open: true,
                }));
                return;
              }

            if (event.key === "Enter") {
              event.preventDefault();
              yield* selectActive(options.state, currentItems);
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              yield* setOpen(options.state, false);
              return;
            }

            const direction = Composite.keyMove(event, {
              orientation: "vertical",
              rtl: false,
            });
            if (!direction) return;

            event.preventDefault();
            yield* move(options.state, currentItems, direction);
          }),
        );

    const props = Dom.mergeProps(options.props, {
      id: options.id,
      role: "combobox",
      "aria-autocomplete": ariaAutocomplete(options.autocomplete),
      "aria-controls": popupId,
      "aria-expanded": open,
      "aria-activedescendant": activeDescendant,
      placeholder: options.placeholder,
      ".value": value,
      oninput: onInput,
      onfocus: onFocus,
      onkeydown: onKeyDown,
    });

    if (options.host) return options.host(props, "") as Component<Opts>;

    return html`<input
      id=${options.id}
      role="combobox"
      aria-autocomplete=${ariaAutocomplete(options.autocomplete)}
      aria-controls=${popupId}
      aria-expanded=${open}
      aria-activedescendant=${activeDescendant}
      placeholder=${options.placeholder}
      .value=${value}
      oninput=${onInput}
      onfocus=${onFocus}
      onkeydown=${onKeyDown}
    />`;
  });
}

export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  readonly content: Content;
  readonly for?: OptionalString;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  if (options.host) return options.host(Dom.mergeProps(options.props, { for: options.for }), options.content) as Component<Opts>;
  return html`<label for=${options.for}>${options.content}</label>`;
}

export interface PopupOptions<Value extends string = string> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>>;
  readonly content: Content;
  readonly role?: ReactiveValue<string | undefined, any, any>;
}

export function List<const Opts extends PopupOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = dataOpen(options.state);
  if (options.host) {
    return options.host(
      Dom.mergeProps(options.props, { id, role: options.role ?? "listbox", ".data": { open } }),
      options.content,
    ) as Component<Opts>;
  }
  return html`<div id=${id} role=${options.role ?? "listbox"} .data=${{ open }}>${options.content}</div>`;
}

export function Popover<const Opts extends PopupOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = dataOpen(options.state);
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    NativePopover.syncToggle(options.state, event),
  );
  const props = Dom.mergeProps(options.props, {
    id,
    role: options.role ?? "listbox",
    popover: "auto",
    ".data": { open },
    ontoggle: onToggle,
    ref: NativePopover.register(options.state),
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<div
    id=${id}
    role=${options.role ?? "listbox"}
    popover="auto"
    .data=${{ open }}
    ontoggle=${onToggle}
    ref=${NativePopover.register(options.state)}
  >
    ${options.content}
  </div>`;
}

export interface ItemOptions<Value extends string = string> extends Dom.HostOptions<HTMLDivElement> {
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

    const props = Dom.mergeProps(options.props, {
      id,
      role: "option",
      "aria-selected": selected,
      "data-active-item": active,
      ".data": { selected },
      onclick: onClick,
    });
    const content = options.content ?? value;
    if (options.host) return options.host(props, content) as Component<Opts>;
    return html`<div ...${props}>${content}</div>`;
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

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
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

function nextActiveId<Value extends string>(
  items: readonly Item<Value>[],
  activeId: string | null,
  direction: Composite.Move,
): string | null {
  if (items.length === 0) return null;
  if (direction === "first") return items[0]?.id ?? null;
  if (direction === "last") return items[items.length - 1]?.id ?? null;
  if (activeId === null) {
    return direction === "previous" ? items[items.length - 1]?.id ?? null : items[0]?.id ?? null;
  }

  const index = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );
  const next = index + (direction === "next" ? 1 : -1);
  return items[(next + items.length) % items.length]?.id ?? null;
}

function filterItems<Value extends string>(
  items: readonly Item<Value>[],
  query: string,
  filter: ((item: Item<Value>, query: string) => boolean) | undefined,
): readonly Item<Value>[] {
  const predicate =
    filter ??
    ((item: Item<Value>, value: string) =>
      (item.textValue ?? item.value).toLocaleLowerCase().startsWith(value.toLocaleLowerCase()));
  return items.filter((item) => predicate(item, query));
}

function ariaAutocomplete(value: InputOptions["autocomplete"]): string {
  return value ?? "list";
}
