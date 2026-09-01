/**
 * RadioGroup keeps a selected value and active id in explicit state. Arrow movement skips disabled
 * registered items, updates selection, and moves focus; each item renders a real radio input with
 * ARIA state.
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

/**
 * Complete renderer-independent state for RadioGroup.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test RadioGroup behavior without mounting or coupling the
 * state to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/RadioGroup";` Extend the [RadioGroup.makeState
 * runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes the checked value and roving-focus id.
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
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category models
   */
  readonly value: string;
}

/**
 * Initial RadioGroup values. The caller supplies value; activeId defaults to that value and loop
 * defaults true.
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
 * Import with `import type { InitialState } from "@typed/ui/RadioGroup";` Extend the
 * [RadioGroup.makeState runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState).
 * Construct state with
 * `const initial: InitialState = { value: "email", activeId: "email" }; const state = yield* RadioGroup.makeState(initial)`.
 * @since 1.0.0
 * @category models
 */
export interface InitialState {
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category models
   */
  readonly value: string;
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
 * Effect Schema used by makeState to encode, decode, and hydrate RadioGroup state.
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
 * import * as RadioGroup from "@typed/ui/RadioGroup";
 *
 * const decodeState = Schema.decodeUnknownEffect(RadioGroup.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({
  value: Schema.String,
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

/**
 * Creates hydrated RadioGroup state. The caller supplies value; activeId defaults to that value
 * and loop defaults true.
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
 * import * as RadioGroup from "@typed/ui/RadioGroup";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* RadioGroup.makeState({ value: "email" });
 *     const collection = yield* RadioGroup.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    value: initial.value,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

/**
 * Creates a scoped Collection for RadioGroup items.
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
 * import * as RadioGroup from "@typed/ui/RadioGroup";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* RadioGroup.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Sets selected value and activeId to the same registered radio id.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes RadioGroup's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { setValue } from "@typed/ui/RadioGroup";` Extend the [RadioGroup.makeState
 * runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState). Inside the linked Effect
 * program invoke `yield* setValue(state, "phone", "phone")`, then read state to observe the checked
 * value and active roving-focus id update together.
 * @since 1.0.0
 * @category combinators
 */
export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: string,
  activeId?: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value,
    activeId: activeId ?? current.activeId,
  }));
}

function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const items = yield* collection;
    const activeId =
      current.activeId ?? items.find((item) => item.value === current.value)?.id ?? null;
    const nextId = Composite.moveActiveId(items, { ...current, activeId }, direction);
    const item = nextId === null ? undefined : items.find((item) => item.id === nextId);
    if (item?.value === undefined) return current;
    const next = yield* setValue(state, item.value, item.id);
    yield* Composite.focusActive({ state, collection });
    return next;
  });
}

/**
 * Inputs accepted by RadioGroup.Root in addition to the shared DOM host options.
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
 * Import with `import type { RootOptions } from "@typed/ui/RadioGroup";` Extend the
 * [RadioGroup.makeState runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState). Enable
 * Arrow-key selection with
 * `const options: RootOptions = { state, collection, label: "Contact method", content: "Choices" }`.
 * @since 1.0.0
 * @category models
 */
export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
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
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category models
   */
  readonly label?: Renderable.Any<string | null | undefined>;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const direction = Composite.keyMove(event, { orientation: "vertical" });
            if (direction === undefined) return;
            event.preventDefault();
            yield* move(options.state, options.collection!, direction);
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "radiogroup",
      "aria-label": property("label", undefined),
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

/**
 * Renders the radiogroup and maps Arrow keys to selection and focus movement.
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
 * Import with `import { Root } from "@typed/ui/RadioGroup";` Extend the [RadioGroup.makeState
 * runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState). Replace the linked program's
 * final snapshot read with `Root({ state, label: "Contact method", content: "Choices" })`; render
 * that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootInternalProps<Options>>,
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
    RootInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by RadioGroup.Item in addition to the shared DOM host options.
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
 * Import with `import type { ItemOptions } from "@typed/ui/RadioGroup";` Extend the
 * [RadioGroup.makeState runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState). A
 * native radio input is
 * `const options: ItemOptions = { state, collection, id: "email", value: "email", name: "contact" }`.
 * @since 1.0.0
 * @category models
 */
export interface ItemOptions extends Dom.HostOptions<HTMLInputElement> {
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
   * Native radio-group form name shared by related input items.
   * @since 1.0.0
   * @category models
   */
  readonly name?: string;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category models
   */
  readonly disabled?: boolean;
}

function itemInternalProps<const Options extends ItemOptions>(options: Options) {
  const checked = RefSubject.map(options.state, (state) => state.value === options.value);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.value,
          textValue: options.value,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      type: "radio",
      role: "radio",
      name: options.name,
      value: options.value,
      "?disabled": options.disabled ?? false,
      "aria-checked": checked,
      "aria-disabled": options.disabled ?? false,
      "?checked": checked,
      ".checked": checked,
      onchange:
        options.disabled === true
          ? Effect.void
          : setValue(options.state, options.value, options.id),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemInternalProps<Options extends ItemOptions> = ReturnType<
  ReturnType<typeof itemInternalProps<Options>>
>;

/**
 * Renders and optionally registers a native radio input synchronized with selected value.
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
 * Import with `import { Item } from "@typed/ui/RadioGroup";` Extend the [RadioGroup.makeState
 * runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState). Replace the linked program's
 * final snapshot read with `Item({ state, id: "email", value: "email", name: "contact" })`; render
 * that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, ItemInternalProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    ItemInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, itemInternalProps(options), "", (props) => html`<input ...${props} />`);
}

/**
 * Consumer-facing alias of the canonical RadioGroup component with identical behavior and
 * lifetime.
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
 * Import with `import { RadioGroup } from "@typed/ui/RadioGroup";` Extend the [RadioGroup.makeState
 * runnable setup](/reference/%40typed%2Fui%2FRadioGroup%23makeState). Replace the linked program's
 * final snapshot read with `RadioGroup({ state, label: "Contact method", content: "Choices" })`;
 * render that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export const RadioGroup = Root;
