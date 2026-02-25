export * from "./types.js";
export * from "./PluginManager.js";
export { collectTypeTargetSpecsFromPlugins } from "./collectTypeTargetSpecs.js";
export {
  createTypeInfoApiSession,
  createTypeInfoApiSessionFactory,
  createTypeTargetBootstrapContent,
  resolveTypeTargetsFromSpecs,
  type CreateTypeInfoApiSessionOptions,
  type ResolvedTypeTarget,
} from "./TypeInfoApi.js";
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
export {
  ensureTypeTargetBootstrapFile,
  getProgramWithTypeTargetBootstrap,
  getTypeTargetBootstrapPath,
  TYPE_TARGET_BOOTSTRAP_RELATIVE,
  type EnsureTypeTargetBootstrapFileFs,
} from "./typeTargetBootstrap.js";
