import { html } from "@typed/template";
import * as Button from "./Button.js";
import type { Component } from "./Reactive.js";

export interface CommandOptions extends Button.ButtonOptions {}

export function Command<const Opts extends CommandOptions>(options: Opts): Component<Opts> {
  return html`${Button.Button(options)}`;
}
