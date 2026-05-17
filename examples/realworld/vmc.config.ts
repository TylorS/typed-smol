import {
  createHttpApiVirtualModulePlugin,
  createRouterVirtualModulePlugin,
} from "@typed/app";

export default {
  plugins: [createRouterVirtualModulePlugin(), createHttpApiVirtualModulePlugin()],
};
