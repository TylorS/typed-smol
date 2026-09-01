/**
 * Grid is a virtual-focus ARIA grid. The root retains DOM focus while the active cell id is
 * exposed through aria-activedescendant; CellPosition supplies row and column coordinates for
 * two-dimensional movement.
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
import type { HostResult } from "./Dom/Types.js";

/**
 * Complete renderer-independent state for Grid.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Grid behavior without mounting or coupling the state
 * to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Grid";` Extend the [Grid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FGrid%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes the active grid-cell id.
 * @since 1.0.0
 * @category models
 */
export interface State {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category models
   */
  readonly activeId: string | null;
}

/**
 * Initial Grid values. activeId defaults to null.
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
 * Import with `import type { InitialState } from "@typed/ui/Grid";` Extend the [Grid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FGrid%23makeState). Construct state with
 * `const initial: InitialState = { activeId: "r1c1" }; const state = yield* Grid.makeState(initial)`.
 * @since 1.0.0
 * @category models
 */
export interface InitialState {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category models
   */
  readonly activeId?: string | null;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate Grid state.
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
 * import * as Grid from "@typed/ui/Grid";
 *
 * const decodeState = Schema.decodeUnknownEffect(Grid.StateSchema);
 * ```
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({ activeId: Schema.NullOr(Schema.String) });

/**
 * Creates hydrated Grid state. activeId defaults to null.
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
 * import * as Grid from "@typed/ui/Grid";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Grid.makeState({});
 *     const collection = yield* Grid.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { activeId: initial.activeId ?? null });
}

/**
 * Logical coordinates stored with each registered Grid cell.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Grid's deterministic policy without copying an
 * internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { CellPosition } from "@typed/ui/Grid";` Extend the [Grid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FGrid%23makeState). A registered cell identifies its
 * logical row and one-based column:
 * `const position: CellPosition = { rowId: "r1", columnIndex: 1 }`.
 * @since 1.0.0
 * @category models
 */
export interface CellPosition {
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
}

/**
 * Creates a scoped Collection for Grid items.
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
 * import * as Grid from "@typed/ui/Grid";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Grid.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category constructors
 */
export const makeCollection = Collection.makeState<CellPosition>;

/**
 * Sets activeId, including null to clear virtual focus.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Grid's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { activate } from "@typed/ui/Grid";` Extend the [Grid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FGrid%23makeState). Inside the linked Effect program invoke
 * `yield* activate(state, "item-2")`, then read the state snapshot to observe the transition
 * described above.
 * @since 1.0.0
 * @category combinators
 */
export function activate<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  activeId: string | null,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

/**
 * Inputs accepted by Grid.Root in addition to the shared DOM host options.
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
 * Import with `import type { RootOptions } from "@typed/ui/Grid";` Extend the [Grid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FGrid%23makeState). Wire keyboard navigation with
 * `const options: RootOptions = { state, collection, label: "Schedule", content: "Rows" }`.
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
  /**
   * Whether aria-multiselectable is announced on the grid.
   * @since 1.0.0
   * @category models
   */
  readonly multiselectable?: Renderable.Any<boolean | null | undefined>;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          if ((yield* options.state).activeId !== null) return;
          const first = Collection.byDomOrder(yield* options.collection!)[0];
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
      role: "grid",
      tabindex: 0,
      "aria-label": property("label", undefined),
      "aria-activedescendant": RefSubject.map(
        options.state,
        (state) => state.activeId ?? undefined,
      ),
      "aria-multiselectable": property("multiselectable", false),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

/**
 * Renders the focus-owning grid root and initializes the active cell from DOM order on first
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
 * Import with `import { Root } from "@typed/ui/Grid";` Extend the [Grid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FGrid%23makeState). Replace the linked program's final snapshot
 * read with `Root({ state, label: "Schedule", content: "Rows" })`; render that Fx before the same
 * Scope closes.
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
 * Inputs accepted by Grid.Row in addition to the shared DOM host options.
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
 * Import with `import type { RowOptions } from "@typed/ui/Grid";` Extend the [Grid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FGrid%23makeState). Expose optional ARIA position with
 * `const options: RowOptions = { rowIndex: 1, content: "Cells" }`.
 * @since 1.0.0
 * @category models
 */
export interface RowOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
  /**
   * Optional one-based aria-rowindex value supplied by the caller.
   * @since 1.0.0
   * @category models
   */
  readonly rowIndex?: Renderable.Any<number | null | undefined>;
}

function rowInternalProps<const Options extends RowOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return { role: "row", "aria-rowindex": property("rowIndex", undefined) } as const;
}
type RowInternalProps<Options extends RowOptions> = ReturnType<typeof rowInternalProps<Options>>;

