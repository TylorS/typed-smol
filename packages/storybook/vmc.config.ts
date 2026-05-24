import { resolve } from "node:path";
import { createTypedVirtualModulePlugins } from "@typed/app";

const fixtureRoot = resolve("fixtures/public-beta");

export default {
  plugins: createTypedVirtualModulePlugins({
    storybook: {
      runtimeDefaults: {
        routes: ["./src/routes"],
        api: ["./src/api"],
        proxyPath: "/__typed_storybook_api",
        serverOrigin: "http://127.0.0.1:6173",
        baseDir: fixtureRoot,
      },
    },
  }),
};
