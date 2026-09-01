/**
 * Combobox keeps focus on its native input and exposes the active option through
 * aria-activedescendant. Input, a manual native popover, and options share explicit value, open,
 * and active state.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * @since 1.0.0
 * @category modules
 * @packageDocumentation
 */
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
import * as NativePopover from "./NativePopover.js";

/**
 * Complete renderer-independent state for Combobox.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Combobox behavior without mounting or coupling the
 * state to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Combobox";` Extend the [Combobox.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCombobox%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes the current id, value, open state, and composite
 * focus state.
 * @since 1.0.0
 * @category models
 */
export interface State extends Omit<Composite.State, "orientation"> {
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category models
   */
  readonly orientation: "vertical";
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category models
   */
  readonly id: string;
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category models
   */
  readonly value: string;
  /**
   * Whether the associated native popover is open.
   * @since 1.0.0
   * @category models
   */
  readonly open: boolean;
}

/**
 * Initial Combobox values. value defaults to an empty string, open to false, activeId to null,
 * loop to true, and virtual focus is enabled.
 *
 * @remarks
 * ## Why
 *
 * Making initialization explicit documents hydration-sensitive defaults and lets servers and
 * clients construct matching state.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { InitialState } from "@typed/ui/Combobox";` Extend the
 * [Combobox.makeState runnable setup](/reference/%40typed%2Fui%2FCombobox%23makeState). Construct
 * state with
 * `const initial: InitialState = { id: "city", value: "", open: false }; const state = yield* Combobox.makeState(initial)`.
 * @since 1.0.0
 * @category models
 */
export interface InitialState {
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category models
   */
  readonly id: string;
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category models
   */
  readonly value?: string;
  /**
   * Whether the associated native popover is open.
   * @since 1.0.0
   * @category models
   */
  readonly open?: boolean;
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category models
   */
  readonly activeId?: string | null;
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category models
   */
  readonly loop?: boolean;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate Combobox state.
 *
 * @remarks
 * ## Why
 *
 * A public schema makes hydration and serialized state use the same runtime validation as direct
 * construction.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Combobox from "@typed/ui/Combobox";
 *
 * const decodeState = Schema.decodeUnknownEffect(Combobox.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
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

/**
 * Creates hydrated Combobox state. value defaults to an empty string, open to false, activeId to
 * null, loop to true, and virtual focus is enabled.
 *
 * @remarks
 * ## Why
 *
 * State and collection ownership can be composed and tested independently from any renderer.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Combobox from "@typed/ui/Combobox";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Combobox.makeState({ id: "city" });
 *     const collection = yield* Combobox.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
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

/**
 * Creates a scoped Collection for Combobox items.
 *
 * @remarks
 * ## Why
 *
 * State and collection ownership can be composed and tested independently from any renderer.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Combobox from "@typed/ui/Combobox";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Combobox.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Stores the input value, clears activeId, and opens the popup in one state update.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Combobox's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { setValue } from "@typed/ui/Combobox";` Extend the [Combobox.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCombobox%23makeState). Inside the linked Effect
 * program invoke `yield* setValue(state, "New York")`, then read state to observe that value,
 * `activeId: null`, and `open: true`.
 * @since 1.0.0
 * @category combinators
 */
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
    const item =
      collection === undefined
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
    const item =
      activeId === null ? undefined : (yield* collection).find((item) => item.id === activeId);
    return item?.value === undefined ? yield* state : yield* select(state, item.id, item.value);
  });
}

/**
 * Inputs accepted by Combobox.Input in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The options type makes required state, content, accessible relationships, and custom-host inputs
 * visible before rendering.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { InputOptions } from "@typed/ui/Combobox";` Extend the
 * [Combobox.makeState runnable setup](/reference/%40typed%2Fui%2FCombobox%23makeState). Enable
 * collection-driven keys with
 * `const options: InputOptions = { state, collection, placeholder: "Choose a city" }`.
 * @since 1.0.0
 * @category models
 */
export interface InputOptions extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category models
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Native input placeholder text.
   * @since 1.0.0
   * @category models
   */
  readonly placeholder?: string;
}

function inputProps<const Options extends InputOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const inputId = RefSubject.map(options.state, (state) => `${state.id}-input`);
  const open = RefSubject.map(options.state, (state) => state.open);
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const direction =
              event.key === "ArrowDown" ? "next" : event.key === "ArrowUp" ? "previous" : undefined;
            if (direction !== undefined) {
              event.preventDefault();
              if (!(yield* options.state).open) {
                yield* openPopover(options.state, options.collection!);
              }
              yield* move(options.state, options.collection!, direction);
              yield* Composite.scrollActive({
                state: options.state,
                collection: options.collection!,
              });
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
  return () =>
    ({
      id: inputId,
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-controls": id,
      "aria-expanded": open,
      "aria-activedescendant": Composite.activeDescendant(options.state),
      placeholder: options.placeholder,
      ".value": RefSubject.map(options.state, (state) => state.value),
      oninput: EventHandler.make(
        Effect.fn((event: Event) =>
          setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).value),
        ),
      ),
      onfocus: openPopover(options.state, options.collection),
      onkeydown,
    }) as const;
}

