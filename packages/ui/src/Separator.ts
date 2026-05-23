import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Value as ReactiveValue } from "./Reactive.js";

export interface SeparatorOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly orientation?: ReactiveValue<"horizontal" | "vertical" | undefined, any, any>;
}

export function Separator<const Opts extends SeparatorOptions = {}>(
  options = {} as Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    role: "separator",
    "aria-orientation": options.orientation ?? "horizontal",
  });
  if (options.host) return options.host(props, "") as Component<Opts>;

  return html`<div ...${props}></div>`;
}
