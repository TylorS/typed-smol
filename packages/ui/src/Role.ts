import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface RoleOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content?: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly role?: ReactiveValue<string | undefined, any, any>;
}

export function Role<const Opts extends RoleOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, { id: options.id, role: options.role });
  if (options.host) return options.host(props, options.content ?? "") as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
}
