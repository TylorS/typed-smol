import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly label?: ReactiveValue<string | undefined, any, any>;
  readonly labelledBy?: ReactiveValue<string | undefined, any, any>;
}

export function Group<const Opts extends GroupOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    role: "group",
    "aria-label": options.label,
    "aria-labelledby": options.labelledBy,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div
    id=${options.id}
    role="group"
    aria-label=${options.label}
    aria-labelledby=${options.labelledBy}
  >
    ${options.content}
  </div>`;
}

export interface LabelOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly content: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, { id: options.id });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<span ...${props}>${options.content}</span>`;
}
