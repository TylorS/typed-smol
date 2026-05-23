import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Content } from "./Reactive.js";

export interface VisuallyHiddenOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly content: Content;
}

export function VisuallyHidden<const Opts extends VisuallyHiddenOptions>(
  options: Opts,
): Component<Opts> {
  const style =
    "border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px";
  const props = Dom.mergeProps(options.props, { style });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<span ...${props}>${options.content}</span>`;
}
