import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface RoleOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
  readonly role: Renderable.Any<string | null | undefined>;
}

function internalProps<const Options extends RoleOptions>({ property }: Dom.InternalPropsHelpers<Options>) {
  return { role: property("role", undefined) };
}

type RoleInternalProps<Options extends RoleOptions> = ReturnType<typeof internalProps<Options>>;

export function Role<const Options extends RoleOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RoleInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    RoleInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
