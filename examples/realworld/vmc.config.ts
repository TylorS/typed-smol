import {
  createBrowserVirtualModulePlugin,
  createConfigVirtualModulePlugin,
  createHtmlVirtualModulePlugin,
  createHttpApiVirtualModulePlugin,
  createRouteHandlersVirtualModulePlugin,
  createRouterVirtualModulePlugin,
  createServerVirtualModulePlugin,
} from "@typed/app";

export default {
  plugins: [
    createConfigVirtualModulePlugin(),
    createHtmlVirtualModulePlugin(),
    createRouterVirtualModulePlugin(),
    createRouteHandlersVirtualModulePlugin(),
    createHttpApiVirtualModulePlugin(),
    createBrowserVirtualModulePlugin(),
    createServerVirtualModulePlugin(),
  ],
};
