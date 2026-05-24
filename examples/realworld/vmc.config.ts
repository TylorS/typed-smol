import { resolve } from "node:path";
import { createTypedVirtualModulePlugins } from "@typed/app/TypedVirtualModulePlugins";

export default {
  plugins: createTypedVirtualModulePlugins({
    storybook: {
      runtimeDefaults: {
        routes: ["./src/routes"],
        api: ["./src/api"],
        proxyPath: "/__typed_storybook_api",
        baseDir: resolve("."),
      },
    },
  }),
};
