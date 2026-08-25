import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface State {
  readonly checked: boolean;
}

export interface InitialState {
  readonly checked?: boolean;
}

export const StateSchema = Schema.Struct({ checked: Schema.Boolean });

export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { checked: initial.checked ?? false });
}

export function setChecked<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  checked: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked: !current.checked }));
}

export interface SwitchOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
}

function internalProps<const Options extends SwitchOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "button",
      role: "switch",
      "aria-checked": RefSubject.map(options.state, (state) => state.checked),
      "?disabled": property("disabled", false),
      onclick: EventHandler.make(() => toggle(options.state)),
      ref: options.state,
    }) as const;
}
type SwitchInternalProps<Options extends SwitchOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

export function Switch<const Options extends SwitchOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SwitchInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    SwitchInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, internalProps(options), options.content, (props, content) => {
    return html`<button ...${props}>${content}</button>`;
  });
}
