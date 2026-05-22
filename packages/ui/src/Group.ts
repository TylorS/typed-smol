import { html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface GroupOptions {
  readonly content: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly label?: ReactiveValue<string | undefined, any, any>;
  readonly labelledBy?: ReactiveValue<string | undefined, any, any>;
}

export function Group<const Opts extends GroupOptions>(options: Opts): Component<Opts> {
  return html`<div
    id=${options.id}
    role="group"
    aria-label=${options.label}
    aria-labelledby=${options.labelledBy}
  >
    ${options.content}
  </div>`;
}

export interface LabelOptions {
  readonly content: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  return html`<span id=${options.id}>${options.content}</span>`;
}
