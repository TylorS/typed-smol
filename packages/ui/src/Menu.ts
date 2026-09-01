/**
 * Menu coordinates trigger, manual native popover content, registered items, and nested submenu
 * state. Keyboard handling covers opening, Escape, directional parent/child traversal, roving
 * focus, and typeahead without synthetic events.
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
 * Complete renderer-independent state for Menu.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Menu behavior without mounting or coupling the state
 * to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes popup identity, open state, and active-item focus.
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

interface SubmenuOwner {
  readonly onArrowLeft: Effect.Effect<void, Schema.SchemaError>;
}

const submenuOwners = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  SubmenuOwner
>();

/**
 * Initial Menu values. The caller supplies id; open defaults false, activeId null, loop true, and
 * orientation vertical.
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
 * Import with `import type { InitialState } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). Construct a closed menu with
 * `const initial: InitialState = { id: "file-menu", open: false }; const state = yield* Menu.makeState(initial)`.
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
 * Effect Schema used by makeState to encode, decode, and hydrate Menu state.
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
 * import * as Menu from "@typed/ui/Menu";
 *
 * const decodeState = Schema.decodeUnknownEffect(Menu.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({
  id: Schema.String,
  open: Schema.Boolean,
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

/**
 * Creates hydrated Menu state. The caller supplies id; open defaults false, activeId null, loop
 * true, and orientation vertical.
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
 * import * as Menu from "@typed/ui/Menu";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Menu.makeState({ id: "file-menu" });
 *     const collection = yield* Menu.makeCollection();
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
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

/**
 * Creates a scoped Collection for Menu items.
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
 * import * as Menu from "@typed/ui/Menu";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Menu.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Updates only the menu's explicit open state.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Menu's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { setOpen } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Inside the linked Effect program invoke
 * `yield* setOpen(state, true)`, then read state to observe `open: true` without changing focus or
 * menu identity.
 * @since 1.0.0
 * @category combinators
 */
export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (value) => ({ ...value, open }));
}

/**
 * Inputs accepted by Menu.Trigger in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * Separator orientation is an accessibility announcement only, so it remains independent from the
 * orientation used by menu keyboard navigation.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { TriggerOptions } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). A native popover trigger accepts
 * `const options: TriggerOptions = { state, content: "File" }`.
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
  const open = RefSubject.map(options.state, (state) => state.open);
  return () =>
    ({
      type: "button",
      popovertarget: id,
      popovertargetaction: "toggle",
      "aria-haspopup": "menu",
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
 * Renders a native button targeting menu popover content and opens the menu on ArrowDown.
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
 * Import with `import { Trigger } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `Trigger({ state, content: "File" })`; render that Fx before the same Scope closes.
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
 * Consumer-facing alias of the canonical Menu component with identical behavior and lifetime.
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
 * Import with `import { Button } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `Button({ state, content: "File" })`; render that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export const Button = Trigger;

/**
 * Inputs accepted by Menu.Content in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The model makes popup content, optional collection navigation, and optional parent-menu linkage
 * explicit while retaining the shared custom-host boundary.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { ContentOptions } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). Enable menu movement with
 * `const options: ContentOptions = { state, collection, label: "File", content: "Commands" }`.
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
   * Parent-menu state and collection used for nested directional navigation and focus return.
   * @since 1.0.0
   * @category models
   */
  readonly parent?: ParentMenu;
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

/**
 * Public Menu.ParentMenu behavioral model.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Menu's deterministic policy without copying an
 * internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { ParentMenu } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). Nested menus carry their parent
 * navigation pair explicitly: `const parent: ParentMenu = { state, collection }`.
 * @since 1.0.0
 * @category models
 */
export interface ParentMenu {
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
  readonly collection: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Id of the trigger that owns this menu and receives focus when the menu closes.
   * @since 1.0.0
   * @category models
   */
  readonly triggerId: string;
}

function contentProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  let typeahead: Composite.TypeaheadBuffer = { value: "", updatedAt: 0 };
  let restoreParentFocus = false;
  let restoreOwnerFocus = false;
  let restoreInvokerFocus = false;
  let invoker: globalThis.Element | undefined;
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const direction = Composite.keyMove(event, { orientation: "vertical" });
            if (direction !== undefined) {
              event.preventDefault();
              yield* Composite.moveAndFocus(
                { state: options.state, collection: options.collection!, includeDisabled: true },
                direction,
              );
              return;
            }
            if (event.key === "ArrowRight") {
              const activeId = (yield* options.state).activeId;
              const item =
                activeId === null
                  ? undefined
                  : (yield* options.collection!).find((item) => item.id === activeId);
              const element = item?.submenu === true ? item.element : undefined;
              const click = element === undefined ? undefined : Reflect.get(element, "click");
              if (typeof click === "function") {
                event.preventDefault();
                yield* Effect.sync(() => click.call(element));
              }
              return;
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              const element = Dom.currentTarget<HTMLDivElement>(event);
              const hidePopover = Reflect.get(element, "hidePopover");
              if (typeof hidePopover === "function") {
                if (options.parent === undefined && submenuOwners.has(options.state))
                  restoreOwnerFocus = true;
                else if (options.parent === undefined) restoreInvokerFocus = true;
                else restoreParentFocus = true;
                yield* Effect.sync(() => hidePopover.call(element));
              } else {
                yield* setOpen(options.state, false);
                if (options.parent === undefined && submenuOwners.has(options.state)) {
                  yield* submenuOwners.get(options.state)?.onArrowLeft ?? Effect.void;
                } else if (options.parent === undefined)
                  yield* Composite.focusElement(invoker ?? invokers.get(options.state));
                else {
                  yield* RefSubject.update(options.parent.state, (state) => ({
                    ...state,
                    activeId: options.parent!.triggerId,
                  }));
                  yield* Composite.focusActive({
                    state: options.parent.state,
                    collection: options.parent.collection,
                  });
                }
              }
              return;
            }
            if (event.key === "Escape") {
              restoreInvokerFocus = true;
              yield* setOpen(options.state, false);
              return;
            }
            if (event.key === "Tab") {
              yield* setOpen(options.state, false);
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              const activeId = (yield* options.state).activeId;
              const element =
                activeId === null
                  ? undefined
                  : (yield* options.collection!).find((item) => item.id === activeId)?.element;
              const click = element === undefined ? undefined : Reflect.get(element, "click");
              if (typeof click === "function") {
                event.preventDefault();
                yield* Effect.sync(() => click.call(element));
              }
              return;
            }
            const key = Composite.typeaheadKey(event);
            if (key === null) return;
            typeahead = Composite.updateTypeaheadBuffer(typeahead, key, Date.now());
            const activeId = Composite.typeaheadFrom(
              yield* options.collection!,
              typeahead.value,
              (yield* options.state).activeId,
              undefined,
              true,
            );
            if (activeId === null) return;
            event.preventDefault();
            yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
            yield* Composite.focusActive({ state: options.state, collection: options.collection! });
          }),
        );
  const restoreFocus = Effect.gen(function* () {
    if (restoreParentFocus && options.parent !== undefined) {
      restoreParentFocus = false;
      yield* RefSubject.update(options.parent.state, (state) => ({
        ...state,
        activeId: options.parent!.triggerId,
      }));
      yield* Composite.focusActive({
        state: options.parent.state,
        collection: options.parent.collection,
      });
    }
    if (restoreOwnerFocus) {
      restoreOwnerFocus = false;
      yield* submenuOwners.get(options.state)?.onArrowLeft ?? Effect.void;
    }
    if (restoreInvokerFocus) {
      restoreInvokerFocus = false;
      yield* Composite.focusElement(invoker ?? invokers.get(options.state));
    }
  });
  const toggle = EventHandler.make(
    Effect.fn(function* (event: Event) {
      const open = Dom.toggleState(event) === "open";
      const source = Reflect.get(event, "source");
      if (isElement(source)) invoker = source;
      const current = yield* options.state;
      if (current.open === open) {
        if (!open) yield* restoreFocus;
        return current;
      }
      if (open && options.collection !== undefined) {
        const activeId = Composite.moveActiveId(yield* options.collection, current, "first", true);
        const next = yield* RefSubject.update(options.state, (state) => ({
          ...state,
          open,
          activeId,
        }));
        yield* Composite.focusActive({ state: options.state, collection: options.collection });
        yield* Composite.scrollActive({ state: options.state, collection: options.collection });
        return next;
      }
      const next = yield* setOpen(options.state, open);
      if (!open) yield* restoreFocus;
      return next;
    }),
  );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id,
      role: "menu",
      popover: "manual",
      "aria-label": property("label", undefined),
      onkeydown,
      ontoggle: toggle,
      ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
    }) as const;
}

