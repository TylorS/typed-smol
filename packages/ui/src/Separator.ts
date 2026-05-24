import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, AnyValue } from "./Reactive.js";

export interface SeparatorOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly orientation?: AnyValue<"horizontal" | "vertical" | undefined>;
}

export function Separator<const Opts extends SeparatorOptions = {}>(
  options = {} as Opts,
): Component<Opts> {
  const props = {
    role: "separator",
    "aria-orientation": options.orientation ?? "horizontal",
  };
  return Dom.renderHost<HTMLDivElement, Opts>(options, props, "", (props) =>
    html`<div ...${props}></div>`,
  );
}
