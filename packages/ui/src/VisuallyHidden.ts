import { html } from "@typed/template";
import type { Component, Content } from "./Reactive.js";

export interface VisuallyHiddenOptions {
  readonly content: Content;
}

export function VisuallyHidden<const Opts extends VisuallyHiddenOptions>(
  options: Opts,
): Component<Opts> {
  return html`<span
    style="border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px"
  >
    ${options.content}
  </span>`;
}
