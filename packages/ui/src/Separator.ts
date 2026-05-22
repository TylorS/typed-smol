import { html } from "@typed/template";
import type { Component, Value as ReactiveValue } from "./Reactive.js";

export interface SeparatorOptions {
  readonly orientation?: ReactiveValue<"horizontal" | "vertical" | undefined, any, any>;
}

export function Separator<const Opts extends SeparatorOptions = {}>(
  options = {} as Opts,
): Component<Opts> {
  return html`<div role="separator" aria-orientation=${options.orientation ?? "horizontal"}></div>`;
}
