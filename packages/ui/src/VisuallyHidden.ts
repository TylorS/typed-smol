import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

const style =
  "border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px";

export interface VisuallyHiddenOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly content: Renderable.Any;
}

function internalProps() {
  return { style };
}

type VisuallyHiddenInternalProps = ReturnType<typeof internalProps>;

export function VisuallyHidden<
  const Options extends VisuallyHiddenOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, VisuallyHiddenInternalProps>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}
