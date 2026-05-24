import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { AnyContent, Component, AnyValue } from "./Reactive.js";

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: AnyContent;
  readonly id?: AnyValue<string | undefined>;
  readonly label?: AnyValue<string | undefined>;
  readonly labelledBy?: AnyValue<string | undefined>;
}

export function Group<const Opts extends GroupOptions>(options: Opts): Component<Opts> {
  const props = {
    id: options.id,
    role: "group",
    "aria-label": options.label,
    "aria-labelledby": options.labelledBy,
  };
  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) =>
    html`<div ...${props}>${content}</div>`,
  );
}

export interface LabelOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly content: AnyContent;
  readonly id?: AnyValue<string | undefined>;
}

export function Label<const Opts extends LabelOptions>(options: Opts): Component<Opts> {
  const props = { id: options.id };
  return Dom.renderHost<HTMLSpanElement, Opts>(options, props, options.content, (props, content) =>
    html`<span ...${props}>${content}</span>`,
  );
}
