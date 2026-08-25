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

export interface SpinButtonOptions extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly min?: Renderable.Any<number | null | undefined>;
  readonly max?: Renderable.Any<number | null | undefined>;
  readonly step?: Renderable.Any<number | "any" | null | undefined>;
}

function internalProps<const Options extends SpinButtonOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "number",
      value: RefSubject.map(options.state, (state) => state.value),
      min: property("min", undefined),
      max: property("max", undefined),
      step: property("step", undefined),
      onchange: EventHandler.make((event: Event) =>
        setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).valueAsNumber),
      ),
      ref: options.state,
    }) as const;
}
type SpinButtonInternalProps<Options extends SpinButtonOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

export function SpinButton<
  const Options extends SpinButtonOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SpinButtonInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    SpinButtonInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<input ...${props} />`;
  });
}