/**
 * Renders an ARIA row and forwards an optional one-based aria-rowindex.
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
 * import * as Grid from "@typed/ui/Grid";
 *
 * const view = Grid.Row({ rowIndex: 1, content: "Cells" });
 * ```
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
    rowInternalProps,
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

/**
 * Inputs accepted by Grid.Cell in addition to the shared DOM host options.
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
 * Import with `import type { CellOptions } from "@typed/ui/Grid";` Extend the [Grid.makeState
 * runnable setup](/reference/%40typed%2Fui%2FGrid%23makeState). A navigable cell is
 * `const options: CellOptions = { state, collection, id: "r1c1", rowId: "r1", columnIndex: 1, content: "Monday" }`.
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
   * Optional one-based aria-rowindex value supplied by the caller.
   * @since 1.0.0
   * @category models
   */
  readonly rowIndex?: number;
  /**
   * Optional selected state exposed through aria-selected.
   * @since 1.0.0
   * @category models
   */
  readonly selected?: Renderable.Any<boolean | null | undefined>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

function cellInternalProps<const Options extends CellOptions>(
  options: Options,
  role: "gridcell" | "columnheader" | "rowheader",
) {
  const active = RefSubject.map(options.state, (state) => state.activeId === options.id);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: { rowId: options.rowId, columnIndex: options.columnIndex },
          textValue: options.id,
        });
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.id,
      role,
      "aria-colindex": options.columnIndex,
      "aria-rowindex": property("rowIndex", undefined),
      "aria-selected": property("selected", undefined),
      "?data-active": active,
      ref: register,
    }) as const;
}
type CellInternalProps<Options extends CellOptions> = ReturnType<
  ReturnType<typeof cellInternalProps<Options>>
>;

function cell<const Options extends CellOptions, const Host extends HostResult>(
  options: Options,
  host:
    | Dom.HostOverride<
        Dom.RenderHostProps<Options, CellInternalProps<Options>>,
        Options["content"],
        Host
      >
    | undefined,
  role: "gridcell" | "columnheader" | "rowheader",
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    CellInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, cellInternalProps(options, role), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Renders and optionally registers a gridcell with row and column coordinates.
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
 * Import with `import { Cell } from "@typed/ui/Grid";` Extend the [Grid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FGrid%23makeState). Replace the linked program's final snapshot
 * read with `Cell({ state, id: "r1c1", rowId: "r1", columnIndex: 1, content: "Monday" })`; render
 * that Fx before the same Scope closes.
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
) {
  return cell(options, host, "gridcell");
}

/**
 * Renders the Cell contract with the columnheader role.
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
 * Import with `import { ColumnHeader } from "@typed/ui/Grid";` Extend the [Grid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FGrid%23makeState). Replace the linked program's final snapshot
 * read with `ColumnHeader({ state, id: "day", rowId: "headers", columnIndex: 1, content: "Day" })`;
 * render that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function ColumnHeader<
  const Options extends CellOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return cell(options, host, "columnheader");
}

/**
 * Renders the Cell contract with the rowheader role.
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
 * Import with `import { RowHeader } from "@typed/ui/Grid";` Extend the [Grid.makeState runnable
 * setup](/reference/%40typed%2Fui%2FGrid%23makeState). Replace the linked program's final snapshot
 * read with `RowHeader({ state, id: "week-1", rowId: "week-1", columnIndex: 1, content: "Week 1"
 * })`; render that Fx before the same Scope closes.
 * @since 1.0.0
 * @category components
 */
export function RowHeader<const Options extends CellOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return cell(options, host, "rowheader");
}

function onKeyDown(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<CellPosition>>,
  event: KeyboardEvent,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const items = Collection.byDomOrder(yield* collection);
    const next = moveActiveId(items, (yield* state).activeId, event);
    if (next === undefined) return yield* state;
    event.preventDefault();
    return yield* activate(state, next);
  });
}

/**
 * Maps grid keys to a cell id: horizontal movement stays in-row, vertical movement stays
 * in-column, and Ctrl+Home/End reaches grid endpoints.
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
 * import * as Grid from "@typed/ui/Grid";
 *
 * const nextId = Grid.moveActiveId([{ id: "a", value: { rowId: "r1", columnIndex: 1 } }], "a", { key: "ArrowRight", ctrlKey: false });
 * ```
 * @since 1.0.0
 * @category combinators
 */
export function moveActiveId(
  items: readonly Collection.Item<CellPosition>[],
  activeId: string | null,
  event: Pick<KeyboardEvent, "key" | "ctrlKey">,
): string | undefined {
  if (items.length === 0) return undefined;
  if (event.ctrlKey && event.key === "Home") return items[0]?.id;
  if (event.ctrlKey && event.key === "End") return items.at(-1)?.id;
  const active = activeId === null ? undefined : items.find((item) => item.id === activeId);
  if (active === undefined || active.value === undefined)
    return event.key === "Home" ? items[0]?.id : undefined;
  const row = items.filter((item) => item.value?.rowId === active.value!.rowId);
  if (event.key === "ArrowLeft") return row.at(Math.max(0, row.indexOf(active) - 1))?.id;
  if (event.key === "ArrowRight")
    return row.at(Math.min(row.length - 1, row.indexOf(active) + 1))?.id;
  if (event.key === "Home") return row[0]?.id;
  if (event.key === "End") return row.at(-1)?.id;
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return undefined;

  const column = items.filter((item) => item.value?.columnIndex === active.value!.columnIndex);
  return column.at(column.indexOf(active) + (event.key === "ArrowUp" ? -1 : 1))?.id ?? active.id;
}
