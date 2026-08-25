import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import {
  EventHandler,
  html,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativePopover from "./NativePopover.js";

export interface State extends Omit<Composite.State, "orientation"> {
  readonly orientation: "vertical";
  readonly id: string;
  readonly value: string | null;
  readonly open: boolean;
}

const invokers = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  globalThis.Element
>();

export interface InitialState {
  readonly id: string;
  readonly value?: string | null;
  readonly open?: boolean;
  readonly activeId?: string | null;
  readonly loop?: boolean;
}

export const StateSchema = Schema.Struct({
  id: Schema.String,
  value: Schema.NullOr(Schema.String),
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
    value: initial.value ?? null,
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

export const makeCollection = Collection.makeState<string>;

export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
  value: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: id, value, open: false }));
}

function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Composite.moveAndFocus({ state, collection }, direction);
}

function selectActive(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const activeId = (yield* state).activeId;
    const item =
      activeId === null ? undefined : (yield* collection).find((item) => item.id === activeId);
    return item?.value === undefined ? yield* state : yield* select(state, item.id, item.value);
  });
}

export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
}

function triggerProps<const Options extends TriggerOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => state.open);
  return () =>
    ({
      type: "button",
      popovertarget: id,
      popovertargetaction: "toggle",
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      onkeydown: EventHandler.make((event: KeyboardEvent) =>
        event.key === "ArrowDown"
          ? Effect.sync(() => {
              event.preventDefault();
              Dom.currentTarget<HTMLButtonElement>(event).click();
            })
          : Effect.void,
      ),
      ref: Dom.composeRefs(options.state, invokerRef(options.state)),
    }) as const;
}

function invokerRef(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
): (element: globalThis.Element) => Effect.Effect<void, never, Scope.Scope> {
  return Effect.fn(function* (element) {
    invokers.set(state, element);
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(
      scope,
      Effect.sync(() => {
        if (invokers.get(state) === element) invokers.delete(state);
      }),
    );
  });
}
type TriggerProps<Options extends TriggerOptions> = ReturnType<
  ReturnType<typeof triggerProps<Options>>
>;

export function Trigger<
  const Options extends TriggerOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, TriggerProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    TriggerProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    triggerProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export const Select = Trigger;

export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly content: Renderable.Any;
}

function contentProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  let typeahead: Composite.TypeaheadBuffer = { value: "", updatedAt: 0 };
  let restoreInvokerFocus = false;
  const restoreFocus = () =>
    Effect.gen(function* () {
      if (!restoreInvokerFocus) return;
      restoreInvokerFocus = false;
      yield* Composite.focusElement(invokers.get(options.state));
    });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const direction = Composite.keyMove(event, { orientation: "vertical" });
            if (direction !== undefined) {
              event.preventDefault();
              yield* move(options.state, options.collection!, direction);
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              yield* selectActive(options.state, options.collection!);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              restoreInvokerFocus = true;
              yield* setOpen(options.state, false);
              return;
            }
            const key = Composite.typeaheadKey(event);
            if (key === null) return;
            typeahead = Composite.updateTypeaheadBuffer(typeahead, key, Date.now());
            const activeId = Composite.typeaheadFrom(
              yield* options.collection!,
              typeahead.value,
              (yield* options.state).activeId,
            );
            if (activeId === null) return;
            event.preventDefault();
            yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
            yield* Composite.focusActive({ state: options.state, collection: options.collection! });
          }),
        );
  return () =>
    ({
      id,
      role: "listbox",
      popover: "manual",
      "aria-activedescendant": Composite.activeDescendant(options.state),
      onkeydown,
      ontoggle: EventHandler.make((event: Event) =>
        Effect.gen(function* () {
          const open = Dom.toggleState(event) === "open";
          const current = yield* options.state;
          if (current.open === open) {
            if (!open) yield* restoreFocus();
            return current;
          }
          const next = yield* RefSubject.update(options.state, (state) => ({ ...state, open }));
          if (!open) {
            yield* restoreFocus();
            return next;
          }
          if (options.collection === undefined) return next;
          const item = (yield* options.collection).find((item) => item.value === next.value);
          if (item === undefined) return next;
          const selected = yield* RefSubject.update(options.state, (state) => ({
            ...state,
            activeId: item.id,
          }));
          yield* Composite.focusActive({ state: options.state, collection: options.collection });
          yield* Composite.scrollActive({ state: options.state, collection: options.collection });
          return selected;
        }),
      ),
      ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
    }) as const;
}
type ContentProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentProps<Options>>
>;

export function Content<
  const Options extends ContentOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ContentProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    ContentProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, contentProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

export interface OptionOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly id: string;
  readonly value: string;
  readonly content: Renderable.Any;
  readonly textValue?: string;
  readonly disabled?: boolean;
}

function optionProps<const Options extends OptionOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.value === options.value);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.value,
          textValue: options.textValue ?? options.value,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      role: "option",
      "aria-selected": selected,
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick: EventHandler.make(() =>
        options.disabled === true ? Effect.void : select(options.state, options.id, options.value),
      ),
      onfocus: EventHandler.make(() =>
        options.disabled === true
          ? Effect.void
          : RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id })),
      ),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type OptionProps<Options extends OptionOptions> = ReturnType<
  ReturnType<typeof optionProps<Options>>
>;

export function Option<const Options extends OptionOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, OptionProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    OptionProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    optionProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}
