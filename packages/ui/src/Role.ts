import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { AnyContent, Component, AnyValue } from "./Reactive.js";

export interface RoleOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content?: AnyContent;
  readonly id?: AnyValue<string | undefined>;
  readonly role?: AnyValue<string | undefined>;
}

export function Role<const Opts extends RoleOptions>(options: Opts): Component<Opts> {
  const props = { id: options.id, role: options.role };
  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content ?? "", (props, content) =>
    html`<div ...${props}>${content}</div>`,
  );
}
