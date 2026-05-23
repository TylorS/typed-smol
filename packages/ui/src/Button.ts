import { html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { AnyContent, Component, AnyValue } from "./Reactive.js";

type ButtonType = "button" | "submit" | "reset";

export interface ButtonOptions<E = any, R = any> extends Dom.HostOptions<HTMLButtonElement> {
  readonly content: AnyContent;
  readonly type?: AnyValue<ButtonType | undefined>;
  readonly disabled?: AnyValue<boolean | undefined>;
  readonly onclick?: Dom.EventHandlerInput<Dom.EventOf<HTMLButtonElement["onclick"]>, E, R>;
}

export function Button<const E, const R, const Opts extends ButtonOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    type: options.type ?? "button",
    "?disabled": options.disabled ?? false,
    onclick: options.onclick,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<button ...${props}>${options.content}</button>`;
}
