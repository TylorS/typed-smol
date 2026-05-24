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
        mode: "http-server",
        routes: ["./src/routes"],
        api: ["./src/api"],
        host: "127.0.0.1",
        port: 6184,
        proxyPath: "/__typed_storybook_api",
      },
    },
  },
});
