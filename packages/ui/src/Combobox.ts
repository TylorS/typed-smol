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
  readonly value?: Value;
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
  initial: InitialState<NoInfer<Value>> = {},
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

export function setOpen<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  open: boolean,
): Effect.Effect<State<Value>, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function setValue<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  value: string,
): Effect.Effect<State<Value>, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, value }));
}

export function move<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State<Value>, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, { activeId: current.activeId, loop: true }, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId, open: true }));
  });
}

export function selectActive<Value extends string, E, R>(
  state: RefSubject.RefSubject<State<Value>, E, R>,
  items: readonly Item<Value>[],
): Effect.Effect<State<Value>, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const active = Composite.orderedEnabledItems(items).find((item) => item.id === current.activeId);
    if (!active) return current;
    return yield* RefSubject.update(state, (value) => ({
      ...value,
      value: active.value,
      open: false,
    }));
  });
}

export interface InputOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly items?: ReactiveValue<readonly Item<Value>[], any, any>;
  readonly id?: OptionalString;
  readonly placeholder?: OptionalString;
  readonly filter?: (item: Item<Value>, query: string) => boolean;
  readonly autocomplete?: "none" | "list" | "inline" | "both";
  readonly autoSelect?: boolean;
}

export function Input<
  const Value extends string,
  const E,
  const R,
  const Opts extends InputOptions<Value, NoInfer<E>, NoInfer<R>>,
>(
  options: Opts & Pick<InputOptions<Value, E, R>, "state">,
): Component<Opts> {
  return gen(function* () {
    const items = options.items === undefined ? undefined : yield* makeRef(options.items);
    const props = Dom.mergeProps(options.props, inputProps(options, items));

    if (options.host) return options.host(props, "") as Component<Opts>;

    const split = Dom.splitRef(props);
    return html`<input ...${split.props} ref=${split.ref} />`;
  });
}

function inputProps<Value extends string, E, R, E2, R2>(
  options: InputOptions<Value, E, R>,
  items: RefSubject.Computed<readonly Item<Value>[], E2, R2> | undefined,
): Dom.HostProps<HTMLInputElement> {
  return {
    id: options.id,
    role: "combobox",
    "aria-autocomplete": ariaAutocomplete(options.autocomplete),
    "aria-controls": RefSubject.map(options.state, (state) => state.id),
    "aria-expanded": RefSubject.map(options.state, (state) => state.open),
    "aria-activedescendant": RefSubject.map(options.state, (state) => state.activeId ?? undefined),
    placeholder: options.placeholder,
    ".value": RefSubject.map(options.state, (state) => state.value),
    oninput: inputHandler(options, items),
    onfocus: EventHandler.make(() => setOpen(options.state, true)),
    onkeydown: keyDownHandler(options, items),
  };
}

function inputHandler<Value extends string, E, R, E2, R2>(
  options: InputOptions<Value, E, R>,
  items: RefSubject.Computed<readonly Item<Value>[], E2, R2> | undefined,
) {
  return EventHandler.make((event: ComboboxInputEvent) =>
    Effect.gen(function* () {
      const query = event.currentTarget.value;
      if (!items) return yield* setValue(options.state, query);
      return yield* updateQuery(options, yield* items, query);
    }),
  );
}

function keyDownHandler<Value extends string, E, R, E2, R2>(
  options: InputOptions<Value, E, R>,
  items: RefSubject.Computed<readonly Item<Value>[], E2, R2> | undefined,
) {
  if (!items) return undefined;
  return EventHandler.make((event: KeyboardEvent) =>
    Effect.gen(function* () {
      const currentItems = yield* items;
      if (yield* moveByTypeahead(options, currentItems, event)) return;
      yield* moveByKey(options, currentItems, event);
    }),
  );
}

function updateQuery<Value extends string, E, R>(
  options: InputOptions<Value, E, R>,
  items: readonly Item<Value>[],
  query: string,
): Effect.Effect<State<Value>, E, R> {
  const filteredItems = filterItems(items, query, options.filter);
  const active = options.autoSelect === true ? filteredItems[0] : undefined;
  return RefSubject.update(options.state, (state) => ({
    ...state,
    activeId: active?.id ?? null,
    filteredItems,
    open: true,
    value: autocompleteValue(query, active, options.autocomplete),
  }));
}

function moveByTypeahead<Value extends string, E, R>(
  options: InputOptions<Value, E, R>,
  items: readonly Item<Value>[],
  event: KeyboardEvent,
): Effect.Effect<boolean, E, R> {
  const activeId = Composite.typeaheadFromEvent(event, items, (item) => item.textValue ?? item.value);
  if (!activeId) return Effect.succeed(false);
  return RefSubject.update(options.state, (state) => ({ ...state, activeId, open: true })).pipe(
    Effect.as(true),
  );
}

function moveByKey<Value extends string, E, R>(
  options: InputOptions<Value, E, R>,
  items: readonly Item<Value>[],
  event: KeyboardEvent,
): Effect.Effect<void, E, R> {
  if (event.key === "Enter") return preventDefault(event, selectActive(options.state, items));
  if (event.key === "Escape") return preventDefault(event, setOpen(options.state, false));
  const direction = Composite.keyMove(event, { orientation: "vertical", rtl: false });
  return direction ? preventDefault(event, move(options.state, items, direction)) : Effect.void;
}

export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  readonly content: Content;
  readonly for?: OptionalString;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  if (options.host) return options.host(Dom.mergeProps(options.props, { for: options.for }), options.content) as Component<Opts>;
  return html`<label for=${options.for}>${options.content}</label>`;
}