function isElement(value: unknown): value is globalThis.Element {
  return typeof value === "object" && value !== null && "nodeType" in value;
}
type ContentProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentProps<Options>>
>;

/**
 * Renders manual-popover menu content and coordinates focus, typeahead, Escape, and nested-menu
 * traversal.
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
 * Import with `import { Content } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `Content({ state, label: "File", content: "Commands" })`; render that Fx before the
 * same Scope closes.
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
 * Consumer-facing alias of the canonical Menu component with identical behavior and lifetime.
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
 * Import with `import { Menu } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `Menu({ state, label: "File", content: "Commands" })`; render that Fx before the same
 * Scope closes.
 * @since 1.0.0
 * @category components
 */
export const Menu = Content;

/**
 * Inputs accepted by Menu.Item in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The model makes item identity, content, optional registration metadata, and state ownership
 * explicit before the item is rendered.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { ItemOptions } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). A menu command is
 * `const options: ItemOptions = { state, collection, id: "save", content: "Save" }`.
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
  /**
   * ARIA role emitted by the item variant.
   * @since 1.0.0
   * @category models
   */
  readonly role?: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  /**
   * Checked state exposed by checkbox and radio menu-item variants.
   * @since 1.0.0
   * @category models
   */
  readonly checked?: Renderable.Any<boolean | null | undefined>;
}

function itemProps<const Options extends ItemOptions>(options: Options) {
  const closesOnActivate = options.role === undefined || options.role === "menuitem";
  const activate =
    options.disabled === true
      ? Effect.void
      : RefSubject.update(options.state, (state) => ({
          ...state,
          activeId: options.id,
          open: closesOnActivate ? false : state.open,
        }));
  const focus = RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id }));
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
      role: options.role ?? "menuitem",
      "aria-disabled": options.disabled ?? false,
      "aria-checked":
        options.role === "menuitem" || options.role === undefined
          ? undefined
          : (options.checked ?? false),
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick: activate,
      onfocus: focus,
      onmouseenter: focus,
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemProps<Options extends ItemOptions> = ReturnType<ReturnType<typeof itemProps<Options>>>;

/**
 * Renders and optionally registers a menu item; disabled items remain announced but do not
 * activate.
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
 * Import with `import { Item } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `Item({ state, id: "save", content: "Save" })`; render that Fx before the same Scope
 * closes.
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

/**
 * Inputs accepted by Menu.SubmenuTrigger in addition to the shared DOM host options.
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
 * Import with `import type { SubmenuTriggerOptions } from "@typed/ui/Menu";` Extend the
 * [Menu.makeState runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). After
 * `const submenu = yield* Menu.makeState({ id: "share-menu" })`, use
 * `const options: SubmenuTriggerOptions<State> = { state, submenu, collection, id: "share", content: "Share" }`.
 * @since 1.0.0
 * @category models
 */
export interface SubmenuTriggerOptions<
  ParentState extends Composite.State,
> extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<ParentState, Schema.SchemaError>;
  /**
   * Whether the item participates as a submenu entry.
   * @since 1.0.0
   * @category models
   */
  readonly submenu: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
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

function submenuTriggerProps<
  ParentState extends Composite.State,
  const Options extends SubmenuTriggerOptions<ParentState>,
