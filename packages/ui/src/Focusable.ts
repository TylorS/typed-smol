import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface FocusableOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
  readonly role?: Renderable.Any<string | null | undefined>;
  readonly tabIndex?: Renderable.Any<number | null | undefined>;
}

function internalProps<const Options extends FocusableOptions>({ property }: Dom.InternalPropsHelpers<Options>) {
  return {
    role: property("role", undefined),
    tabindex: property("tabIndex", 0),
  };
}

type FocusableInternalProps<Options extends FocusableOptions> = ReturnType<typeof internalProps<Options>>;

export function Focusable<const Options extends FocusableOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, FocusableInternalProps<Options>>,
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
