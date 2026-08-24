import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Storybook from "../src/Storybook.js";

/** Creates an isolated, long-lived Storybook story for a Typed template. */
export function story<E>(content: Fx<RenderEvent, E, Scope.Scope | RenderTemplate>) {
  let mounted: Storybook.MountedStory | undefined;

  return {
    loaders: [
      async () => {
        if (mounted !== undefined) await mounted.dispose();
        mounted = await Storybook.mount(
          html`<div class="typed-story-content">${content}</div>`,
        );
        mounted.canvas.className = "typed-story";
        return {};
      },
    ],
    render: () => {
      if (mounted === undefined) throw new Error("Story rendered before mounting.");
      return mounted.canvas;
    },
  };
}
