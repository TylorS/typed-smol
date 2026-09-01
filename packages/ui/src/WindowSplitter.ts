import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/** Visual orientation of the separator between panes.
 * @remarks
 * ## Why
 * A vertical separator adjusts with Left/Right; a horizontal separator adjusts
 * with Up/Down, matching the axis perpendicular to the dividing line.
 * ## Ownership and lifetime
 * This pure type acquires no resources.
 * @since 1.0.0
 * @category models
 */
export type Orientation = "horizontal" | "vertical";

/** Current value and keyboard policy for a window splitter.
 * @remarks
 * ## Why
 * All range and collapse information remains renderer-independent and directly
 * testable.
 * ## Ownership and lifetime
 * Plain state retains no resources; its hydrated RefSubject is Scope-owned.
 * @since 1.0.0
 * @category state
 */
export interface State {
  /** Current pane size value.
   * @remarks
   * ## Why
   * It drives `aria-valuenow` and keyboard adjustments.
   * ## Ownership and lifetime
   * Plain numeric data acquires no resources.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
  /** Restore value used by `toggleCollapsed`.
   * @remarks
   * ## Why
   * It starts at the initial clamped value. `toggleCollapsed` overwrites it only
   * when collapsing from a non-minimum value, then reads it when restoring.
   * Ordinary `setValue` and `adjust` calls do not update it.
   * ## Ownership and lifetime
   * Plain numeric data acquires no resources.
   * @since 1.0.0
   * @category state
   */
  readonly previousValue: number;
  /** Inclusive minimum pane value.
   * @remarks
   * ## Why
   * Updates clamp to this bound and Home jumps to it.
   * ## Ownership and lifetime
   * Plain numeric data acquires no resources.
   * @since 1.0.0
   * @category constraints
   */
  readonly min: number;
  /** Inclusive maximum pane value.
   * @remarks
   * ## Why
   * Updates clamp to this bound and End jumps to it.
   * ## Ownership and lifetime
   * Plain numeric data acquires no resources.
   * @since 1.0.0
   * @category constraints
   */
  readonly max: number;
  /** Keyboard adjustment increment.
   * @remarks
   * ## Why
   * Arrow keys require a deterministic application-defined change size. The
   * state constructor does not enforce positivity; callers must provide a
   * positive value for conventional keyboard direction.
   * ## Ownership and lifetime
   * Plain numeric data acquires no resources.
   * @since 1.0.0
   * @category constraints
   */
  readonly step: number;
  /** Separator orientation and keyboard axis.
   * @remarks
   * ## Why
   * The value drives both `aria-orientation` and valid arrow keys.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category accessibility
   */
  readonly orientation: Orientation;
}

/** Initial splitter range and keyboard configuration.
 * @remarks
 * ## Why
 * Defaults give the widget a complete deterministic state before rendering.
 * Callers remain responsible for `min <= max` and `step > 0`.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category state
 */
export interface InitialState {
  /** Initial pane size, clamped to min/max.
   * @remarks
   * ## Why
   * Invalid out-of-range starts become a valid accessible value.
   * ## Ownership and lifetime
   * Plain data is copied into state.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
  /** Minimum value, defaulting to zero.
   * @remarks
   * ## Why
   * It defines the collapsed boundary and Home result. Callers must ensure it is
   * less than or equal to `max`; neither the schema nor constructor compares them.
   * ## Ownership and lifetime
   * Plain data is copied into state.
   * @since 1.0.0
   * @category constraints
   */
  readonly min?: number;
  /** Maximum value, defaulting to one hundred.
   * @remarks
   * ## Why
   * It defines the upper keyboard and ARIA bound. Callers must ensure it is
   * greater than or equal to `min`; neither the schema nor constructor compares them.
   * ## Ownership and lifetime
   * Plain data is copied into state.
   * @since 1.0.0
   * @category constraints
   */
  readonly max?: number;
  /** Arrow-key increment, defaulting to ten.
   * @remarks
   * ## Why
   * The widget needs an explicit adjustment granularity. Callers must provide a
   * positive value; `Schema.Finite` rejects infinities and NaN but accepts zero
   * and negative numbers.
   * ## Ownership and lifetime
   * Plain data is copied into state.
   * @since 1.0.0
   * @category constraints
   */
  readonly step?: number;
  /** Separator orientation, defaulting to vertical.
   * @remarks
   * ## Why
   * Orientation determines ARIA output and arrow-key mapping.
   * ## Ownership and lifetime
   * Plain data is copied into state.
   * @since 1.0.0
   * @category accessibility
   */
  readonly orientation?: Orientation;
}

