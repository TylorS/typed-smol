import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface SeparatorOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly orientation?: Renderable.Any<"horizontal" | "vertical" | null | undefined>;
}

function internalProps<const Options extends SeparatorOptions>({ property }: Dom.InternalPropsHelpers<Options>) {
  return { role: "separator", "aria-orientation": property("orientation", "horizontal") };
}

type SeparatorInternalProps<Options extends SeparatorOptions> = ReturnType<typeof internalProps<Options>>;

export function Separator<const Options extends SeparatorOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SeparatorInternalProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()(
    options,
    host,
    internalProps,
    "",
    (props) => html`<div ...${props}></div>`,
  );
}