>(options: Options) {
  const submenuId = RefSubject.map(options.submenu, (state) => state.id);
  const expanded = RefSubject.map(options.submenu, (state) => state.open);
  const focusEffect = RefSubject.update(options.state, (state) => ({
    ...state,
    activeId: options.id,
  }));
  const activateEffect = options.disabled === true ? Effect.void : focusEffect;
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.textValue ?? options.id,
          disabled: options.disabled,
          submenu: true,
        });
  return () =>
    ({
      id: options.id,
      type: "button",
      role: "menuitem",
      popovertarget: submenuId,
      popovertargetaction: "toggle",
      "aria-haspopup": "menu",
      "aria-expanded": expanded,
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick: activateEffect,
      onfocus: focusEffect,
      onmouseenter:
        options.disabled === true
          ? Effect.void
          : Effect.andThen(activateEffect, setOpen(options.submenu, true)),
      ref: Dom.composeRefs(
        register,
        Dom.composeRefs(
          options.ref,
          submenuOwnerRef(options.submenu, options.state, options.collection, options.id),
        ),
      ),
    }) as const;
}

function submenuOwnerRef<ParentState extends Composite.State>(
  submenu: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  state: RefSubject.HydratedRefSubject<ParentState, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>> | undefined,
  triggerId: string,
): (element: globalThis.Element) => Effect.Effect<void, never, Scope.Scope> {
  return Effect.fn(function* () {
    const owner: SubmenuOwner = {
      onArrowLeft: Effect.gen(function* () {
        if (collection === undefined) return;
        if ((yield* state).orientation === "horizontal") {
          yield* Composite.moveAndFocus({ state, collection, includeDisabled: true }, "previous");
        } else {
          yield* RefSubject.update(state, (value) => ({ ...value, activeId: triggerId }));
          yield* Composite.focusActive({ state, collection });
        }
      }),
    };
    submenuOwners.set(submenu, owner);
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(
      scope,
      Effect.sync(() => {
        if (submenuOwners.get(submenu) === owner) submenuOwners.delete(submenu);
      }),
    );
  });
}
type SubmenuTriggerProps<
  ParentState extends Composite.State,
  Options extends SubmenuTriggerOptions<ParentState>,
> = ReturnType<ReturnType<typeof submenuTriggerProps<ParentState, Options>>>;

/**
 * Renders a menuitem that targets nested popover content and coordinates parent/child directional
 * focus.
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
 * Import with `import { SubmenuTrigger } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final
 * snapshot read after `const submenu = yield* Menu.makeState({ id: "share-menu" })` with
 * `SubmenuTrigger({ state, submenu, collection, id: "share", content: "Share" })`; render that Fx
 * before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function SubmenuTrigger<
  ParentState extends Composite.State,
  const Options extends SubmenuTriggerOptions<NoInfer<ParentState>>,
  const Host extends HostResult = never,
>(
  options: Options & {
    readonly state: RefSubject.HydratedRefSubject<ParentState, Schema.SchemaError>;
  },
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SubmenuTriggerProps<ParentState, Options>>,
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
    SubmenuTriggerProps<ParentState, Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    submenuTriggerProps<ParentState, Options>(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Inputs accepted by Menu.CheckboxItem in addition to the shared DOM host options.
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
 * Import with `import type { CheckboxItemOptions } from "@typed/ui/Menu";` Extend the
 * [Menu.makeState runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). A checked command
 * is
 * `const options: CheckboxItemOptions = { state, collection, id: "autosave", checked: true, content: "Autosave" }`.
 * @since 1.0.0
 * @category models
 */
export interface CheckboxItemOptions extends Omit<ItemOptions, "role" | "checked"> {
  /**
   * Checked state exposed by checkbox and radio menu-item variants.
   * @since 1.0.0
   * @category models
   */
  readonly checked: Renderable.Any<boolean | null | undefined>;
}
type CheckboxItemWithRole<Options extends CheckboxItemOptions> = Options & {
  readonly role: "menuitemcheckbox";
};

/**
 * Renders Item with menuitemcheckbox semantics and caller-supplied checked state.
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
 * Import with `import { CheckboxItem } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `CheckboxItem({ state, id: "autosave", checked: true, content: "Autosave" })`; render
 * that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function CheckboxItem<
  const Options extends CheckboxItemOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<CheckboxItemWithRole<Options>, ItemProps<CheckboxItemWithRole<Options>>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Item<CheckboxItemWithRole<Options>, Host>({ ...options, role: "menuitemcheckbox" }, host);
}

/**
 * Inputs accepted by Menu.RadioItem in addition to the shared DOM host options.
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
 * Import with `import type { RadioItemOptions } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). A radio command is
 * `const options: RadioItemOptions = { state, collection, id: "compact", checked: false, content: "Compact" }`.
 * @since 1.0.0
 * @category models
 */
