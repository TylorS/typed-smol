import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/** Current value displayed by the meter.
 * @remarks
 * ## Why
 * Renderer-independent state can be updated and tested before a meter mounts.
 * ## Ownership and lifetime
 * Plain state acquires no resources; the hydrated RefSubject owns observation.
 * @since 1.0.0
 * @category state
 */
export interface State {
  /** Finite scalar reflected to the native meter value.
   * @remarks
   * ## Why
   * One value drives DOM output and state consumers consistently.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
}

/** Initial finite meter value.
 * @remarks
 * ## Why
 * Explicit input makes the hydration snapshot deterministic.
 * ## Ownership and lifetime
 * Configuration is inert and copied into state.
 * @since 1.0.0
 * @category state
 */
export interface InitialState {
  /** Value used for the initial snapshot.
   * @remarks
   * ## Why
   * The native meter needs a concrete value independent of its range metadata.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
}

/** Schema for serializing finite meter state.
 * @remarks
 * ## Why
 * Rejecting non-finite values keeps SSR and native DOM output valid.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({ value: Schema.Finite });

/** Creates hydrated meter state.
 * @remarks
 * ## Why
 * The state remains testable and reusable without rendering a UI component.
 * ## Ownership and lifetime
 * The caller's Effect Scope owns the hydrated RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Meter from "@typed/ui/Meter"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Meter.makeState({ value: 0.72 })
 * })
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, initial);
}

/** Updates the displayed meter value.
 * @remarks
 * ## Why
 * State transitions stay outside rendering and preserve typed error/services.
 * ## Ownership and lifetime
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Meter from "@typed/ui/Meter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Meter.makeState({ value: 0 })
 *   yield* Meter.setValue(state, 0.75)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, value }));
}

/** Native meter range, threshold, content, and state options.
 * @remarks
 * ## Why
 * These mirror the platform meter element rather than reimplementing its
 * accessibility and range interpretation.
 * ## Ownership and lifetime
 * Options are inert; rendering owns reactive subscriptions by Scope.
 * @since 1.0.0
 * @category models
 */
export interface MeterOptions extends Dom.HostOptions<HTMLMeterElement> {
  /** Hydrated value state borrowed by the element.
   * @remarks
   * ## Why
   * One source keeps the native value and application state aligned.
   * ## Ownership and lifetime
   * Its original Scope owns it; the component only subscribes while mounted.
   * @since 1.0.0
   * @category state
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Lower bound of the measured range.
   * @remarks
   * ## Why
   * Native meter semantics use the bound to interpret `value`.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly min?: Renderable.Any<number | null | undefined>;
  /** Upper bound of the measured range.
   * @remarks
   * ## Why
   * Native meter semantics use the bound to interpret `value`.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly max?: Renderable.Any<number | null | undefined>;
  /** Boundary below which values are considered low.
   * @remarks
   * ## Why
   * The browser uses this native threshold with `high` and `optimum`.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly low?: Renderable.Any<number | null | undefined>;
  /** Boundary above which values are considered high.
   * @remarks
   * ## Why
   * It preserves native threshold semantics and accessibility exposure.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly high?: Renderable.Any<number | null | undefined>;
  /** Preferred value within the meter range.
   * @remarks
   * ## Why
   * Native rendering interprets threshold quality relative to this value.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly optimum?: Renderable.Any<number | null | undefined>;
  /** Fallback content rendered inside the meter.
   * @remarks
   * ## Why
   * Text content provides useful output where meter rendering is unavailable.
   * ## Ownership and lifetime
   * Dynamic content follows the component Scope.
   * @since 1.0.0
   * @category content
   */
  readonly content?: Renderable.Any;
}

function internalProps<const Options extends MeterOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      value: RefSubject.map(options.state, (state) => state.value),
      min: property("min", undefined),
      max: property("max", undefined),
      low: property("low", undefined),
      high: property("high", undefined),
      optimum: property("optimum", undefined),
      ref: options.state,
    }) as const;
}
type MeterInternalProps<Options extends MeterOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/** Renders a native `<meter>` synchronized with hydrated state.
 * @remarks
 * ## Why
 * The platform owns range semantics and accessibility while Typed composes
 * reactive state and custom hosts around the real element.
 * ## Ownership and lifetime
 * Running the Fx owns attribute/state subscriptions until its Scope closes. A
 * custom host must preserve native meter attributes and the hydration ref.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Meter from "@typed/ui/Meter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Meter.makeState({ value: 64 })
 *   return Meter.Meter({ state, min: 0, max: 100 })
 * })
 * ```
 * @since 1.0.0
 * @category components
 */
export function Meter<const Options extends MeterOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, MeterInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLMeterElement>()<
    Options,
    MeterInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, internalProps(options), options.content ?? "", (props, content) => {
    return html`<meter ...${props}>${content}</meter>`;
  });
}
