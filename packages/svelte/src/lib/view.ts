import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import * as FxRuntime from "@typed/fx/Fx";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { Component } from "svelte";
import type { Source } from "./Source.js";
import { toFx } from "./Source.js";
import { SvelteRender, type ViewOptions } from "./SvelteRender.js";

export function view<Props extends Record<string, any>, E = never, R = never>(
  component: Component<Props>,
  props: Source<Props, E, R>,
  options: ViewOptions = {},
): Fx<RenderEvent, E, R | Scope.Scope | RenderTemplate | SvelteRender> {
  return FxRuntime.unwrap(
    Effect.map(SvelteRender, (render) => render(component, toFx(props), options)),
  );
}
