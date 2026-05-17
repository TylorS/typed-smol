import {
  createBrowserVirtualModulePlugin,
  createConfigVirtualModulePlugin,
  createHtmlVirtualModulePlugin,
  createHttpApiVirtualModulePlugin,
  createRouterVirtualModulePlugin,
  createServerVirtualModulePlugin,
} from "@typed/app";

export default {
  plugins: [
    createConfigVirtualModulePlugin(),
    createHtmlVirtualModulePlugin(),
    createRouterVirtualModulePlugin(),
    createHttpApiVirtualModulePlugin(),
    createBrowserVirtualModulePlugin(),
    createServerVirtualModulePlugin(),
  ],
};
