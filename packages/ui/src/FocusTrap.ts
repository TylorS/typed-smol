import { html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface FocusTrapOptions {
  readonly content: Content;
  readonly active?: ReactiveValue<boolean | undefined, any, any>;
}

export function FocusTrap<const Opts extends FocusTrapOptions>(options: Opts): Component<Opts> {
  return html`<div tabindex="-1" data-active=${options.active}>${options.content}</div>`;
}

export const Region = FocusTrap;
export const FocusTrapRegion = FocusTrap;

