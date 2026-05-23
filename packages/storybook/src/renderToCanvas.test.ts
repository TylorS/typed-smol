import { describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import { html } from "@typed/template";
import { renderToCanvas } from "./preview.js";
import type { RenderContext, TypedRenderer } from "./types.js";

describe("renderToCanvas", () => {
  it("mounts a Typed story result and disposes the canvas", async () => {
    const canvasElement = createRoot();
    const showMain = vi.fn();

    const teardown = await renderToCanvas(
      {
        canvasElement,
        showException: vi.fn(),
        showError: vi.fn(),
        showMain,
        storyContext: {} as never,
        storyFn: () => html`<button>Save</button>`,
      } as unknown as RenderContext<TypedRenderer>,
      canvasElement,
    );

    expect(showMain).toHaveBeenCalledOnce();
    expect(canvasElement.innerHTML).toBe("<button>Save</button>");

    await teardown?.();

    expect(canvasElement.innerHTML).toBe("");
  });
});

function createRoot(): HTMLElement {
  return (new Window() as unknown as globalThis.Window & typeof globalThis).document.createElement(
    "div",
  );
}
