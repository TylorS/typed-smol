import { html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface RoleOptions {
  readonly content?: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly role?: ReactiveValue<string | undefined, any, any>;
}

export function Role<const Opts extends RoleOptions>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role=${options.role}>${options.content}</div>`;
}