/** Schema for the structural splitter hydration state.
 * @remarks
 * ## Why
 * It validates finite numeric fields and the orientation union. It does not
 * enforce `min <= max`, a positive `step`, or any relationship among fields;
 * callers must satisfy those semantic preconditions.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({
  value: Schema.Finite,
  previousValue: Schema.Finite,
  min: Schema.Finite,
  max: Schema.Finite,
  step: Schema.Finite,
  orientation: Schema.Literals(["horizontal", "vertical"]),
});

/** Creates hydrated splitter state and clamps the initial value.
 * @remarks
 * ## Why
 * Pane sizing behavior can be composed and tested without mounting a separator.
 * Callers must supply `min <= max` and `step > 0`; the constructor defaults
 * omitted bounds/step but does not validate those relationships.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   return yield* WindowSplitter.makeState({ value: 320, min: 180, max: 640 })
 * })
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState) {
  const min = initial.min ?? 0;
  const max = initial.max ?? 100;
  const value = clamp(initial.value, min, max);
  return RefSubject.hydrate(StateSchema, {
    value,
    previousValue: value,
    min,
    max,
    step: initial.step ?? 10,
    orientation: initial.orientation ?? "vertical",
  });
}

/** Sets and clamps the current splitter value.
 * @remarks
 * ## Why
 * All callers share one transition bounded by the state's `min` and `max`.
 * Correct range ordering remains a caller precondition. This operation does not
 * change `previousValue`.
 * ## Ownership and lifetime
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320 })
 *   yield* WindowSplitter.setValue(state, 400)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value: clamp(value, current.min, current.max),
  }));
}

/** Adds a delta and clamps the resulting splitter value.
 * @remarks
 * ## Why
 * Arrow-key behavior can be tested independently of DOM events. Correct range
 * ordering remains a caller precondition, and this operation does not change
 * `previousValue`.
 * ## Ownership and lifetime
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320, step: 24 })
 *   yield* WindowSplitter.adjust(state, 24)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function adjust<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  delta: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value: clamp(current.value + delta, current.min, current.max),
  }));
}

/** Collapses to min or restores the recorded collapse value.
 * @remarks
 * ## Why
 * When the current value is not `min`, the operation records that exact value in
 * `previousValue` and collapses. At `min`, it restores the stored value after
 * clamping it to the current range. Other updates do not maintain a history.
 * ## Ownership and lifetime
 * The Effect updates existing state atomically and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320 })
 *   yield* WindowSplitter.toggleCollapsed(state)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function toggleCollapsed<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) =>
    current.value === current.min
      ? { ...current, value: clamp(current.previousValue, current.min, current.max) }
      : { ...current, previousValue: current.value, value: current.min },
  );
}

/** Options for the focusable ARIA window splitter.
 * @remarks
 * ## Why
 * The model connects renderer-independent sizing to its controlled pane and
 * accessible range metadata. Its state must already satisfy `min <= max` and a
 * positive `step`; the component does not repair invalid state.
 * ## Ownership and lifetime
 * Options are inert; rendering owns subscriptions/listeners by Scope.
 * @since 1.0.0
 * @category models
 */
