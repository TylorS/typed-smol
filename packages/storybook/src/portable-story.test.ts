import { beforeAll, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import projectAnnotations from "./preview.js";
import { composeStory, setProjectAnnotations } from "./testing.js";
import meta, { ServerBacked } from "./fixtures/server-backed.stories.js";

describe("portable server-backed stories", () => {
  beforeAll(() => {
    setProjectAnnotations(projectAnnotations);
  });

  it("runs a Typed story through Storybook portable story APIs", async () => {
    const canvasElement = createRoot();
    const Story = composeStory(ServerBacked, meta, projectAnnotations);

    await Story.run({ canvasElement });

    expect(canvasElement.innerHTML).toBe("<button>Saved from server<!--/n_0--></button>");
  });
});

function createRoot(): HTMLElement {
  return (new Window() as unknown as globalThis.Window & typeof globalThis).document.createElement(
    "div",
  );
}
