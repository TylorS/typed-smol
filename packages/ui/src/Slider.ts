import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable } from "@typed/template";
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

export interface SliderOptions extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly min?: Renderable.Any<number | null | undefined>;
  readonly max?: Renderable.Any<number | null | undefined>;
  readonly step?: Renderable.Any<number | "any" | null | undefined>;
}

function internalProps<const Options extends SliderOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "range",
      value: RefSubject.map(options.state, (state) => state.value),
      min: property("min", undefined),
      max: property("max", undefined),
      step: property("step", undefined),
      oninput: EventHandler.make((event: Event) =>
        setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).valueAsNumber),
      ),
      ref: options.state,
    }) as const;
}
type SliderInternalProps<Options extends SliderOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

export function Slider<const Options extends SliderOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SliderInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    SliderInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<input ...${props} />`;
  });
}
