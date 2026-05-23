import { Fx as FxRuntime } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import * as Effect from "effect/Effect";
import {
  runWithTypedStoryRuntime,
  typedStoryRuntimeFromParameters,
} from "./runtime.js";
import type { Preview } from "./types.js";
import type { RenderContext, TypedRenderer, TypedStoryResult } from "./types.js";

const TemplateFallbackTypeId = Symbol.for("@typed/compiler/TemplateFallback");

interface MountedStory {
  readonly dispose: Effect.Effect<void>;
}

export async function renderToCanvas(
  context: RenderContext<TypedRenderer>,
  canvasElement: HTMLElement,
) {
  try {
    const runtime = typedStoryRuntimeFromParameters(context.storyContext.parameters);
    const mounted = await mountStory(context.storyFn(context.storyContext), canvasElement, runtime);
    context.showMain();

    return () => Effect.runPromise(mounted.dispose);
  } catch (error) {
    context.showException(error as Error);
    return undefined;
  }
}

export const projectAnnotations = { renderToCanvas } satisfies Preview;

export default projectAnnotations;

function mountStory(
  storyResult: TypedStoryResult,
  root: HTMLElement,
  runtime: ReturnType<typeof typedStoryRuntimeFromParameters>,
) {
  const effect = mountStoryResult(storyResult, root);

  return runWithTypedStoryRuntime(effect, runtime);
}

function mountStoryResult(
  storyResult: TypedStoryResult,
  root: HTMLElement,
): Effect.Effect<MountedStory, unknown, unknown> {
  if (isCompiledDomTemplate(storyResult)) {
    return Effect.map(
      Effect.promise(() => storyResult.renderInto(root, [])),
      () => mountedStory(root),
    );
  }
  if (isTemplateFallback(storyResult)) {
    return mountFx(storyResult.render(), root);
  }
  if (FxRuntime.isFx(storyResult)) {
    return mountFx(storyResult, root);
  }
  return Effect.die(new TypeError("Expected a Typed DOM template or Fx story result"));
}

function mountFx(fx: Parameters<typeof render>[0], root: HTMLElement) {
  return Effect.map(
    render(fx, root).pipe(
      FxRuntime.provide(DomRenderTemplate.using(root.ownerDocument)),
      FxRuntime.take(1),
      FxRuntime.collectAll,
      Effect.scoped,
    ),
    () => mountedStory(root),
  );
}

function isCompiledDomTemplate(value: unknown): value is {
  readonly renderInto: (root: HTMLElement, values: readonly unknown[]) => Promise<readonly Node[]>;
} {
  return typeof value === "object" && value !== null && "renderInto" in value;
}

function isTemplateFallback(value: unknown): value is {
  readonly render: () => Parameters<typeof render>[0];
} {
  return (
    typeof value === "object" &&
    value !== null &&
    TemplateFallbackTypeId in value &&
    (value as { readonly [TemplateFallbackTypeId]: unknown })[TemplateFallbackTypeId] ===
      TemplateFallbackTypeId
  );
}

function mountedStory(root: HTMLElement): MountedStory {
  return {
    dispose: Effect.sync(() => root.replaceChildren()),
  };
}
