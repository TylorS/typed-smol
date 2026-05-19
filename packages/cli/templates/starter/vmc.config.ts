import { createBrowserVirtualModulePlugin } from "@typed/app/BrowserVirtualModulePlugin";
import { createConfigVirtualModulePlugin } from "@typed/app/ConfigVirtualModulePlugin";
import { createEnvVirtualModulePlugin } from "@typed/app/EnvVirtualModulePlugin";
import { createHtmlVirtualModulePlugin } from "@typed/app/HtmlVirtualModulePlugin";
import { createHttpApiVirtualModulePlugin } from "@typed/app/HttpApiVirtualModulePlugin";
import { createRouteHandlersVirtualModulePlugin } from "@typed/app/RouteHandlersVirtualModulePlugin";
import { createRouterVirtualModulePlugin } from "@typed/app/RouterVirtualModulePlugin";
import { createServerVirtualModulePlugin } from "@typed/app/ServerVirtualModulePlugin";

export default {
  plugins: [
    createConfigVirtualModulePlugin(),
    createEnvVirtualModulePlugin(),
    createHtmlVirtualModulePlugin(),
    createRouterVirtualModulePlugin(),
    createRouteHandlersVirtualModulePlugin(),
    createHttpApiVirtualModulePlugin(),
    createBrowserVirtualModulePlugin(),
    createServerVirtualModulePlugin(),
  ],
};