export interface PopupOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly content: Content;
  readonly role?: ReactiveValue<string | undefined, any, any>;
}

export function List<
  const Value extends string,
  const E,
  const R,
  const Opts extends PopupOptions<Value, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<PopupOptions<Value, E, R>, "state">): Component<Opts> {
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

export function Popover<
  const Value extends string,
  const E,
  const R,
  const Opts extends PopupOptions<Value, NoInfer<E>, NoInfer<R>>,
>(options: Opts & Pick<PopupOptions<Value, E, R>, "state">): Component<Opts> {
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
  return Dom.renderDivHost<Opts>(props, options.content);
}

export interface ItemOptions<Value extends string = string, E = never, R = never>
  extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State<Value>, E, R>;
  readonly id: RequiredString;
  readonly value: ReactiveValue<Value, any, any>;
  readonly content?: Content;
}

export function Item<
  const Value extends string,
  const E,
  const R,
  const Opts extends ItemOptions<Value, NoInfer<E>, NoInfer<R>>,
>(
  options: Opts & Pick<ItemOptions<Value, E, R>, "state">,
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

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Content;
  readonly label?: OptionalString;
}

export function Group<const Opts extends GroupOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, { role: "group", "aria-label": options.label });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
}

export function GroupLabel<
  const Opts extends { readonly content: Content } & Dom.HostOptions<HTMLSpanElement>,
>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLSpanElement, Opts>(options, {}, options.content, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}

export function Row<
  const Opts extends { readonly content: Content } & Dom.HostOptions<HTMLDivElement>,
>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(options, { role: "row" }, options.content, (props, content) =>
    html`<div ...${props}>${content}</div>`,
  );
}

export function Separator<const Opts extends Dom.HostOptions<HTMLDivElement> = {}>(
  options = {} as Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLDivElement, Opts>(options, { role: "separator" }, "", (props) =>
    html`<div ...${props}></div>`,
  );
}

export function Value<
  const E,
  const R,
  const Opts extends {
    readonly state: RefSubject.RefSubject<State, NoInfer<E>, NoInfer<R>>;
  } & Dom.HostOptions<HTMLSpanElement>,
>(
  options: Opts & { readonly state: RefSubject.RefSubject<State, E, R> },
): Component<Opts> {
  const value = RefSubject.map(options.state, (state) => state.value);
  return Dom.renderHost<HTMLSpanElement, Opts>(options, {}, value, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}

export function Cancel<
  const E,
  const R,
  const Opts extends {
    readonly state: RefSubject.RefSubject<State, NoInfer<E>, NoInfer<R>>;
    readonly content: Content;
  } & Dom.HostOptions<HTMLButtonElement>,
>(options: Opts & { readonly state: RefSubject.RefSubject<State, E, R> }): Component<Opts> {
  const onClick = EventHandler.make(() => setValue(options.state, ""));
  return Dom.renderHost<HTMLButtonElement, Opts>(
    options,
    { type: "button", onclick: onClick },
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export function Disclosure<
  const E,
  const R,
  const Opts extends {
    readonly state: RefSubject.RefSubject<State, NoInfer<E>, NoInfer<R>>;
    readonly content: Content;
  } & Dom.HostOptions<HTMLButtonElement>,
>(options: Opts & { readonly state: RefSubject.RefSubject<State, E, R> }): Component<Opts> {
  const open = RefSubject.map(options.state, (state) => state.open);
  const onClick = EventHandler.make(() =>
    Effect.flatMap(options.state, (state) => setOpen(options.state, !state.open)),
  );
  return Dom.renderHost<HTMLButtonElement, Opts>(
    options,
    { type: "button", "aria-expanded": open, onclick: onClick },
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export function ItemCheck<
  const Opts extends {
    readonly selected: ReactiveValue<boolean, any, any>;
    readonly content?: Content;
  } & Dom.HostOptions<HTMLSpanElement>,
>(options: Opts): Component<Opts> {
  return gen(function* () {
    const selected = yield* makeRef(options.selected);
    const hidden = RefSubject.map(selected, (value) => !value);
    return Dom.renderHost<HTMLSpanElement, Opts>(
      options,
      { "aria-hidden": "true", "?hidden": hidden },
      options.content ?? "✓",
      (props, content) => html`<span ...${props}>${content}</span>`,
    );
  });
}

export function ItemValue<
  const Opts extends { readonly value: Content } & Dom.HostOptions<HTMLSpanElement>,
>(
  options: Opts,
): Component<Opts> {
  return Dom.renderHost<HTMLSpanElement, Opts>(options, {}, options.value, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}

interface ComboboxInputEvent extends Event {
  readonly currentTarget: HTMLInputElement;
}

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
}

function dataOpen<Value extends string, E, R>(state: RefSubject.RefSubject<State<Value>, E, R>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, {
      active: false,
      open: value.open,
      selected: false,
    }).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
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

function autocompleteValue<Value extends string>(
  query: string,
  active: Item<Value> | undefined,
  autocomplete: InputOptions["autocomplete"],
): string {
  return active && (autocomplete === "inline" || autocomplete === "both") ? active.value : query;
}

function ariaAutocomplete(value: InputOptions["autocomplete"]): string {
  return value ?? "list";
}

function preventDefault<A, E, R>(
  event: Event,
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<void, E, R> {
  event.preventDefault();
  return Effect.asVoid(effect);
}
