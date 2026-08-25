import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export type Checked = boolean | "mixed";

export interface State {
  readonly checked: Checked;
}

export interface InitialState {
  readonly checked?: Checked;
}

export const StateSchema = Schema.Struct({
  checked: Schema.Literals([true, false, "mixed"]),
});

export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { checked: initial.checked ?? false });
}

export function setChecked<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  checked: Checked,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    checked: current.checked === true ? false : true,
  }));
}

export interface InputOptions extends Dom.HostOptions<HTMLInputElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
}

function internalProps<const Options extends InputOptions>(options: Options) {
  const checked = RefSubject.map(options.state, (state) => state.checked === true);
  const indeterminate = RefSubject.map(options.state, (state) => state.checked === "mixed");
  const onChange = EventHandler.make((event: Event) =>
    setChecked(options.state, Dom.currentTarget<HTMLInputElement>(event).checked),
  );

  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    type: "checkbox",
    "aria-checked": RefSubject.map(options.state, (state) => state.checked),
    "?checked": checked,
    "?disabled": property("disabled", false),
    "?required": property("required", false),
    ".indeterminate": indeterminate,
    onchange: onChange,
    ref: options.state,
  });
}

type InputInternalProps<Options extends InputOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

export function Input<const Options extends InputOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    InputInternalProps<Options>,
    "",
    HostResult,
    Host
  >(
    options,
    host,
    internalProps(options),
    "",
    (i) => {
      return html`<input ...${i} />`;
    },
  );
}

export const Checkbox = Input;