export interface WindowSplitterOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Hydrated sizing state.
   * @remarks
   * ## Why
   * One source drives keyboard updates and every ARIA range attribute.
   * ## Ownership and lifetime
   * The splitter borrows state; its original Scope owns it.
   * @since 1.0.0
   * @category state
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Id of the pane controlled by the splitter.
   * @remarks
   * ## Why
   * `aria-controls` makes the resizing relationship explicit.
   * ## Ownership and lifetime
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category relationships
   */
  readonly primaryPaneId: Renderable.Any<string | null | undefined>;
  /** Accessible name when no external label is supplied.
   * @remarks
   * ## Why
   * A focusable separator needs a discoverable purpose.
   * ## Ownership and lifetime
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category accessibility
   */
  readonly label?: Renderable.Any<string | null | undefined>;
  /** Human-readable value text supplementing the number.
   * @remarks
   * ## Why
   * Pane sizes such as percentages or labels may be clearer than raw values.
   * ## Ownership and lifetime
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category accessibility
   */
  readonly valueText?: Renderable.Any<string | null | undefined>;
  /** Whether keyboard adjustments are disabled.
   * @remarks
   * ## Why
   * ARIA disabled state and handler behavior must agree.
   * ## Ownership and lifetime
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category accessibility
   */
  readonly disabled?: Renderable.Any<boolean | null | undefined>;
}

function internalProps<const Options extends WindowSplitterOptions>(options: Options) {
  const onkeydown = EventHandler.make(
    Effect.fn(function* (event: KeyboardEvent) {
      const current = yield* options.state;
      if (Dom.currentTarget<HTMLElement>(event).getAttribute("aria-disabled") === "true") {
        return current;
      }
      const delta = keyDelta(event.key, current);
      if (delta !== undefined) {
        event.preventDefault();
        return yield* adjust(options.state, delta);
      }
      if (event.key === "Home") {
        event.preventDefault();
        return yield* setValue(options.state, current.min);
      }
      if (event.key === "End") {
        event.preventDefault();
        return yield* setValue(options.state, current.max);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        return yield* toggleCollapsed(options.state);
      }
      return current;
    }),
  );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "separator",
      tabindex: 0,
      "aria-orientation": RefSubject.map(options.state, (state) => state.orientation),
      "aria-valuenow": RefSubject.map(options.state, (state) => state.value),
      "aria-valuemin": RefSubject.map(options.state, (state) => state.min),
      "aria-valuemax": RefSubject.map(options.state, (state) => state.max),
      "aria-controls": property("primaryPaneId", undefined),
      "aria-label": property("label", undefined),
      "aria-valuetext": property("valueText", undefined),
      "aria-disabled": property("disabled", false),
      onkeydown,
      ref: options.state,
    }) as const;
}
type WindowSplitterInternalProps<Options extends WindowSplitterOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/** Renders a focusable ARIA separator for resizing a pane.
 * @remarks
 * ## Why
 * The component exposes native DOM focus/events and the ARIA window-splitter
 * range contract: arrows adjust by step, Home/End reach bounds, and Enter
 * collapses/restores. Disabled state leaves key events inert.
 * ## Ownership and lifetime
 * Running the returned Fx owns real key listeners, reactive ARIA attributes,
 * and the hydration ref in its Effect Scope. A custom host must preserve role,
 * tab index, range/relationship attributes, handler, and one hydration owner.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320, min: 180, max: 640 })
 *   return WindowSplitter.WindowSplitter({ state, primaryPaneId: "navigation" })
 * })
 * ```
 * @since 1.0.0
 * @category components
 */
export function WindowSplitter<
  const Options extends WindowSplitterOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, WindowSplitterInternalProps<Options>>,
    "",
    Host
  >,
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    WindowSplitterInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<div ...${props}></div>`;
  });
}

function keyDelta(key: string, state: State): number | undefined {
  if (state.orientation === "vertical") {
    if (key === "ArrowLeft") return -state.step;
    if (key === "ArrowRight") return state.step;
    return undefined;
  }
  if (key === "ArrowUp") return -state.step;
  if (key === "ArrowDown") return state.step;
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
