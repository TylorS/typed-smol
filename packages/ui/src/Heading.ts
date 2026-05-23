import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { AnyContent, Component, AnyValue } from "./Reactive.js";

export interface HeadingOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: AnyContent;
  readonly id?: AnyValue<string | undefined>;
  readonly level?: AnyValue<number | undefined>;
}

export function Heading<const Opts extends HeadingOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    role: "heading",
    "aria-level": options.level ?? 1,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div ...${props}>${options.content}</div>`;
}

export const Level = Heading;
export const HeadingLevel = Heading;
