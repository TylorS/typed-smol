import type { PresetProperty } from "storybook/internal/types";

export const addons = [] satisfies PresetProperty<"addons">;

export const core: PresetProperty<"core"> = async (config) => ({
  ...config,
  builder: {
    name: "@storybook/builder-vite",
    options: typeof config?.builder === "object" ? config.builder.options : {},
  },
  renderer: "@typed/storybook",
});

export const previewAnnotations: PresetProperty<"previewAnnotations"> = (entry = []) => entry;
