import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export type ButtonType = "button" | "submit" | "reset";

export interface ButtonOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly content: Renderable.Any;
  readonly type?: Renderable.Any<ButtonType | null | undefined>;
  readonly disabled?: Renderable.Any<boolean | null | undefined>;
  readonly onclick?: Dom.EventHandlerInput<Dom.EventOf<HTMLButtonElement["onclick"]>>;
}

function internalProps<const Options extends ButtonOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return {
    type: property("type", "button"),
    "?disabled": property("disabled", false),
  };
}

type ButtonInternalProps<Options extends ButtonOptions> = ReturnType<typeof internalProps<Options>>;

export function Button<const Options extends ButtonOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ButtonInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}
