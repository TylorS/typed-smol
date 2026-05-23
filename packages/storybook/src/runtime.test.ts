import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Window } from "happy-dom";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { html } from "@typed/template";
import { defineTypedStoryRuntime } from "./index.js";
import { renderToCanvas } from "./preview.js";
import type { RenderContext, TypedRenderer } from "./types.js";

class Greeting extends Context.Service<Greeting, { readonly message: string }>()(
  "test/storybook/Greeting",
) {}

describe("Typed story runtime harness", () => {
  it("provides story runtime layers while mounting the canvas", async () => {
    const canvasElement = createRoot();
    const runtime = defineTypedStoryRuntime({
      layers: [Layer.succeed(Greeting, { message: "server-side" })] as const,
      url: "http://localhost/server-backed",
    });

    const teardown = await renderToCanvas(
      {
        canvasElement,
        showException: vi.fn(),
        showError: vi.fn(),
        showMain: vi.fn(),
        storyContext: { parameters: { typed: runtime } } as never,
        storyFn: () => html`<p>${Effect.map(Greeting, (greeting) => greeting.message)}</p>`,
      } as unknown as RenderContext<TypedRenderer>,
      canvasElement,
    );

    expect(canvasElement.innerHTML).toBe("<p>server-side<!--/n_0--></p>");

    await teardown?.();
  });

  it("preserves literal layer tuples for author-facing inference", () => {
    const greeting = Layer.succeed(Greeting, { message: "typed" });
    const runtime = defineTypedStoryRuntime({ layers: [greeting] as const });

    expectTypeOf(runtime.layers).toEqualTypeOf<readonly [typeof greeting] | undefined>();
  });
});

function createRoot(): HTMLElement {
  return (new Window() as unknown as globalThis.Window & typeof globalThis).document.createElement(
    "div",
  );
}
