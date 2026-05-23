import { describe, expect, it } from "vitest";
import type { InlineConfig, Plugin } from "vite";
import { TYPED_STORYBOOK_FRAMEWORK } from "./index.js";
import { viteFinal } from "./preset.js";

const pluginNames = (config: InlineConfig) =>
  (config.plugins ?? []).flat().map((plugin) => (plugin as Plugin).name);

describe("@typed/storybook preset", () => {
  it("preserves existing Vite plugins while appending typed plugins", async () => {
    const userPlugin = { name: "user-plugin" } satisfies Plugin;
    const baseConfig = { plugins: [userPlugin] } satisfies InlineConfig;

    const finalConfig = await viteFinal(baseConfig, {
      presets: {
        apply: async (extension) => {
          expect(extension).toBe("framework");
          return {
            name: TYPED_STORYBOOK_FRAMEWORK,
            options: {
              typedVite: {
                compression: false,
                serverEntry: false,
              },
            },
          };
        },
      },
    });

    expect(finalConfig).toBe(baseConfig);
    expect(pluginNames(finalConfig)).toEqual([
      "user-plugin",
      "typed-vite:native-tsconfig-paths",
      "virtual-modules",
    ]);
  });
});
