import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Fx from "@typed/fx/Fx";
import { hydrate, mount, unmount, type Component } from "svelte";
import { writable, type Readable } from "svelte/store";
import { host } from "./Host.js";
import { SvelteRender, type Renderer, type ViewOptions } from "./SvelteRender.js";
import Bridge from "./internal/Bridge.svelte";

const inertContent = () => void 0;

const renderer: Renderer = (component, props, options) =>
  host((element) => mountComponent(element, component, props, options), inertContent);

export const Dom = Layer.succeed(SvelteRender, renderer);

function mountComponent<Props extends Record<string, any>, E, R>(
  element: HTMLElement,
  component: Component<Props>,
  props: Fx.Fx<Props, E, R>,
  options: ViewOptions,
): Effect.Effect<never, E, R> {
  const existingTarget = element.querySelector<HTMLElement>(":scope > typed-svelte-root");

  return Effect.gen(function* () {
    let instance: Record<string, any> | undefined;
    let values: ReturnType<typeof writable<Props>> | undefined;
    let target: HTMLElement | undefined;

    const update = (next: Props) =>
      Effect.sync(() => {
        if (values !== undefined) {
          return values.set(next);
        }

        values = writable(next);
        target = existingTarget ?? element.ownerDocument.createElement("typed-svelte-root");
        target.style.display = "contents";
        if (existingTarget === null) element.append(target);

        const bridge = Bridge as Component<{
          readonly component: Component<Props>;
          readonly values: Readable<Props>;
        }>;
        const common = {
          target,
          props: { component, values },
          context: options.context,
          intro: options.intro,
          transformError: options.transformError,
        };

        instance =
          existingTarget !== null
            ? hydrate(bridge, { ...common, recover: options.recover })
            : mount(bridge, common);
      });

    return yield* Fx.observe(props, update).pipe(
      Effect.andThen(Effect.never),
      Effect.ensuring(
        Effect.suspend(() =>
          instance === undefined
            ? Effect.void
            : Effect.promise(() => unmount(instance!, { outro: options.outro })).pipe(
                Effect.andThen(Effect.sync(() => target?.remove())),
              ),
        ),
      ),
    );
  });
}
