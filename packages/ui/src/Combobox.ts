import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativePopover from "./NativePopover.js";

export interface State extends Omit<Composite.State, "orientation"> {
  readonly orientation: "vertical";
  readonly id: string;
  readonly value: string;
  readonly open: boolean;
}

export interface InitialState {
  readonly id: string;
  readonly value?: string;
  readonly open?: boolean;
  readonly activeId?: string | null;
  readonly loop?: boolean;
}

export const StateSchema = Schema.Struct({
  id: Schema.String,
  value: Schema.String,
  open: Schema.Boolean,
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    id: initial.id,
    value: initial.value ?? "",
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: true,
  });
}

export const makeCollection = Collection.makeState<string>;

export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, value, activeId: null, open: true }));
}

function openPopover(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>> | undefined,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const item = collection === undefined
      ? undefined
      : visibleItems(yield* collection).find((item) => item.value === current.value);
    const next = yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId: item?.id ?? value.activeId,
      open: true,
    }));
    if (item !== undefined && collection !== undefined) {
      yield* Composite.scrollActive({ state, collection });
    }
    return next;
  });
}

function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const next = Composite.moveActiveId(visibleItems(yield* collection), yield* state, direction);
    if (next === null) return yield* state;
    return yield* RefSubject.update(state, (current) => ({ ...current, activeId: next }));
  });
}

function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
  value: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: id, value, open: false }));
}

function selectActive(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const activeId = (yield* state).activeId;
    const item = activeId === null ? undefined : (yield* collection).find((item) => item.id === activeId);
    return item?.value === undefined ? yield* state : yield* select(state, item.id, item.value);
  });
}

export interface InputOptions extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly placeholder?: string;
}

function inputProps<const Options extends InputOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => state.open);
  const onkeydown = options.collection === undefined ? undefined : EventHandler.make((event: KeyboardEvent) =>
    Effect.gen(function* () {
      const direction = event.key === "ArrowDown" ? "next" : event.key === "ArrowUp" ? "previous" : undefined;
      if (direction !== undefined) {
        event.preventDefault();
        yield* move(options.state, options.collection!, direction);
        yield* Composite.scrollActive({ state: options.state, collection: options.collection! });
        return;
      }
      if (event.key === "Enter") {
        if ((yield* options.state).activeId === null) return;
        event.preventDefault();
        yield* selectActive(options.state, options.collection!);
        return;
      }
      if (event.key === "Escape") {
        yield* RefSubject.update(options.state, (state) => ({ ...state, open: false }));
      }
    }),
  );
  return () => ({
    role: "combobox",
    "aria-autocomplete": "list",
    "aria-controls": id,
    "aria-expanded": open,
    "aria-activedescendant": Composite.activeDescendant(options.state),
    placeholder: options.placeholder,
    ".value": RefSubject.map(options.state, (state) => state.value),
    oninput: EventHandler.make((event: Event) => setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).value)),
    onfocus: EventHandler.make(() => openPopover(options.state, options.collection)),
    onkeydown,
  }) as const;
}

function visibleItems(
  collection: Collection.State<string>,
): readonly Collection.Item<string>[] {
  return Collection.byDomOrder(collection).filter(
    (item) => item.element === undefined || item.element.closest("[hidden]") === null,
  );
}
type InputProps<Options extends InputOptions> = ReturnType<ReturnType<typeof inputProps<Options>>>;

export function Input<const Options extends InputOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputProps<Options>>, "", Host>,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLInputElement>()<Options, InputProps<Options>, "", HostResult, Host>(
    options,
    host,
    inputProps(options),
    "",
    (props) => html`<input ...${props}>`,
  );
}

export interface PopoverOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly content: Renderable.Any;
}

function popoverProps<const Options extends PopoverOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  return () => ({
    id,
    role: "listbox",
    popover: "manual",
    ontoggle: EventHandler.make((event: Event) =>
      Effect.gen(function* () {
        const open = Dom.toggleState(event) === "open";
        const current = yield* options.state;
        if (current.open === open) return current;
        const next = yield* RefSubject.update(options.state, (state) => ({ ...state, open }));
        if (!open || options.collection === undefined) return next;
        const item = (yield* options.collection).find((item) => item.value === next.value);
        if (item === undefined) return next;
        const selected = yield* RefSubject.update(options.state, (state) => ({ ...state, activeId: item.id }));
        yield* Composite.scrollActive({ state: options.state, collection: options.collection });
        return selected;
      }),
    ),
    ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
  }) as const;
}
type PopoverProps<Options extends PopoverOptions> = ReturnType<ReturnType<typeof popoverProps<Options>>>;

export function Popover<const Options extends PopoverOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, PopoverProps<Options>>, Options["content"], Host>,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLDivElement>()<Options, PopoverProps<Options>, Options["content"], HostResult, Host>(
    options,
    host,
    popoverProps(options),
    options.content,
    (props, content) => {
      return html`<div ...${props}>${content}</div>`;
    },
  );
}

export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly id: string;
  readonly value: string;
  readonly content: Renderable.Any;
  readonly textValue?: string;
  readonly disabled?: boolean;
}

function itemProps<const Options extends ItemOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.value === options.value);
  const register = options.collection === undefined ? undefined : Collection.ref(options.collection, {
    id: options.id,
    value: options.value,
    textValue: options.textValue ?? options.value,
    disabled: options.disabled,
  });
  return () => ({
    id: options.id,
    role: "option",
    "aria-selected": selected,
    "aria-disabled": options.disabled ?? false,
    tabindex: Composite.tabIndex(options.state, options.id),
    onclick: EventHandler.make(() =>
      options.disabled === true ? Effect.void : select(options.state, options.id, options.value),
    ),
    ref: Dom.composeRefs(register, options.ref),
  }) as const;
}
type ItemProps<Options extends ItemOptions> = ReturnType<ReturnType<typeof itemProps<Options>>>;

export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, ItemProps<Options>>, Options["content"], Host>,
): Fx<RenderEvent, Renderable.Error<Options | Host>, Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate> {
  return Dom.renderHost<HTMLDivElement>()<Options, ItemProps<Options>, Options["content"], HostResult, Host>(
    options,
    host,
    itemProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
