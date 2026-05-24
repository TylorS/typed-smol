import { TYPED_STORYBOOK_FRAMEWORK, defineTypedStorybookConfig } from "@typed/storybook";

export default defineTypedStorybookConfig({
  stories: ["../src/**/*.stories.ts"],
  framework: {
    name: TYPED_STORYBOOK_FRAMEWORK,
    options: {
      typedVite: {
        compression: false,
        serverEntry: false,
        templates: false,
        tsconfig: "tsconfig.storybook.json",
      },
      server: {
        mode: "runtime-harness",
        routes: ["./src/routes"],
        api: ["./src/api"],
      },
    },
  },
});
