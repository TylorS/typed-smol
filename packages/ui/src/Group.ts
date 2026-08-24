import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
  readonly label?: Renderable.Any<string | null | undefined>;
  readonly labelledBy?: Renderable.Any<string | null | undefined>;
}

function internalProps<const Options extends GroupOptions>({ property }: Dom.InternalPropsHelpers<Options>) {
  return {
    role: "group",
    "aria-label": property("label", undefined),
    "aria-labelledby": property("labelledBy", undefined),
  };
}

type GroupInternalProps<Options extends GroupOptions> = ReturnType<typeof internalProps<Options>>;

export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, GroupInternalProps<Options>>, Options["content"], Host>,
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

export interface LabelOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly content: Renderable.Any;
}

export function Label<const Options extends LabelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, Record<never, never>>, Options["content"], Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()(
    options,
    host,
    () => ({}),
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}
