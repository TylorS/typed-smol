import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Fx from "@typed/fx/Fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import { type Component } from "svelte";
import { readable, type Readable } from "svelte/store";
import { host } from "./Host.js";
import { SvelteRender, type Renderer } from "./SvelteRender.js";
import Bridge from "./internal/Bridge.svelte";

export interface HtmlOptions {
  readonly onHead?: (head: string) => void;
}

const makeRenderer =
  (htmlOptions: HtmlOptions): Renderer =>
  (component, props, options) =>
    Fx.unwrap(
      Effect.flatMap(
        Fx.first(props),
        Option.match({
          onNone: () => Effect.succeed(Fx.empty),
          onSome: (initial) =>
            Effect.promise(async () => {
              const { render } = await import("svelte/server");
              const values = readable(initial);
              const bridge = Bridge as Component<{
                readonly component: typeof component;
                readonly values: Readable<typeof initial>;
              }>;
              const output = await render(bridge, {
                props: { component, values },
                context: options.context,
                idPrefix: options.idPrefix,
                csp: options.csp,
                transformError: options.transformError,
              });

              htmlOptions.onHead?.(output.head);

              return host(
                () => void 0,
                HtmlRenderEvent(
                  `<typed-svelte-root style="display: contents">${output.body}</typed-svelte-root>`,
                  true,
                ),
              );
            }),
        }),
      ),
    );

export const Html = Object.assign(Layer.succeed(SvelteRender, makeRenderer({})), {
  using: (options: HtmlOptions) => Layer.succeed(SvelteRender, makeRenderer(options)),
});
