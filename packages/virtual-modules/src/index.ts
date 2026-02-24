export * from "./types.js";
export * from "./PluginManager.js";
export * from "./TypeInfoApi.js";
export * from "./NodeModulePluginLoader.js";
export * from "./LanguageServiceAdapter.js";
export * from "./CompilerHostAdapter.js";
export * from "./VmcConfigLoader.js";
export * from "./VmcResolverLoader.js";
export {
  createVirtualFileName,
  createVirtualKey,
  VIRTUAL_MODULE_URI_SCHEME,
  VIRTUAL_NODE_MODULES_RELATIVE,
  type CreateVirtualFileNameParams,
  type CreateVirtualFileNameOptions,
} from "./internal/path.js";
