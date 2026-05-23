import { describe, expect, it } from "vitest";
import {
  DEFAULT_TYPED_STORYBOOK_OPTIONS,
  TYPED_STORYBOOK_FRAMEWORK,
  defineTypedStorybookConfig,
} from "./index.js";
import { addons, core, previewAnnotations } from "./preset.js";
import preview, { projectAnnotations } from "./preview.js";
import { composeStories, composeStory, setProjectAnnotations } from "./testing.js";

describe("@typed/storybook public surface", () => {
  it("exposes framework identity and a typed config helper", () => {
    const config = defineTypedStorybookConfig({
      stories: ["../src/**/*.stories.ts"],
      framework: {
        name: TYPED_STORYBOOK_FRAMEWORK,
        options: DEFAULT_TYPED_STORYBOOK_OPTIONS,
      },
    });

    expect(TYPED_STORYBOOK_FRAMEWORK).toBe("@typed/storybook");
    expect(config.framework).toEqual({
      name: "@typed/storybook",
      options: {
        server: { mode: "runtime-harness" },
      },
    });
  });

  it("exposes preset and preview entrypoints", () => {
    expect(addons).toEqual([]);
    expect(typeof core).toBe("function");
    expect(typeof previewAnnotations).toBe("function");
    expect(preview).toBe(projectAnnotations);
  });

  it("re-exports Storybook portable-story helpers", () => {
    expect(typeof composeStories).toBe("function");
    expect(typeof composeStory).toBe("function");
    expect(typeof setProjectAnnotations).toBe("function");
  });
});
