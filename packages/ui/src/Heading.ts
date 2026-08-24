import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface HeadingOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
  readonly level?: Renderable.Any<number | null | undefined>;
}

function internalProps<const Options extends HeadingOptions>({ property }: Dom.InternalPropsHelpers<Options>) {
  return { role: "heading", "aria-level": property("level", 1) };
}

type HeadingInternalProps<Options extends HeadingOptions> = ReturnType<typeof internalProps<Options>>;

export function Heading<const Options extends HeadingOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, HeadingInternalProps<Options>>,
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

export const Level = Heading;
export const HeadingLevel = Heading;
