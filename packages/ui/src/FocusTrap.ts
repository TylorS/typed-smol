import { html } from "@typed/template";
import type { Component, Content, Value as ReactiveValue } from "./Reactive.js";

export interface FocusTrapOptions {
  readonly content: Content;
  readonly active?: ReactiveValue<boolean | undefined, any, any>;
}

/**
 * @deprecated Prefer native `<dialog>` via `Dialog.Content` for modal focus.
 */
export function FocusTrap<const Opts extends FocusTrapOptions>(options: Opts): Component<Opts> {
  return html`<div tabindex="-1" data-active=${options.active} data-deprecated="FocusTrap">
    ${options.content}
  </div>`;
}

/** @deprecated Prefer native `<dialog>` via `Dialog.Content` for modal focus. */
export const Region = FocusTrap;
/** @deprecated Prefer native `<dialog>` via `Dialog.Content` for modal focus. */
export const FocusTrapRegion = FocusTrap;
