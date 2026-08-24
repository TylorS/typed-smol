import * as Context from "effect/Context";
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { Component } from "svelte";

export interface ViewOptions {
  readonly context?: Map<any, any>;
  readonly idPrefix?: string;
  readonly intro?: boolean;
  readonly recover?: boolean;
  readonly transformError?: (error: unknown) => unknown;
  readonly outro?: boolean;
  readonly csp?: {
    readonly nonce?: string;
    readonly hash?: boolean;
  };
}

export interface Renderer {
  <Props extends Record<string, any>, E, R>(
    component: Component<Props>,
    props: Fx<Props, E, R>,
    options: ViewOptions,
  ): Fx<RenderEvent, E, R | Scope.Scope | RenderTemplate>;
}

export class SvelteRender extends Context.Service<SvelteRender, Renderer>()("SvelteRender") {}
