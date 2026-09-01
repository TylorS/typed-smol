/**
 * Tabs separates active focus from selected tab and supports automatic or manual activation. List
 * handles orientation-aware movement; Tab publishes stable aria-controls state; Panel retains its
 * node while hidden.
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
 * Controls whether moving focus also selects a tab.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Tabs's deterministic policy without copying an
 * internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { ActivationMode } from "@typed/ui/Tabs";` Extend the [Tabs.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTabs%23makeState). Choose the focus-to-selection
 * policy explicitly: `const mode: ActivationMode = "manual"`.
 * @since 1.0.0
 * @category models
 */
export type ActivationMode = "automatic" | "manual";
/**
 * Supported composite movement axes.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Tabs's deterministic policy without copying an
 * internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { Orientation } from "@typed/ui/Tabs";` Extend the [Tabs.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTabs%23makeState). Choose the tab-list axis
 * explicitly: `const orientation: Orientation = "horizontal"`.
 * @since 1.0.0
 * @category models
 */
export type Orientation = "horizontal" | "vertical";

/**
 * Complete renderer-independent state for Tabs.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Tabs behavior without mounting or coupling the state
 * to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Tabs";` Extend the [Tabs.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTabs%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes selected and focused tabs as separate ids.
 * @since 1.0.0
 * @category models
 */
export interface State extends Omit<Composite.State, "orientation"> {
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category models
   */
  readonly orientation: Orientation;
  /**
   * Id whose value is currently selected.
   * @since 1.0.0
   * @category models
   */
  readonly selectedId: string;
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category models
   */
  readonly activeId: string;
  /**
   * Whether tab focus also selects automatically or waits for explicit activation.
   * @since 1.0.0
   * @category models
   */
  readonly activationMode: ActivationMode;
}

/**
 * Initial Tabs values. The caller supplies value; activeId defaults to value, activation is
 * automatic, orientation horizontal, and loop true.
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
 * Import with `import type { InitialState } from "@typed/ui/Tabs";` Extend the [Tabs.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTabs%23makeState). Construct state with
 * `const initial: InitialState = { selectedId: "overview", activationMode: "manual" }; const state = yield* Tabs.makeState(initial)`.
 * @since 1.0.0
 * @category models
 */
export interface InitialState {
  /**
   * Id whose value is currently selected.
   * @since 1.0.0
   * @category models
   */
  readonly selectedId: string;
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category models
   */
  readonly activeId?: string;
  /**
   * Whether tab focus also selects automatically or waits for explicit activation.
   * @since 1.0.0
   * @category models
   */
  readonly activationMode?: ActivationMode;
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category models
   */
  readonly orientation?: Orientation;
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category models
   */
  readonly loop?: boolean;
  /**
   * Whether horizontal Arrow-key meaning is reversed for right-to-left layout.
   * @since 1.0.0
   * @category models
   */
  readonly rtl?: boolean;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate Tabs state.
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
 * import * as Tabs from "@typed/ui/Tabs";
 *
 * const decodeState = Schema.decodeUnknownEffect(Tabs.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({
  selectedId: Schema.String,
  activeId: Schema.String,
  activationMode: Schema.Literals(["automatic", "manual"]),
  orientation: Schema.Literals(["horizontal", "vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

/**
 * Creates hydrated Tabs state. The caller supplies value; activeId defaults to value, activation
 * is automatic, orientation horizontal, and loop true.
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
 * import * as Tabs from "@typed/ui/Tabs";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Tabs.makeState({ selectedId: "overview" });
 *     const collection = yield* Tabs.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    selectedId: initial.selectedId,
    activeId: initial.activeId ?? initial.selectedId,
    activationMode: initial.activationMode ?? "automatic",
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: false,
  });
}

/**
 * Creates a scoped Collection for Tabs items.
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
 * import * as Tabs from "@typed/ui/Tabs";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Tabs.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Selects a tab and makes it the active roving-focus item.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Tabs's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { select } from "@typed/ui/Tabs";` Extend the [Tabs.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTabs%23makeState). Inside the linked Effect program invoke
 * `yield* select(state, "settings")`, then read state to observe both `selectedId` and `activeId`
 * become `"settings"`.
 * @since 1.0.0
 * @category combinators
 */
export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  selectedId: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: selectedId, selectedId }));
}

/**
 * Moves activeId through registered tabs without selecting under manual activation.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Tabs's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { move } from "@typed/ui/Tabs";` Extend the [Tabs.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTabs%23makeState). Inside the linked Effect program invoke
 * `yield* move(state, yield* collection, "next")`, then read state to observe focus move—and, in
 * automatic mode, selection move—to the next enabled tab.
 * @since 1.0.0
 * @category combinators
 */
export function move<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  items: readonly Collection.Item[],
  direction: Composite.Move,
): Effect.Effect<State, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    if (activeId === null) return current;
    return yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId,
      selectedId: value.activationMode === "automatic" ? activeId : value.selectedId,
    }));
  });
}

function moveAndFocus(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const next = yield* move(state, yield* collection, direction);
    yield* Composite.focusActive({ state, collection });
    yield* Composite.scrollActive({ state, collection });
    return next;
  });
}

