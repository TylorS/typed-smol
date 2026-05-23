import type {
  ComponentAnnotations,
  ProjectAnnotations,
  RenderContext,
  StoryAnnotations,
  StorybookConfig as StorybookConfigBase,
  StoryContext as StorybookStoryContext,
  StrictArgs,
  WebRenderer,
} from "storybook/internal/types";

export const TYPED_STORYBOOK_FRAMEWORK = "@typed/storybook" as const;

export interface TypedStorybookFrameworkOptions {
  readonly typedConfig?: string;
  readonly server?: {
    readonly mode?: "runtime-harness" | "storybook-middleware" | "http-server";
  };
}

export const DEFAULT_TYPED_STORYBOOK_OPTIONS = {
  server: { mode: "runtime-harness" },
} as const satisfies TypedStorybookFrameworkOptions;

export type TypedStorybookFramework =
  | typeof TYPED_STORYBOOK_FRAMEWORK
  | {
      readonly name: typeof TYPED_STORYBOOK_FRAMEWORK;
      readonly options?: TypedStorybookFrameworkOptions;
    };

export type StorybookConfig = Omit<StorybookConfigBase, "framework"> & {
  readonly framework: TypedStorybookFramework;
};

export interface TypedRenderer extends WebRenderer {
  component: TypedComponent;
  storyResult: TypedStoryResult;
}

export type TypedStoryResult = HTMLElement | DocumentFragment | string | void;

export type TypedComponent<TArgs extends StrictArgs = StrictArgs> = (
  args: TArgs,
) => TypedStoryResult;

export type Meta<TArgs extends StrictArgs = StrictArgs> = ComponentAnnotations<
  TypedRenderer,
  TArgs
>;

export type StoryObj<TArgs extends StrictArgs = StrictArgs> = StoryAnnotations<
  TypedRenderer,
  TArgs
>;

export type Preview = ProjectAnnotations<TypedRenderer>;

export type StoryContext<TArgs extends StrictArgs = StrictArgs> = StorybookStoryContext<
  TypedRenderer,
  TArgs
>;

export type { RenderContext };

export function defineTypedStorybookConfig<const Config extends StorybookConfig>(
  config: Config,
): Config {
  return config;
}
