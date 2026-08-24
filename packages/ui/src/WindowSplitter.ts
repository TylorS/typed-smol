import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export type Orientation = "horizontal" | "vertical";

export interface State {
  readonly value: number;
  readonly previousValue: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly orientation: Orientation;
}

export interface InitialState {
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly orientation?: Orientation;
}

export const StateSchema = Schema.Struct({
  value: Schema.Finite,
  previousValue: Schema.Finite,
  min: Schema.Finite,
  max: Schema.Finite,
  step: Schema.Finite,
  orientation: Schema.Literals(["horizontal", "vertical"]),
});

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

export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value: clamp(value, current.min, current.max),
  }));
}

export function adjust<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  delta: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value: clamp(current.value + delta, current.min, current.max),
  }));
}

export function toggleCollapsed<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) =>
    current.value === current.min
      ? { ...current, value: clamp(current.previousValue, current.min, current.max) }
      : { ...current, previousValue: current.value, value: current.min },
  );
}

export interface WindowSplitterOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly primaryPaneId: Renderable.Any<string | null | undefined>;
  readonly label?: Renderable.Any<string | null | undefined>;
  readonly valueText?: Renderable.Any<string | null | undefined>;
  readonly disabled?: Renderable.Any<boolean | null | undefined>;
}

function internalProps<const Options extends WindowSplitterOptions>(options: Options) {
  const onkeydown = EventHandler.make((event: KeyboardEvent) =>
    Effect.gen(function* () {
      const current = yield* options.state;
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
    const { props: attributes, ref } = Dom.splitRef(props);
    return html`<div ...${attributes} ref=${ref}></div>`;
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
