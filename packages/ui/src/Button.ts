import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

type ButtonType = "button" | "submit" | "reset";

export interface ButtonOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly content: Content;
  readonly type?: ReactiveValue<ButtonType | undefined, any, any>;
  readonly disabled?: ReactiveValue<boolean | undefined, any, any>;
  readonly onclick?: Dom.EventHandlerInput<Dom.EventOf<HTMLButtonElement["onclick"]>, any, any>;
}

export function Button<const Opts extends ButtonOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    type: options.type ?? "button",
    "?disabled": options.disabled ?? false,
    onclick: options.onclick,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<button ...${props}>${options.content}</button>`;
}
