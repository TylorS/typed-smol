import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface FocusableOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly role?: ReactiveValue<string | undefined, any, any>;
  readonly tabIndex?: ReactiveValue<number | undefined, any, any>;
}

export function Focusable<const Opts extends FocusableOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    role: options.role,
    tabindex: options.tabIndex ?? 0,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
}
