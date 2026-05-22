import { html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface FocusableOptions {
  readonly content: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly role?: ReactiveValue<string | undefined, any, any>;
  readonly tabIndex?: ReactiveValue<number | undefined, any, any>;
}

export function Focusable<const Opts extends FocusableOptions>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role=${options.role} tabindex=${options.tabIndex ?? 0}>
    ${options.content}
  </div>`;
}
