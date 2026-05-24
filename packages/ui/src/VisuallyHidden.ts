import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { AnyContent, Component } from "./Reactive.js";

export interface VisuallyHiddenOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly content: AnyContent;
}

export function VisuallyHidden<const Opts extends VisuallyHiddenOptions>(
  options: Opts,
): Component<Opts> {
  const style =
    "border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px";
  const props = { style };
  return Dom.renderHost<HTMLSpanElement, Opts>(options, props, options.content, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}