function visibleItems(collection: Collection.State<string>): readonly Collection.Item<string>[] {
  return Collection.byDomOrder(collection).filter(
    (item) => item.element === undefined || item.element.closest("[hidden]") === null,
  );
}
type InputProps<Options extends InputOptions> = ReturnType<ReturnType<typeof inputProps<Options>>>;

/**
 * Renders the native combobox input, keeps its value property synchronized, opens on focus, and
 * handles Arrow, Enter, and Escape when a collection is supplied.
 *
 * @remarks
 * ## Why
 *
 * The component applies the family behavior while leaving callers free to supply a custom host
 * through the shared DOM boundary.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * ## Example
 *
 * Import with `import { Input } from "@typed/ui/Combobox";` Extend the [Combobox.makeState runnable
 * setup](/reference/%40typed%2Fui%2FCombobox%23makeState). Replace the linked program's final
 * snapshot read with `Input({ state, placeholder: "Choose a city" })`; render that Fx before the
 * same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Input<const Options extends InputOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLInputElement>()<Options, InputProps<Options>, "", HostResult, Host>(
    options,
    host,
    inputProps(options),
    "",
    (props) => html`<input ...${props} />`,
  );
}

/**
 * Inputs accepted by Combobox.Popover in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The options type makes required state, content, accessible relationships, and custom-host inputs
 * visible before rendering.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { PopoverOptions } from "@typed/ui/Combobox";` Extend the
 * [Combobox.makeState runnable setup](/reference/%40typed%2Fui%2FCombobox%23makeState). The popup
 * input is `const options: PopoverOptions = { state, collection, content: "Cities" }`.
 * @since 1.0.0
 * @category models
 */
export interface PopoverOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category models
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function popoverProps<const Options extends PopoverOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const inputId = RefSubject.map(options.state, (state) => `${state.id}-input`);
  return () =>
    ({
      id,
      role: "listbox",
      "aria-labelledby": inputId,
      popover: "manual",
      ontoggle: EventHandler.make(
        Effect.fn(function* (event: Event) {
          const open = Dom.toggleState(event) === "open";
          const current = yield* options.state;
          if (current.open === open) return current;
          const next = yield* RefSubject.update(options.state, (state) => ({ ...state, open }));
          if (!open || options.collection === undefined) return next;
          const item = (yield* options.collection).find((item) => item.value === next.value);
          if (item === undefined) return next;
          const selected = yield* RefSubject.update(options.state, (state) => ({
            ...state,
            activeId: item.id,
          }));
          yield* Composite.scrollActive({ state: options.state, collection: options.collection });
          return selected;
        }),
      ),
      ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
    }) as const;
}
type PopoverProps<Options extends PopoverOptions> = ReturnType<
  ReturnType<typeof popoverProps<Options>>
>;

/**
 * Renders manual-popover listbox content, mirrors native toggle events into open state, and
 * scrolls the selected option when opened.
 *
 * @remarks
 * ## Why
 *
 * The component applies the family behavior while leaving callers free to supply a custom host
 * through the shared DOM boundary.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * ## Example
 *
 * Import with `import { Popover } from "@typed/ui/Combobox";` Extend the [Combobox.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCombobox%23makeState). Replace the linked program's
 * final snapshot read with `Popover({ state, content: "Cities" })`; render that Fx before the same
 * Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Popover<
  const Options extends PopoverOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, PopoverProps<Options>>,
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
    PopoverProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, popoverProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by Combobox.Item in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The options type makes required state, content, accessible relationships, and custom-host inputs
 * visible before rendering.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { ItemOptions } from "@typed/ui/Combobox";` Extend the
 * [Combobox.makeState runnable setup](/reference/%40typed%2Fui%2FCombobox%23makeState). A
 * selectable choice is
 * `const options: ItemOptions = { state, collection, id: "nyc", value: "New York", content: "New York" }`.
 * @since 1.0.0
 * @category models
 */
export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category models
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category models
   */
  readonly id: string;
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category models
   */
  readonly value: string;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
  /**
   * Search text used by typeahead independently of rendered markup.
   * @since 1.0.0
   * @category models
   */
  readonly textValue?: string;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category models
   */
  readonly disabled?: boolean;
}

function itemProps<const Options extends ItemOptions>(options: Options) {
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
      onclick:
        options.disabled === true ? Effect.void : select(options.state, options.id, options.value),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemProps<Options extends ItemOptions> = ReturnType<ReturnType<typeof itemProps<Options>>>;

/**
 * Renders and optionally registers one option; disabled options expose aria-disabled and do not
 * select on click.
 *
 * @remarks
 * ## Why
 *
 * The component applies the family behavior while leaving callers free to supply a custom host
 * through the shared DOM boundary.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * ## Example
 *
 * Import with `import { Item } from "@typed/ui/Combobox";` Extend the [Combobox.makeState runnable
 * setup](/reference/%40typed%2Fui%2FCombobox%23makeState). Replace the linked program's final
 * snapshot read with `Item({ state, id: "nyc", value: "New York", content: "New York" })`; render
 * that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ItemProps<Options>>,
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
    ItemProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    itemProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
