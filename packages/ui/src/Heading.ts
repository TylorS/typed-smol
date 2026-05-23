import { html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface HeadingOptions {
  readonly content: Content;
  readonly id?: ReactiveValue<string | undefined, any, any>;
  readonly level?: ReactiveValue<number | undefined, any, any>;
}

export function Heading<const Opts extends HeadingOptions>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level=${options.level ?? 1}>
    ${options.content}
  </div>`;
}

export const Level = Heading;
export const HeadingLevel = Heading;
