import { typedVitePlugin } from "@typed/vite-plugin";
import type { PresetProperty } from "storybook/internal/types";
import type { InlineConfig, PluginOption } from "vite";
import {
  DEFAULT_TYPED_STORYBOOK_OPTIONS,
  TYPED_STORYBOOK_FRAMEWORK,
  type TypedStorybookFramework,
  type TypedStorybookFrameworkOptions,
} from "./types.js";

export const addons = [] satisfies PresetProperty<"addons">;

export const core: PresetProperty<"core"> = async (config) => ({
  ...config,
  builder: {
    name: "@storybook/builder-vite",
    options: typeof config?.builder === "object" ? config.builder.options : {},
  },
  renderer: "@typed/storybook",
});

export const previewAnnotations: PresetProperty<"previewAnnotations"> = (entry = []) => [
  ...entry,
  import.meta.resolve("@typed/storybook/preview.js"),
];

export interface TypedStorybookPresetOptions {
  readonly presets?: {
    readonly apply: (extension: "framework") => Promise<TypedStorybookFramework>;
  };
}

export async function viteFinal(
  config: InlineConfig,
  options: TypedStorybookPresetOptions = {},
): Promise<InlineConfig> {
  const framework = await options.presets?.apply("framework");
  const frameworkOptions = getFrameworkOptions(framework);
  config.plugins = [
    ...(config.plugins ?? []),
    ...typedVitePlugin(frameworkOptions.typedVite ?? {}),
  ] as PluginOption[];
  return config;
}

function getFrameworkOptions(
  framework: TypedStorybookFramework | undefined,
): TypedStorybookFrameworkOptions {
  if (
    typeof framework === "object" &&
    framework.name === TYPED_STORYBOOK_FRAMEWORK &&
    framework.options
  ) {
    return framework.options;
  }

  return DEFAULT_TYPED_STORYBOOK_OPTIONS;
}
