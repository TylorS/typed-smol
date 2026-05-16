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
  createArtifactPaths,
  createVirtualLogicalIdentity,
  isVirtualLogicalIdentity,
  type CreateVirtualLogicalIdentityParams,
  type VirtualArtifactPaths,
  type VirtualLogicalIdentity,
} from "./internal/ArtifactIdentity.js";
export {
  createGeneratedSourceHash,
  createParsedTsconfigFingerprint,
  createPluginConfigFingerprint,
  createPluginModuleFingerprint,
  createPluginPackageFingerprint,
  createSourceInputFingerprint,
  createTypeScriptFingerprint,
  getNonReusableFingerprintReasons,
  hashVirtualArtifactContent,
  hashVirtualArtifactJson,
  stableJsonStringify,
} from "./internal/ArtifactFingerprint.js";
export {
  createVirtualArtifactIndex,
  parseVirtualArtifactIndex,
  parseVirtualArtifactManifest,
  VIRTUAL_ARTIFACT_MANIFEST_VERSION,
  type ParseVirtualArtifactIndexResult,
  type ParseVirtualArtifactManifestResult,
  type VirtualArtifactDebugMetadata,
  type VirtualArtifactDependencyDescriptor,
  type VirtualArtifactFingerprint,
  type VirtualArtifactFingerprintKind,
  type VirtualArtifactIndex,
  type VirtualArtifactIndexEntry,
  type VirtualArtifactManifest,
  type VirtualArtifactMessage,
} from "./internal/ArtifactManifest.js";
export {
  createVirtualArtifactStore,
  type ArtifactStoreFingerprints,
  type CreateVirtualArtifactStoreOptions,
  type MaterializedVirtualArtifact,
  type MaterializeVirtualArtifactParams,
  type ReadVirtualArtifactIndexResult,
  type ReadVirtualArtifactManifestResult,
  type ResolveVirtualArtifactParams,
  type ResolveVirtualArtifactResult,
  type VirtualArtifactStore,
} from "./internal/ArtifactStore.js";
export {
  createVirtualFileName,
  createVirtualKey,
  VIRTUAL_MODULE_URI_SCHEME,
  VIRTUAL_NODE_MODULES_RELATIVE,
  type CreateVirtualFileNameParams,
  type CreateVirtualFileNameOptions,
} from "./internal/path.js";
export {
  materializeVirtualFile,
  rewriteSourceForPreviewLocation,
} from "./internal/materializeVirtualFile.js";
export {
  ensureTypeTargetBootstrapFile,
  getProgramWithTypeTargetBootstrap,
  getTypeTargetBootstrapPath,
  TYPE_TARGET_BOOTSTRAP_RELATIVE,
  type EnsureTypeTargetBootstrapFileFs,
} from "./typeTargetBootstrap.js";
export {
  createLanguageServiceSessionFactory,
  type CreateLanguageServiceSessionFactoryOptions,
} from "./LanguageServiceSession.js";
