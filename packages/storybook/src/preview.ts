import { mount, type MountedApp } from "@typed/app/runtime";
import * as Effect from "effect/Effect";
import type { Preview } from "./types.js";
import type { RenderContext, TypedRenderer, TypedStoryResult } from "./types.js";

export async function renderToCanvas(
  context: RenderContext<TypedRenderer>,
  canvasElement: HTMLElement,
) {
  try {
    const mounted = await mountStory(context.storyFn(context.storyContext), canvasElement);
    context.showMain();

    return () => Effect.runPromise(mounted.dispose);
  } catch (error) {
    context.showException(error as Error);
    return undefined;
  }
}

export const projectAnnotations = { renderToCanvas } satisfies Preview;

export default projectAnnotations;

function mountStory(storyResult: TypedStoryResult, root: HTMLElement) {
  const effect = mount(storyResult as never, { root }) as Effect.Effect<
    MountedApp,
    unknown,
    never
  >;

  return Effect.runPromise(effect);
}
