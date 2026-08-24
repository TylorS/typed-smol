import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface AlertOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
}

function internalProps() {
  return { role: "alert" } as const;
}
type AlertInternalProps = ReturnType<typeof internalProps>;

/** A non-modal live region. For an interrupting confirmation, use Dialog with role="alertdialog". */
export function Alert<const Options extends AlertOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, AlertInternalProps>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
