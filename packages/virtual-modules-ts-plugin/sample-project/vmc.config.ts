import { createTypedVirtualModulePlugins } from "@typed/app";

export default {
  plugins: [
    "./plugin.mjs",
    ...createTypedVirtualModulePlugins(),
  ],
};
