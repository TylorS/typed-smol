import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
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

export interface State extends Omit<Composite.State, "orientation"> {
  readonly orientation: "vertical";
  readonly value: string | null;
}
export interface InitialState {
  readonly value?: string | null;
  readonly activeId?: string | null;
  readonly loop?: boolean;
}
export const StateSchema = Schema.Struct({
  value: Schema.NullOr(Schema.String),
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, {
    value: initial.value ?? null,
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
  return RefSubject.update(state, (current) => ({ ...current, activeId: id, value }));
}

export function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const items = yield* collection;
    const activeId = Composite.moveActiveId(items, current, direction);
    const item = activeId === null ? undefined : items.find((item) => item.id === activeId);
    const next = yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId,
      value: item?.value ?? value.value,
    }));
    yield* Composite.focusActive({ state, collection });
    yield* Composite.scrollActive({ state, collection });
    return next;
  });
}

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly content: Renderable.Any;
  readonly label?: Renderable.Any<string | null | undefined>;
}
function rootProps<const Options extends RootOptions>(options: Options) {
  let typeahead: Composite.TypeaheadBuffer = { value: "", updatedAt: 0 };
  const onfocus = options.collection === undefined
    ? undefined
    : EventHandler.make(() =>
        Effect.gen(function* () {
          const current = yield* options.state;
          if (current.activeId !== null) return;
          const item = Composite.moveActiveItem(yield* options.collection!, current, "first");
          if (item?.value === undefined) return;
          yield* select(options.state, item.id, item.value);
          yield* Composite.focusActive({ state: options.state, collection: options.collection! });
          yield* Composite.scrollActive({ state: options.state, collection: options.collection! });
        }),
      );
  const onkeydown = options.collection === undefined
    ? undefined
    : EventHandler.make((event: KeyboardEvent) =>
        Effect.gen(function* () {
          const key = Composite.typeaheadKey(event);
          if (key !== null) {
            typeahead = Composite.updateTypeaheadBuffer(typeahead, key, Date.now());
            const id = Composite.typeaheadFrom(
              yield* options.collection!,
              typeahead.value,
              (yield* options.state).activeId,
            );
            if (id !== null) {
              event.preventDefault();
              const item = (yield* options.collection!).find((item) => item.id === id);
              if (item?.value !== undefined) yield* select(options.state, item.id, item.value);
              yield* Composite.focusActive({ state: options.state, collection: options.collection! });
            }
            return;
          }
          const direction = Composite.keyMove(event, { orientation: "vertical" });
          if (direction !== undefined) {
            event.preventDefault();
            yield* move(options.state, options.collection!, direction);
          }
        }),
      );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "listbox",
      "aria-label": property("label", undefined),
      "aria-activedescendant": Composite.activeDescendant(options.state),
      tabindex: 0,
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootProps<Options extends RootOptions> = ReturnType<ReturnType<typeof rootProps<Options>>>;
export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootProps<Options>>,
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
    RootProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootProps(options), options.content, (props, content) => {
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
  const register = options.collection === undefined
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
        options.disabled === true ? Effect.void : select(options.state, options.id, options.value),
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
