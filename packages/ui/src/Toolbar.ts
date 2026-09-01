/**
 * Toolbar is a roving-focus composite with toolbar and button roles. Orientation and RTL control
 * Arrow-key order; Home and End select the document-order endpoints.
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
 * Complete renderer-independent state for Toolbar.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Toolbar behavior without mounting or coupling the
 * state to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Toolbar";` Extend the [Toolbar.makeState
 * runnable setup](/reference/%40typed%2Fui%2FToolbar%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes toolbar focus policy.
 * @since 1.0.0
 * @category models
 */
export interface State extends Composite.State {}
/**
 * Initial Toolbar values. Uses Composite defaults unless overridden.
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
 * Import with `import type { InitialState } from "@typed/ui/Toolbar";` Extend the
 * [Toolbar.makeState runnable setup](/reference/%40typed%2Fui%2FToolbar%23makeState). Construct a
 * vertical toolbar with
 * `const initial: InitialState = { orientation: "vertical" }; const state = yield* Toolbar.makeState(initial)`.
 * @since 1.0.0
 * @category models
 */
export type InitialState = Composite.InitialState;
/**
 * Effect Schema used by makeState to encode, decode, and hydrate Toolbar state.
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
 * import * as Toolbar from "@typed/ui/Toolbar";
 *
 * const decodeState = Schema.decodeUnknownEffect(Toolbar.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Composite.StateSchema;

/**
 * Creates hydrated Toolbar state. Uses Composite defaults unless overridden.
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
 * import * as Toolbar from "@typed/ui/Toolbar";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Toolbar.makeState({});
 *     const collection = yield* Toolbar.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState = {}) {
  return Composite.makeState(initial);
}

/**
 * Creates a scoped Collection for Toolbar items.
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
 * import * as Toolbar from "@typed/ui/Toolbar";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Toolbar.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Inputs accepted by Toolbar.Root in addition to the shared DOM host options.
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
 * Import with `import type { RootOptions } from "@typed/ui/Toolbar";` Extend the [Toolbar.makeState
 * runnable setup](/reference/%40typed%2Fui%2FToolbar%23makeState). Enable toolbar movement with
 * `const options: RootOptions = { state, collection, label: "Formatting", content: "Buttons" }`.
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

function rootProps<const Options extends RootOptions>(options: Options) {
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          if ((yield* options.state).activeId !== null) return;
          yield* Composite.moveAndFocus(
            { state: options.state, collection: options.collection! },
            "first",
          );
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            if (event.key === "Enter" || event.key === " ") {
              const activeId = (yield* options.state).activeId;
              const item =
                activeId === null
                  ? undefined
                  : (yield* options.collection!).find((candidate) => candidate.id === activeId);
              const click =
                item?.disabled === true ? undefined : Reflect.get(item?.element ?? {}, "click");
              if (typeof click === "function") {
                event.preventDefault();
                yield* Effect.sync(() => click.call(item!.element));
              }
              return;
            }
            const direction = Composite.keyMove(event, yield* options.state);
            if (direction === undefined) return;
            event.preventDefault();
            yield* Composite.moveAndFocus(
              { state: options.state, collection: options.collection! },
              direction,
            );
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "toolbar",
      "aria-label": property("label", undefined),
      "aria-orientation": RefSubject.map(options.state, (state) => state.orientation),
      tabindex: Composite.rootTabIndex(options.state),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootProps<Options extends RootOptions> = ReturnType<ReturnType<typeof rootProps<Options>>>;

/**
 * Renders the toolbar root and moves roving focus through registered items in DOM order.
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
 * Import with `import { Root } from "@typed/ui/Toolbar";` Extend the [Toolbar.makeState runnable
 * setup](/reference/%40typed%2Fui%2FToolbar%23makeState). Replace the linked program's final
 * snapshot read with `Root({ state, label: "Formatting", content: "Buttons" })`; render that Fx
 * before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
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

/**
 * Consumer-facing alias of the canonical Toolbar component with identical behavior and lifetime.
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
 * Import with `import { Toolbar } from "@typed/ui/Toolbar";` Extend the [Toolbar.makeState runnable
 * setup](/reference/%40typed%2Fui%2FToolbar%23makeState). Replace the linked program's final
 * snapshot read with `Toolbar({ state, label: "Formatting", content: "Buttons" })`; render that Fx
 * before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export const Toolbar = Root;

/**
 * Inputs accepted by Toolbar.Item in addition to the shared DOM host options.
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
 * Import with `import type { ItemOptions } from "@typed/ui/Toolbar";` Extend the [Toolbar.makeState
 * runnable setup](/reference/%40typed%2Fui%2FToolbar%23makeState). A toolbar control is
 * `const options: ItemOptions = { state, collection, id: "bold", content: "Bold" }`.
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
  const activate =
    options.disabled === true
      ? Effect.void
      : RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id }));
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.textValue ?? options.id,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      role: "button",
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onfocus: activate,
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemProps<Options extends ItemOptions> = ReturnType<ReturnType<typeof itemProps<Options>>>;

/**
 * Renders and optionally registers a toolbar button; focus activates it unless disabled.
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
 * Import with `import { Item } from "@typed/ui/Toolbar";` Extend the [Toolbar.makeState runnable
 * setup](/reference/%40typed%2Fui%2FToolbar%23makeState). Replace the linked program's final
 * snapshot read with `Item({ state, id: "bold", content: "Bold" })`; render that Fx before the same
 * Scope closes.
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
