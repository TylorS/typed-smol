/**
 * TreeGrid combines tree expansion with virtual-focus grid movement. Rows carry hierarchy and
 * expansion, cells carry column positions, and the root retains focus while aria-activedescendant
 * identifies the active cell.
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
import * as Dom from "./Dom.js";
import * as Grid from "./Grid.js";
import type { HostResult } from "./Dom/Types.js";
import * as Tree from "./Tree.js";

/**
 * Complete renderer-independent state for TreeGrid.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test TreeGrid behavior without mounting or coupling the
 * state to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes active and expanded ids using Tree state
 * semantics.
 * @since 1.0.0
 * @category models
 */
export type State = Tree.State;
/**
 * Initial TreeGrid values. Uses Tree state and defaults.
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
 * Import with `import type { InitialState } from "@typed/ui/TreeGrid";` Extend the
 * [TreeGrid.makeState runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Construct
 * an expanded row with
 * `const initial: InitialState = { activeId: "src-name", expandedIds: ["src"] }; const state = yield* TreeGrid.makeState(initial)`.
 * @since 1.0.0
 * @category models
 */
export type InitialState = Tree.InitialState;
/**
 * Effect Schema used by makeState to encode, decode, and hydrate TreeGrid state.
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
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const decodeState = Schema.decodeUnknownEffect(TreeGrid.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Tree.StateSchema;
/**
 * Creates hydrated TreeGrid state. Uses Tree state and defaults.
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
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* TreeGrid.makeState({});
 *     const collection = yield* TreeGrid.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeState = Tree.makeState;
/**
 * Tests membership in expandedIds without touching the DOM; this is the Tree helper exposed from
 * the TreeGrid entrypoint.
 *
 * @remarks
 * ## Why
 *
 * Separating this deterministic policy from event wiring lets applications test it directly and
 * reuse it in custom composites.
 *
 * ## Ownership and lifetime
 *
 * This is a synchronous calculation. It acquires no resources and does not mutate the input array,
 * state, event, or DOM.
 *
 * @example
 * ```ts
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const expanded = TreeGrid.isExpanded({ activeId: null, expandedIds: ["parent"], loop: true }, "parent");
 * ```
 * @since 1.0.0
 * @category combinators
 */
export const isExpanded = Tree.isExpanded;
/**
 * Adds a row id once to expandedIds using the Tree state transition.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes TreeGrid's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { expand } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Inside the linked Effect
 * program run `yield* expand(state, "parent")`, then read state to observe the id in expandedIds.
 * @since 1.0.0
 * @category combinators
 */
export const expand = Tree.expand;
/**
 * Removes a row id from expandedIds using the Tree state transition.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes TreeGrid's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { collapse } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Inside the linked Effect
 * program run `yield* collapse(state, "parent")`, then read state to observe the id removed from
 * expandedIds.
 * @since 1.0.0
 * @category combinators
 */
export const collapse = Tree.collapse;
/**
 * Sets the active TreeGrid row or cell id without changing expansion.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes TreeGrid's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { activate } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Inside the linked Effect
 * program run `yield* activate(state, "cell-1")`, then read state to observe activeId.
 * @since 1.0.0
 * @category combinators
 */
export const activate = Tree.activate;

/**
 * Logical coordinates stored with each registered TreeGrid cell.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse TreeGrid's deterministic policy without copying an
 * internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { CellPosition } from "@typed/ui/TreeGrid";` Extend the
 * [TreeGrid.makeState runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). A
 * hierarchical cell position combines grid and tree identity:
 * `const position: CellPosition = { rowId: "src", columnIndex: 1, parentId: "root", hasChildren: true }`.
 * @since 1.0.0
 * @category models
 */
export interface CellPosition extends Grid.CellPosition {
  /**
   * Id whose expansion controls this descendant group.
   * @since 1.0.0
   * @category models
   */
  readonly parentId?: string;
  /**
   * Whether aria-expanded is emitted and hierarchical keys may open descendants.
   * @since 1.0.0
   * @category models
   */
  readonly hasChildren: boolean;
}

