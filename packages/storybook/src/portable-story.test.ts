import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import projectAnnotations from "./preview.js";
import { composeStory, setProjectAnnotations } from "./testing.js";
import meta, {
  ApiBacked,
  ApiTestLayerOverride,
  RouteBacked,
} from "../fixtures/public-beta/src/PublicBeta.stories.js";

describe("portable server-backed stories", () => {
  beforeAll(() => {
    setProjectAnnotations(projectAnnotations);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders generated Routes through Storybook portable story APIs", async () => {
    const canvasElement = createRoot();
    const Story = composeStory(RouteBacked, meta, projectAnnotations);

    await Story.run({ canvasElement });

    expect(canvasElement.innerHTML).toContain("Dashboard:");
    expect(canvasElement.innerHTML).toContain("Generated route dependency");
  });

  it("wires API stories through the Storybook proxy helper", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          Response.json({
            message: "Fetched through Storybook proxy",
          }),
        ),
      ),
    );

    const canvasElement = createRoot();
    const Story = composeStory(ApiBacked, meta, projectAnnotations);

    await Story.run({ canvasElement });

    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:6173/__typed_storybook_api/message",
      undefined,
    );
    expect(canvasElement.innerHTML).toContain("Fetched through Storybook proxy");
  });

  it("lets testLayers override services used by executable stories", async () => {
    const canvasElement = createRoot();
    const Story = composeStory(ApiTestLayerOverride, meta, projectAnnotations);

    await Story.run({ canvasElement });

    expect(canvasElement.innerHTML).toContain("Overridden by testLayers");
  });
});

function createRoot(): HTMLElement {
  return (new Window() as unknown as globalThis.Window & typeof globalThis).document.createElement(
    "div",
  );
}
