import { html } from "@typed/template";
import { gen } from "@typed/fx/Fx";
import * as Effect from "effect/Effect";
import type { Component, Content } from "./Reactive.js";

export interface PortalOptions {
  readonly content: Content;
  readonly target?: Element | null;
}

export function Portal<const Opts extends PortalOptions>(options: Opts): Component<Opts> {
  return gen(function* () {
    if (options.target) {
      yield* Effect.sync(() => {
        options.target!.textContent = String(options.content ?? "");
      });
      return html``;
    }

    return html`${options.content}`;
  });
}