/**
 * Creates a scoped Collection for TreeGrid items.
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
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* TreeGrid.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<CellPosition>;

/**
 * Inputs accepted by TreeGrid.Root in addition to the shared DOM host options.
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
 * Import with `import type { RootOptions } from "@typed/ui/TreeGrid";` Extend the
 * [TreeGrid.makeState runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Enable
 * tree-grid navigation with
 * `const options: RootOptions = { state, collection, label: "Files", content: "Rows" }`.
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
  readonly collection?: RefSubject.RefSubject<Collection.State<CellPosition>>;
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category models
   */
  readonly label: Renderable.Any<string | null | undefined>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          const current = yield* options.state;
          if (current.activeId !== null) return;
          const first = visibleItems(yield* options.collection!, current)[0];
          if (first !== undefined) yield* activate(options.state, first.id);
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn((event: KeyboardEvent) => onKeyDown(options.state, options.collection!, event)),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "treegrid",
      tabindex: 0,
      "aria-label": property("label", undefined),
      "aria-activedescendant": RefSubject.map(
        options.state,
        (state) => state.activeId ?? undefined,
      ),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

/**
 * Renders the focus-owning treegrid root and applies combined grid and expansion keys.
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
 * Import with `import { Root } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Replace the linked program's final
 * snapshot read with `Root({ state, label: "Files", content: "Rows" })`; render that Fx before the
 * same Scope closes.
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
 * Inputs accepted by TreeGrid.Row in addition to the shared DOM host options.
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
 * Import with `import type { RowOptions } from "@typed/ui/TreeGrid";` Extend the
 * [TreeGrid.makeState runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). A
 * hierarchical row is
 * `const options: RowOptions = { state, rowId: "src", level: 1, hasChildren: true, content: "Cells" }`.
 * @since 1.0.0
 * @category models
 */
export interface RowOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Stable logical row identity used by vertical grid movement.
   * @since 1.0.0
   * @category models
   */
  readonly rowId: string;
  /**
   * Id whose expansion controls this descendant group.
   * @since 1.0.0
   * @category models
   */
  readonly parentId?: string;
  /**
   * One-based hierarchy level exposed through aria-level.
   * @since 1.0.0
   * @category models
   */
  readonly level?: number;
  /**
   * Whether aria-expanded is emitted and hierarchical keys may open descendants.
   * @since 1.0.0
   * @category models
   */
  readonly hasChildren?: boolean;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function rowInternalProps<const Options extends RowOptions>(options: Options) {
  const hasChildren = options.hasChildren ?? false;
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.rowId,
      role: "row",
      "aria-level": property("level", 1),
      "aria-expanded": hasChildren
        ? RefSubject.map(options.state, (state) => isExpanded(state, options.rowId))
        : undefined,
    }) as const;
}
type RowInternalProps<Options extends RowOptions> = ReturnType<
  ReturnType<typeof rowInternalProps<Options>>
>;

/**
 * Renders a hierarchical row with level and optional expanded state.
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
 * Import with `import { Row } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Replace the linked program's final
 * snapshot read with `Row({ state, rowId: "src", content: "Cells" })`; render that Fx before the
 * same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Row<const Options extends RowOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RowInternalProps<Options>>,
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
    RowInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    rowInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

/**
 * Inputs accepted by TreeGrid.Cell in addition to the shared DOM host options.
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
 * Import with `import type { CellOptions } from "@typed/ui/TreeGrid";` Extend the
 * [TreeGrid.makeState runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). A navigable
 * cell is
 * `const options: CellOptions = { state, collection, id: "src-name", rowId: "src", columnIndex: 1, content: "src" }`.
 * @since 1.0.0
 * @category models
 */
export interface CellOptions extends Dom.HostOptions<HTMLDivElement> {
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
  readonly collection?: RefSubject.RefSubject<Collection.State<CellPosition>>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category models
   */
  readonly id: string;
  /**
   * Stable logical row identity used by vertical grid movement.
   * @since 1.0.0
   * @category models
   */
  readonly rowId: string;
  /**
   * Caller-supplied column index used for movement and emitted unchanged as aria-colindex; ARIA
   * indexes are one-based.
   * @since 1.0.0
   * @category models
   */
  readonly columnIndex: number;
  /**
   * Id whose expansion controls this descendant group.
   * @since 1.0.0
   * @category models
   */
  readonly parentId?: string;
  /**
   * Whether aria-expanded is emitted and hierarchical keys may open descendants.
   * @since 1.0.0
   * @category models
   */
  readonly hasChildren?: boolean;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function cellInternalProps<const Options extends CellOptions>(options: Options) {
  const active = RefSubject.map(options.state, (state) => state.activeId === options.id);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: {
            rowId: options.rowId,
            columnIndex: options.columnIndex,
            parentId: options.parentId,
            hasChildren: options.hasChildren ?? false,
          },
          textValue: options.id,
        });
  return () =>
    ({
      id: options.id,
      role: "gridcell",
      "aria-colindex": options.columnIndex,
      "?data-active": active,
      ref: register,
    }) as const;
}
type CellInternalProps<Options extends CellOptions> = ReturnType<
  ReturnType<typeof cellInternalProps<Options>>