export interface RadioItemOptions extends Omit<ItemOptions, "role" | "checked"> {
  /**
   * Checked state exposed by checkbox and radio menu-item variants.
   * @since 1.0.0
   * @category models
   */
  readonly checked: Renderable.Any<boolean | null | undefined>;
}
type RadioItemWithRole<Options extends RadioItemOptions> = Options & {
  readonly role: "menuitemradio";
};

/**
 * Renders Item with menuitemradio semantics and caller-supplied checked state.
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
 * Import with `import { RadioItem } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `RadioItem({ state, id: "compact", checked: false, content: "Compact" })`; render that
 * Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function RadioItem<
  const Options extends RadioItemOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<RadioItemWithRole<Options>, ItemProps<RadioItemWithRole<Options>>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Item<RadioItemWithRole<Options>, Host>({ ...options, role: "menuitemradio" }, host);
}

/**
 * Inputs accepted by Menu.Group in addition to the shared DOM host options.
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
 * Import with `import type { GroupOptions } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). A labeled command group accepts
 * `const options: GroupOptions = { label: "View", content: "Choices" }`.
 * @since 1.0.0
 * @category models
 */
export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
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

function groupProps<const Options extends GroupOptions>(_options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "group",
      "aria-label": property("label", undefined),
    }) as const;
}
type GroupProps<Options extends GroupOptions> = ReturnType<ReturnType<typeof groupProps<Options>>>;

/**
 * Renders a labelled ARIA group inside menu content.
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
 * @example
 * ```ts
 * import * as Menu from "@typed/ui/Menu";
 *
 * const view = Menu.Group({ label: "View", content: "Choices" });
 * ```
 * @since 1.0.0
 * @category components
 */
export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, GroupProps<Options>>,
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
    GroupProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    groupProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

/**
 * Consumer-facing alias of the canonical Menu component with identical behavior and lifetime.
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
 * Import with `import { Dismiss } from "@typed/ui/Menu";` Extend the [Menu.makeState runnable
 * setup](/reference/%40typed%2Fui%2FMenu%23makeState). Replace the linked program's final snapshot
 * read with `Dismiss({ state, id: "close", content: "Close" })`; render that Fx before the same
 * Scope closes.
 * @since 1.0.0
 * @category components
 */
export const Dismiss = Item;

/**
 * Inputs accepted by Menu.Separator in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The model adds separator orientation to the shared host options. Orientation is consumed only
 * by the separator's `aria-orientation` attribute; it does not change menu navigation.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { SeparatorOptions } from "@typed/ui/Menu";` Extend the [Menu.makeState
 * runnable setup](/reference/%40typed%2Fui%2FMenu%23makeState). Choose only its announced axis:
 * `const options: SeparatorOptions = { orientation: "vertical" }`; this does not alter Arrow-key
 * behavior.
 * @since 1.0.0
 * @category models
 */
export interface SeparatorOptions extends Dom.HostOptions<HTMLHRElement> {
  /**
   * Value forwarded only to the separator's aria-orientation attribute.
   * @since 1.0.0
   * @category models
   */
  readonly orientation?: "horizontal" | "vertical";
}

function separatorProps<const Options extends SeparatorOptions>(_options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "separator",
      "aria-orientation": property("orientation", "horizontal"),
    }) as const;
}
type SeparatorProps<Options extends SeparatorOptions> = ReturnType<
  ReturnType<typeof separatorProps<Options>>
>;

/**
 * Renders a separator with explicit horizontal or vertical orientation.
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
 * @example
 * ```ts
 * import * as Menu from "@typed/ui/Menu";
 *
 * const view = Menu.Separator({ orientation: "horizontal" });
 * ```
 * @since 1.0.0
 * @category components
 */
export function Separator<
  const Options extends SeparatorOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SeparatorProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLHRElement>()<Options, SeparatorProps<Options>, "", HostResult, Host>(
    options,
    host,
    separatorProps(options),
    "",
    (props) => html`<hr ...${props} />`,
  );
}
