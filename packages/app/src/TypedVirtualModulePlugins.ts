import type { VirtualModulePlugin } from "@typed/virtual-modules";
import {
  createBrowserVirtualModulePlugin,
  type BrowserVirtualModulePluginOptions,
} from "./BrowserVirtualModulePlugin.js";
import { createApiHandlerVirtualModulePlugin } from "./ApiHandlerVirtualModulePlugin.js";
import { createCatchVirtualModulePlugin } from "./CatchVirtualModulePlugin.js";
import {
  createComponentVirtualModulePlugin,
  type ComponentVirtualModulePluginOptions,
} from "./ComponentVirtualModulePlugin.js";
import {
  createConfigVirtualModulePlugin,
  type ConfigVirtualModulePluginOptions,
} from "./ConfigVirtualModulePlugin.js";
import { createEnvVirtualModulePlugin, type EnvVirtualModulePluginOptions } from "./EnvVirtualModulePlugin.js";
import { createErrorsVirtualModulePlugin } from "./ErrorsVirtualModulePlugin.js";
import { createGuardVirtualModulePlugin } from "./GuardVirtualModulePlugin.js";
import { createHeadersVirtualModulePlugin } from "./HeadersVirtualModulePlugin.js";
import {
  createHtmlVirtualModulePlugin,
  type HtmlVirtualModulePluginOptions,
} from "./HtmlVirtualModulePlugin.js";
import {
  createHttpApiVirtualModulePlugin,
  type HttpApiVirtualModulePluginOptions,
} from "./HttpApiVirtualModulePlugin.js";
import { createLayoutVirtualModulePlugin } from "./LayoutVirtualModulePlugin.js";
import { createMiddlewaresVirtualModulePlugin } from "./MiddlewaresVirtualModulePlugin.js";
import { createOpenApiVirtualModulePlugin } from "./OpenApiVirtualModulePlugin.js";
import { createPrefixVirtualModulePlugin } from "./PrefixVirtualModulePlugin.js";
import { createRouteHandlersVirtualModulePlugin } from "./RouteHandlersVirtualModulePlugin.js";
import { createRouteTemplateVirtualModulePlugin } from "./RouteTemplateVirtualModulePlugin.js";
import {
  createRouterVirtualModulePlugin,
  type RouterVirtualModulePluginOptions,
} from "./RouterVirtualModulePlugin.js";
import {
  createServerVirtualModulePlugin,
  type ServerVirtualModulePluginOptions,
} from "./ServerVirtualModulePlugin.js";
import { createServicesVirtualModulePlugin } from "./ServicesVirtualModulePlugin.js";
import {
  createStorybookVirtualModulePlugin,
  type StorybookVirtualModulePluginOptions,
} from "./StorybookVirtualModulePlugin.js";
import { parseComposableTypedVirtualModuleId } from "./internal/composableVirtualModuleCore.js";

export { parseComposableTypedVirtualModuleId };

export interface TypedVirtualModulePluginsOptions {
  readonly router?: RouterVirtualModulePluginOptions;
  readonly api?: HttpApiVirtualModulePluginOptions;
  readonly env?: EnvVirtualModulePluginOptions;
  readonly config?: ConfigVirtualModulePluginOptions;
  readonly html?: HtmlVirtualModulePluginOptions;
  readonly server?: ServerVirtualModulePluginOptions;
  readonly browser?: BrowserVirtualModulePluginOptions;
  readonly storybook?: StorybookVirtualModulePluginOptions;
  readonly component?: ComponentVirtualModulePluginOptions;
  readonly createHttpApiVirtualModulePlugin?: (
    options: HttpApiVirtualModulePluginOptions,
  ) => VirtualModulePlugin;
}

export function createTypedVirtualModulePlugins(
  options: TypedVirtualModulePluginsOptions = {},
): readonly VirtualModulePlugin[] {
  const httpApiFactory =
    options.createHttpApiVirtualModulePlugin ?? createHttpApiVirtualModulePlugin;

  return [
    createRouterVirtualModulePlugin(options.router ?? {}),
    createRouteHandlersVirtualModulePlugin(),
    createServicesVirtualModulePlugin(),
    createGuardVirtualModulePlugin(),
    createLayoutVirtualModulePlugin(),
    createCatchVirtualModulePlugin(),
    createHeadersVirtualModulePlugin(),
    createErrorsVirtualModulePlugin(),
    createMiddlewaresVirtualModulePlugin(),
    createPrefixVirtualModulePlugin(),
    createOpenApiVirtualModulePlugin(),
    createRouteTemplateVirtualModulePlugin(),
    createApiHandlerVirtualModulePlugin(),
    createComponentVirtualModulePlugin(options.component ?? {}),
    httpApiFactory(options.api ?? {}),
    createEnvVirtualModulePlugin(options.env ?? {}),
    createConfigVirtualModulePlugin(options.config ?? {}),
    createHtmlVirtualModulePlugin(options.html ?? {}),
    createServerVirtualModulePlugin(options.server ?? {}),
    createBrowserVirtualModulePlugin(options.browser ?? {}),
    createStorybookVirtualModulePlugin(options.storybook ?? {}),
  ];
}
