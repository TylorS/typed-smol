import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { AnyContent, Component, AnyValue } from "./Reactive.js";

export interface HeadingOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: AnyContent;
  readonly id?: AnyValue<string | undefined>;
  readonly level?: AnyValue<number | undefined>;
}

export function Heading<const Opts extends HeadingOptions>(options: Opts): Component<Opts> {
  const props = {
    id: options.id,
    role: "heading",
    "aria-level": options.level ?? 1,
  };
  return Dom.renderHost<HTMLDivElement, Opts>(options, props, options.content, (props, content) =>
    html`<div ...${props}>${content}</div>`,
  );
}

export const Level = Heading;
export const HeadingLevel = Heading;
