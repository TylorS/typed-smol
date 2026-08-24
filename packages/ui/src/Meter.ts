import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface State {
  readonly value: number;
}

export interface InitialState {
  readonly value: number;
}

export const StateSchema = Schema.Struct({ value: Schema.Finite });

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, initial);
}

export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, value }));
}

export interface MeterOptions extends Dom.HostOptions<HTMLMeterElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly min?: Renderable.Any<number | null | undefined>;
  readonly max?: Renderable.Any<number | null | undefined>;
  readonly low?: Renderable.Any<number | null | undefined>;
  readonly high?: Renderable.Any<number | null | undefined>;
  readonly optimum?: Renderable.Any<number | null | undefined>;
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
    const { props: attributes, ref } = Dom.splitRef(props);
    return html`<meter ...${attributes} ref=${ref}>${content}</meter>`;
  });
}
