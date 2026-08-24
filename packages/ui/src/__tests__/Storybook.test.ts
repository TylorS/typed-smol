import { assert, describe, it } from "vitest";
import { Window } from "happy-dom";
import * as Button from "../Button.js";
import * as Storybook from "../Storybook.js";

describe("typed/ui/Storybook", () => {
  it("keeps a Typed component mounted in an isolated Storybook canvas", async () => {
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;
    const story = await Storybook.mount(Button.Button({ content: "Save" }), window.document);

    try {
      const button = story.canvas.querySelector("button");
      assert.strictEqual(button?.textContent, "Save");
      assert.strictEqual(button?.type, "button");
    } finally {
      await story.dispose();
    }
  });
});