>;

/**
 * Renders and optionally registers one gridcell with row and column coordinates.
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
 * Import with `import { Cell } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Replace the linked program's final
 * snapshot read with `Cell({ state, id: "src-name", rowId: "src", columnIndex: 1, content: "src"
 * })`; render that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Cell<const Options extends CellOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
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
    CellInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, cellInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by TreeGrid.Group in addition to the shared DOM host options.
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
 * Import with `import type { GroupOptions } from "@typed/ui/TreeGrid";` Extend the
 * [TreeGrid.makeState runnable setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Relate
 * descendant rows to their branch with
 * `const options: GroupOptions = { state, parentId: "src", content: "Rows" }`.
 * @since 1.0.0
 * @category models
 */
export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category models
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Id whose expansion controls this descendant group.
   * @since 1.0.0
   * @category models
   */
  readonly parentId: string;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function groupInternalProps<const Options extends GroupOptions>(options: Options) {
  return () =>
    ({
      role: "rowgroup",
      "?hidden": RefSubject.map(options.state, (state) => !isExpanded(state, options.parentId)),
    }) as const;
}
type GroupInternalProps<Options extends GroupOptions> = ReturnType<
  ReturnType<typeof groupInternalProps<Options>>
>;

/**
 * Renders a rowgroup and hides it while its parent row is collapsed.
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
 * Import with `import { Group } from "@typed/ui/TreeGrid";` Extend the [TreeGrid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FTreeGrid%23makeState). Replace the linked program's final
 * snapshot read with `Group({ state, parentId: "src", content: "Rows" })`; render that Fx before
 * the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, GroupInternalProps<Options>>,
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
    GroupInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    groupInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

function onKeyDown(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<CellPosition>>,
  event: KeyboardEvent,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const all = yield* collection;
    const visible = visibleItems(all, current);
    const active =
      current.activeId === null ? undefined : all.find((item) => item.id === current.activeId);
    const activeValue = active?.value;
    if (
      activeValue?.columnIndex === 1 &&
      (event.key === "ArrowRight" || event.key === "ArrowLeft")
    ) {
      if (event.key === "ArrowRight" && activeValue.hasChildren) {
        event.preventDefault();
        if (!isExpanded(current, activeValue.rowId)) return yield* expand(state, activeValue.rowId);
        const child = visible.find(
          (item) => item.value?.parentId === activeValue.rowId && item.value?.columnIndex === 1,
        );
        return child === undefined ? current : yield* activate(state, child.id);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (activeValue.hasChildren && isExpanded(current, activeValue.rowId))
          return yield* collapse(state, activeValue.rowId);
        const parent =
          activeValue.parentId === undefined
            ? undefined
            : visible.find(
                (item) =>
                  item.value?.rowId === activeValue.parentId && item.value?.columnIndex === 1,
              );
        return parent === undefined ? current : yield* activate(state, parent.id);
      }
    }
    const next = Grid.moveActiveId(visible, current.activeId, event);
    if (next === undefined) return current;
    event.preventDefault();
    return yield* activate(state, next);
  });
}

function visibleItems(
  items: Collection.State<CellPosition>,
  state: State,
): readonly Collection.Item<CellPosition>[] {
  const ordered = Collection.byDomOrder(items);
  return ordered.filter((item) => {
    let parentId = item.value?.parentId;
    while (parentId !== undefined) {
      if (!isExpanded(state, parentId)) return false;
      parentId = ordered.find((candidate) => candidate.value?.rowId === parentId)?.value?.parentId;
    }
    return true;
  });
}