/**
 * Inputs accepted by Tabs.List in addition to the shared DOM host options.
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
 * Import with `import type { ListOptions } from "@typed/ui/Tabs";` Extend the [Tabs.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTabs%23makeState). Enable collection-driven keys with
 * `const options: ListOptions = { state, collection, label: "Account", content: "Tabs" }`.
 * @since 1.0.0
 * @category models
 */
export interface ListOptions extends Dom.HostOptions<HTMLDivElement> {
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
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category models
   */
  readonly label?: Renderable.Any<string | null | undefined>;
  /**
   * Renderable tab content placed inside the tablist host.
   * @since 1.0.0
   * @category models
   */
  readonly items?: readonly Collection.Item[];
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category models
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
}

function listInternalProps<const Options extends ListOptions>(options: Options) {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  const onkeydown =
    options.collection === undefined && options.items === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const direction = Composite.keyMove(event, yield* options.state);
            if (direction !== undefined) {
              event.preventDefault();
              if (options.collection !== undefined) {
                yield* moveAndFocus(options.state, options.collection, direction);
              } else {
                yield* move(options.state, options.items!, direction);
              }
              return;
            }
            if (
              (event.key === "Enter" || event.key === " ") &&
              (yield* options.state).activationMode === "manual"
            ) {
              event.preventDefault();
              yield* select(options.state, (yield* options.state).activeId);
            }
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "tablist",
      "aria-label": property("label", undefined),
      "aria-orientation": orientation,
      onkeydown,
      ref: options.state,
    }) as const;
}

type ListInternalProps<Options extends ListOptions> = ReturnType<
  ReturnType<typeof listInternalProps<Options>>
>;

/**
 * Renders the tablist and applies orientation-aware movement plus Enter/Space activation in manual
 * mode.
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
 * Import with `import { List } from "@typed/ui/Tabs";` Extend the [Tabs.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTabs%23makeState). Replace the linked program's final snapshot
 * read with `List({ state, label: "Account", content: "Tabs" })`; render that Fx before the same
 * Scope closes.
 * @since 1.0.0
 * @category components
 */
export function List<const Options extends ListOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ListInternalProps<Options>>,
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
    ListInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, listInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by Tabs.Tab in addition to the shared DOM host options.
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
 * Import with `import type { TabOptions } from "@typed/ui/Tabs";` Extend the [Tabs.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTabs%23makeState). Relate a tab to its panel with
 * `const options: TabOptions = { state, collection, id: "overview", panelId: "overview-panel", content: "Overview" }`.
 * @since 1.0.0
 * @category models
 */
export interface TabOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category models
   */
  readonly id: string;
  /**
   * Panel id emitted through the tab's aria-controls relationship.
   * @since 1.0.0
   * @category models
   */
  readonly panelId: string;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category models
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category models
   */
  readonly disabled?: boolean;
}

function tabInternalProps<const Options extends TabOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.selectedId === options.id);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.id,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      type: "button",
      role: "tab",
      "aria-controls": options.panelId,
      "aria-selected": selected,
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick: options.disabled === true ? Effect.void : select(options.state, options.id),
      onfocus:
        options.disabled === true
          ? Effect.void
          : RefSubject.update(options.state, (state) =>
              state.activationMode === "automatic"
                ? { ...state, activeId: options.id, selectedId: options.id }
                : { ...state, activeId: options.id },
            ),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}

type TabInternalProps<Options extends TabOptions> = ReturnType<
  ReturnType<typeof tabInternalProps<Options>>
>;

/**
 * Renders and optionally registers a tab with stable aria-controls, selected state, and roving
 * tabindex.
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
 * Import with `import { Tab } from "@typed/ui/Tabs";` Extend the [Tabs.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTabs%23makeState). Replace the linked program's final snapshot
 * read with `Tab({ state, id: "overview", panelId: "overview-panel", content: "Overview" })`;
 * render that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Tab<const Options extends TabOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, TabInternalProps<Options>>,
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
    TabInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    tabInternalProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Inputs accepted by Tabs.Panel in addition to the shared DOM host options.
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
 * Import with `import type { PanelOptions } from "@typed/ui/Tabs";` Extend the [Tabs.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTabs%23makeState). Relate a panel back to its tab with
 * `const options: PanelOptions = { state, id: "overview-panel", tabId: "overview", content: "Account overview" }`.
 * @since 1.0.0
 * @category models
 */
export interface PanelOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category models
   */
  readonly id: string;
  /**
   * Tab id emitted through the panel's aria-labelledby relationship.
   * @since 1.0.0
   * @category models
   */
  readonly tabId: string;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function panelInternalProps<const Options extends PanelOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.selectedId === options.tabId);
  return () =>
    ({
      id: options.id,
      role: "tabpanel",
      "aria-labelledby": options.tabId,
      tabindex: 0,
      "?hidden": RefSubject.map(selected, (value) => !value),
    }) as const;
}

type PanelInternalProps<Options extends PanelOptions> = ReturnType<
  ReturnType<typeof panelInternalProps<Options>>
>;

/**
 * Renders a labelled tabpanel and hides it reactively when its tab is not selected.
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
 * Import with `import { Panel } from "@typed/ui/Tabs";` Extend the [Tabs.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTabs%23makeState). Replace the linked program's final snapshot
 * read with `Panel({ state, id: "overview-panel", tabId: "overview", content: "Account overview"
 * })`; render that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Panel<const Options extends PanelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, PanelInternalProps<Options>>,
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
    PanelInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    panelInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
