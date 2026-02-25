export {
  createRouterVirtualModulePlugin,
  parseRouterVirtualModuleId,
  resolveRouterTargetDirectory,
  type ParseRouterVirtualModuleIdResult,
  type ResolveRouterTargetDirectoryResult,
  type RouterVirtualModulePluginOptions,
} from "./RouterVirtualModulePlugin.js";
export {
  ROUTER_TYPE_TARGET_SPECS,
  HTTPAPI_TYPE_TARGET_SPECS,
} from "./internal/typeTargetSpecs.js";
export {
  createTypeInfoApiSessionForApp,
  APP_TYPE_TARGET_BOOTSTRAP_CONTENT,
} from "./createTypeInfoApiSessionForApp.js";

export {
  createHttpApiVirtualModulePlugin,
  parseHttpApiVirtualModuleId,
  resolveHttpApiTargetDirectory,
  type HttpApiVirtualModulePluginOptions,
  type ParseHttpApiVirtualModuleIdResult,
  type ResolveHttpApiTargetDirectoryResult,
} from "./HttpApiVirtualModulePlugin.js";
export {
  defineApiHandler,
  emptyRecordString,
  emptyRecordStringArray,
  type ApiHandlerContext,
  type ApiHandlerFn,
  type ApiHandlerParams,
  type ApiRoute,
  type EndpointSchemas,
  type HttpMethod,
  type TypedApiHandler,
} from "./httpapi/defineApiHandler.js";
export { resolveConfig } from "./internal/resolveConfig.js";
export type { AppConfig, RunConfig } from "./internal/appConfigTypes.js";
export * from "./internal/appLayerTypes.js";
