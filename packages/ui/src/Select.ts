/**
 * Select keeps popover visibility, active option, and selected value separate. A native button
 * targets manual-popover listbox content; keyboard movement and typeahead update active state
 * before selection closes the popover.
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

/**
 * Complete renderer-independent state for Select.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Select behavior without mounting or coupling the
 * state to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Select";` Extend the [Select.makeState
 * runnable setup](/reference/%40typed%2Fui%2FSelect%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes popup identity, selected value, open state, and
 * active option.
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
  readonly value: string | null;
  /**
   * Whether the associated native popover is open.
   * @since 1.0.0
   * @category models
   */
  readonly open: boolean;
}

const invokers = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  globalThis.Element
>();

/**
 * Initial Select values. The caller supplies id; value and activeId default null, open false, and
 * loop true.
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
 * Import with `import type { InitialState } from "@typed/ui/Select";` Extend the [Select.makeState
 * runnable setup](/reference/%40typed%2Fui%2FSelect%23makeState). Construct state with
 * `const initial: InitialState = { id: "timezone", value: null, open: false }; const state = yield* Select.makeState(initial)`.
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
  readonly value?: string | null;
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
 * Effect Schema used by makeState to encode, decode, and hydrate Select state.
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
 * import * as Select from "@typed/ui/Select";
 *
 * const decodeState = Schema.decodeUnknownEffect(Select.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
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

/**
 * Creates hydrated Select state. The caller supplies id; value and activeId default null, open
 * false, and loop true.
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
 * import * as Select from "@typed/ui/Select";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Select.makeState({ id: "timezone" });
 *     const collection = yield* Select.makeCollection();
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
    value: initial.value ?? null,
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

/**
 * Creates a scoped Collection for Select items.
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
 * import * as Select from "@typed/ui/Select";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Select.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Sets selected value and active id, then closes the popover.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Select's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { select } from "@typed/ui/Select";` Extend the [Select.makeState runnable
 * setup](/reference/%40typed%2Fui%2FSelect%23makeState). Inside the linked Effect program invoke
 * `yield* select(state, "utc", "UTC")`, then read state to observe selection and active focus
 * update together while the popup closes.
 * @since 1.0.0
 * @category combinators
 */
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

/**
 * Inputs accepted by Select.Trigger in addition to the shared DOM host options.
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
 * Import with `import type { TriggerOptions } from "@typed/ui/Select";` Extend the
 * [Select.makeState runnable setup](/reference/%40typed%2Fui%2FSelect%23makeState). A native
 * popover trigger accepts `const options: TriggerOptions = { state, content: "Choose timezone" }`.
 * @since 1.0.0
 * @category models
 */
export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function triggerProps<const Options extends TriggerOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const triggerId = RefSubject.map(options.state, (state) => `${state.id}-trigger`);
  const open = RefSubject.map(options.state, (state) => state.open);
  return () =>
    ({
      id: triggerId,
      type: "button",
      popovertarget: id,
      popovertargetaction: "toggle",
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      onkeydown: EventHandler.make((event: KeyboardEvent) => {
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        Dom.currentTarget<HTMLButtonElement>(event).click();
      }),
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

/**
 * Renders the native button that targets listbox popover content and opens it on ArrowDown.
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
 * Import with `import { Trigger } from "@typed/ui/Select";` Extend the [Select.makeState runnable
 * setup](/reference/%40typed%2Fui%2FSelect%23makeState). Replace the linked program's final
 * snapshot read with `Trigger({ state, content: "Choose timezone" })`; render that Fx before the
 * same Scope closes.
 * @since 1.0.0
 * @category components
 */
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

/**
 * Consumer-facing alias of the canonical Select component with identical behavior and lifetime.
 *
 * @remarks
 * ## Why
 *
 * The component applies the family behavior while leaving callers free to supply a custom host
 * through the shared DOM boundary.
 *
 * ## Ownership and lifetime
 *
 * The alias acquires nothing. Rendering it has exactly the canonical component's Scope and DOM
 * ownership contract.
 *
 * ## Example
 *
 * Import with `import { Select } from "@typed/ui/Select";` Extend the [Select.makeState runnable
 * setup](/reference/%40typed%2Fui%2FSelect%23makeState). Replace the linked program's final
 * snapshot read with `Select({ state, content: "Choose timezone" })`; render that Fx before the
 * same Scope closes.
 * @since 1.0.0
 * @category components
 */
export const Select = Trigger;

/**
 * Inputs accepted by Select.Content in addition to the shared DOM host options.
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
 * Import with `import type { ContentOptions } from "@typed/ui/Select";` Extend the
 * [Select.makeState runnable setup](/reference/%40typed%2Fui%2FSelect%23makeState). Enable listbox
 * movement with `const options: ContentOptions = { state, collection, content: "Timezones" }`.
 * @since 1.0.0
 * @category models
 */
export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
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

function contentProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const triggerId = RefSubject.map(options.state, (state) => `${state.id}-trigger`);
  let typeahead: Composite.TypeaheadBuffer = { value: "", updatedAt: 0 };
  let restoreInvokerFocus = false;
  const restoreFocus = Effect.gen(function* () {
    if (!restoreInvokerFocus) return;
    restoreInvokerFocus = false;
    yield* Composite.focusElement(invokers.get(options.state));
  });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
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
      "aria-labelledby": triggerId,
      popover: "manual",
      "aria-activedescendant": Composite.activeDescendant(options.state),
      onkeydown,
      ontoggle: EventHandler.make(
        Effect.fn(function* (event: Event) {
          const open = Dom.toggleState(event) === "open";
          const current = yield* options.state;
          if (current.open === open) {
            if (!open) yield* restoreFocus;
            return current;
          }
          const next = yield* RefSubject.update(options.state, (state) => ({ ...state, open }));
          if (!open) {
            yield* restoreFocus;
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

/**
 * Renders manual-popover listbox content and handles Arrow keys, Enter, Escape, and typeahead.
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
 * Import with `import { Content } from "@typed/ui/Select";` Extend the [Select.makeState runnable
 * setup](/reference/%40typed%2Fui%2FSelect%23makeState). Replace the linked program's final
 * snapshot read with `Content({ state, content: "Timezones" })`; render that Fx before the same
 * Scope closes.
 * @since 1.0.0
 * @category components
 */
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

/**
 * Inputs accepted by Select.Option in addition to the shared DOM host options.
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
 * Import with `import type { OptionOptions } from "@typed/ui/Select";` Extend the [Select.makeState
 * runnable setup](/reference/%40typed%2Fui%2FSelect%23makeState). A selectable option is
 * `const options: OptionOptions = { state, collection, id: "utc", value: "UTC", content: "UTC" }`.
 * @since 1.0.0
 * @category models
 */
export interface OptionOptions extends Dom.HostOptions<HTMLDivElement> {
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
      onclick:
        options.disabled === true ? Effect.void : select(options.state, options.id, options.value),
      onfocus:
        options.disabled === true
          ? Effect.void
          : RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id })),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type OptionProps<Options extends OptionOptions> = ReturnType<
  ReturnType<typeof optionProps<Options>>
>;

/**
 * Renders and optionally registers a selectable option; focus updates activeId and click selects
 * unless disabled.
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
 * Import with `import { Option } from "@typed/ui/Select";` Extend the [Select.makeState runnable
 * setup](/reference/%40typed%2Fui%2FSelect%23makeState). Replace the linked program's final
 * snapshot read with `Option({ state, id: "utc", value: "UTC", content: "UTC" })`; render that Fx
 * before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
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
