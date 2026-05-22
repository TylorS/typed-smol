import { EventHandler, html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

type ButtonType = "button" | "submit" | "reset";

export interface ButtonOptions {
  readonly content: Content;
  readonly type?: ReactiveValue<ButtonType | undefined, any, any>;
  readonly disabled?: ReactiveValue<boolean | undefined, any, any>;
  readonly onclick?: Parameters<typeof EventHandler.fromEffectOrEventHandler>[0];
}

export function Button<const Opts extends ButtonOptions>(options: Opts): Component<Opts> {
  return html`<button
    type=${options.type ?? "button"}
    ?disabled=${options.disabled ?? false}
    onclick=${options.onclick}
  >
    ${options.content}
  </button>`;
}
