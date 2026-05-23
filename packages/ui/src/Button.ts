import { EventHandler, html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

type ButtonType = "button" | "submit" | "reset";

export interface ButtonOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly content: Content;
  readonly type?: ReactiveValue<ButtonType | undefined, any, any>;
  readonly disabled?: ReactiveValue<boolean | undefined, any, any>;
  readonly onclick?: Parameters<typeof EventHandler.fromEffectOrEventHandler>[0];
}

export function Button<const Opts extends ButtonOptions>(options: Opts): Component<Opts> {
  const props = {
    type: options.type ?? "button",
    "?disabled": options.disabled ?? false,
    onclick: options.onclick,
  } as const;

  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<button ...${props}>${options.content}</button>`;
}
