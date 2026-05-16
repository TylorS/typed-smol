import { resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import {
  createPluginConfigFingerprint,
  createSourceInputFingerprint,
  createVirtualArtifactStore,
} from "@typed/virtual-modules";
import type {
  ArtifactStoreFingerprints,
  CreateTypeInfoApiSession,
  VirtualArtifactFingerprint,
  VirtualModuleDiagnostic,
  VirtualModuleResolved,
  VirtualModuleResolver,
} from "@typed/virtual-modules";
import { encodeVirtualId, decodeVirtualId, isVirtualId } from "./encodeVirtualId.js";

const PLUGIN_NAME = "virtual-modules";

export interface VirtualModulesViteArtifactStoreOptions {
  /**
   * Static fingerprints supplied by a higher-level host. Vite adds the importer
   * source fingerprint per request.
   */
  readonly fingerprints?: ArtifactStoreFingerprints;
  /**
   * File-lock timeout for artifact writes. Defaults to the shared store default.
   */
  readonly lockTimeoutMs?: number;
  /**
   * File-lock retry delay for artifact writes. Defaults to the shared store default.
   */
  readonly lockRetryMs?: number;
  /**
   * Age after which artifact locks can be considered stale.
   */
  readonly staleLockMs?: number;
}

export interface VirtualModulesVitePluginOptions {
  /**
   * Resolver that handles virtual module resolution (e.g. a PluginManager instance).
   */
  readonly resolver: VirtualModuleResolver;
  /**
   * Project root for node_modules/.typed/virtual. Defaults to Vite's resolved root.
   */
  readonly projectRoot?: string;
  /**
   * Artifact store controls. Pass false to preserve in-memory-only behavior.
   */
  readonly artifactStore?: false | VirtualModulesViteArtifactStoreOptions;
  /**
   * Optional session factory for TypeInfo API when plugins need type information.
   */
  readonly createTypeInfoApiSession?: CreateTypeInfoApiSession;
  /**
   * When true, resolution errors are logged with console.warn. Default true.
   */
  readonly warnOnError?: boolean;
}

/** Validate decoded id/importer before passing to resolver (defense in depth). */
function validateDecodedPayload(id: string, importer: string): boolean {
  if (typeof id !== "string" || id.length === 0 || id.includes("\0")) return false;
  if (typeof importer !== "string" || importer.length === 0 || importer.includes("\0"))
    return false;
  if (id.length > 4096 || importer.length > 4096) return false;
  return true;
}

/**
 * Vite plugin that integrates @typed/virtual-modules: resolves and loads virtual
 * modules via the given resolver (e.g. PluginManager) in both dev and build.
 */
export function virtualModulesVitePlugin(options: VirtualModulesVitePluginOptions): Plugin {
  const { resolver, createTypeInfoApiSession, warnOnError = true } = options;
  let projectRoot = resolveOptionalProjectRoot(options.projectRoot);

  return {
    name: PLUGIN_NAME,
    enforce: "pre",

    configResolved(config: ResolvedConfig): void {
      projectRoot ??= resolve(config.root);
    },

    resolveId(id: string, importer: string | undefined): string | null {
      if (!importer) {
        return null;
      }
      const effectiveImporter = decodeEffectiveImporter(importer);
      const resolveOptions = {
        id,
        importer: effectiveImporter,
        createTypeInfoApiSession,
      };
      const pluginResolution = resolver.resolvePluginName?.(resolveOptions);
      if (pluginResolution?.status === "resolved") {
        return encodeVirtualId(id, effectiveImporter);
      }
      if (pluginResolution?.status === "error") {
        warnDiagnostic(pluginResolution.diagnostic, warnOnError);
        return null;
      }
      if (pluginResolution?.status === "unresolved") {
        return null;
      }

      const result = resolver.resolveModule(resolveOptions);
      if (result.status === "resolved") {
        return encodeVirtualId(id, effectiveImporter);
      }
      if (result.status === "error" && warnOnError) {
        warnDiagnostic(result.diagnostic, warnOnError);
      }
      return null;
    },

    load(resolvedId: string): string | { code: string } | null {
      if (!isVirtualId(resolvedId)) {
        return null;
      }
      const parsed = decodeVirtualId(resolvedId);
      if (!parsed || !validateDecodedPayload(parsed.id, parsed.importer)) {
        return null;
      }
      const { id, importer } = parsed;
      const cached = resolveCachedArtifact({
        options,
        projectRoot,
        id,
        importer,
      });
      if (cached.status === "hit") {
        return { code: cached.sourceText };
      }
      if (cached.status === "error") {
        warnDiagnostic(cached.diagnostic, warnOnError, "load ");
        return null;
      }

      const result = resolver.resolveModule({
        id,
        importer,
        createTypeInfoApiSession,
      });
      if (result.status === "resolved") {
        const sourceText = materializeArtifact({
          options,
          projectRoot,
          id,
          importer,
          resolution: result,
          warnOnError,
        });
        return { code: sourceText };
      }
      if (result.status === "error" && warnOnError) {
        warnDiagnostic(result.diagnostic, warnOnError, "load ");
      }
      return null;
    },
  };
}

interface ArtifactRequest {
  readonly options: VirtualModulesVitePluginOptions;
  readonly projectRoot?: string;
  readonly id: string;
  readonly importer: string;
}

type CachedArtifactResult =
  | { readonly status: "hit"; readonly sourceText: string }
  | { readonly status: "miss" }
  | { readonly status: "error"; readonly diagnostic: VirtualModuleDiagnostic };

const resolveCachedArtifact = (request: ArtifactRequest): CachedArtifactResult => {
  const pluginName = resolvePluginName(request);
  if (pluginName.status !== "resolved") {
    return pluginName;
  }

  try {
    const store = createRequestArtifactStore(request, pluginName.pluginName);
    if (!store) return { status: "miss" };
    const result = store.resolve({
      id: request.id,
      importer: request.importer,
      fingerprints: createRequestFingerprints(request),
    });
    return result.status === "hit"
      ? { status: "hit", sourceText: result.sourceText }
      : { status: "miss" };
  } catch (error) {
    return {
      status: "error",
      diagnostic: createArtifactDiagnostic(pluginName.pluginName, "resolve", error),
    };
  }
};

const materializeArtifact = (
  request: ArtifactRequest & {
    readonly resolution: VirtualModuleResolved;
    readonly warnOnError: boolean;
  },
): string => {
  try {
    const store = createRequestArtifactStore(request, request.resolution.pluginName);
    if (!store) return request.resolution.sourceText;
    store.materialize({
      id: request.id,
      importer: request.importer,
      sourceText: request.resolution.sourceText,
      sourceInputFingerprints: createRequestFingerprints(request).sourceInputFingerprints,
      dependencyDescriptors: request.resolution.dependencies,
      warnings: request.resolution.warnings?.map((warning) => ({
        severity: "warning",
        code: warning.code,
        message: warning.message,
        source: warning.pluginName,
      })),
    });
  } catch (error) {
    warnDiagnostic(
      createArtifactDiagnostic(request.resolution.pluginName, "materialize", error),
      request.warnOnError,
      "load ",
    );
  }
  return request.resolution.sourceText;
};

const resolvePluginName = (
  request: ArtifactRequest,
):
  | { readonly status: "resolved"; readonly pluginName: string }
  | { readonly status: "miss" }
  | { readonly status: "error"; readonly diagnostic: VirtualModuleDiagnostic } => {
  const result = request.options.resolver.resolvePluginName?.({
    id: request.id,
    importer: request.importer,
    createTypeInfoApiSession: request.options.createTypeInfoApiSession,
  });
  if (!result || result.status === "unresolved") return { status: "miss" };
  return result;
};

const createRequestArtifactStore = (request: ArtifactRequest, pluginName: string) => {
  if (!artifactStoreEnabled(request.options) || !request.projectRoot) return undefined;
  const artifactOptions = request.options.artifactStore || {};
  return createVirtualArtifactStore({
    projectRoot: request.projectRoot,
    pluginName,
    fingerprints: createStoreFingerprints(request.options),
    lockTimeoutMs: artifactOptions.lockTimeoutMs,
    lockRetryMs: artifactOptions.lockRetryMs,
    staleLockMs: artifactOptions.staleLockMs,
  });
};

const createRequestFingerprints = (request: ArtifactRequest): ArtifactStoreFingerprints => ({
  sourceInputFingerprints: [
    createSourceInputFingerprint(request.importer),
    ...(getArtifactStoreFingerprints(request.options).sourceInputFingerprints ?? []),
  ],
});

const createStoreFingerprints = (
  options: VirtualModulesVitePluginOptions,
): ArtifactStoreFingerprints => {
  const fingerprints = getArtifactStoreFingerprints(options);
  return {
    pluginFingerprints: fingerprints.pluginFingerprints ?? createUnavailablePluginFingerprints(),
    compilerFingerprints: fingerprints.compilerFingerprints ?? createCompilerFingerprints(options),
  };
};

const createUnavailablePluginFingerprints = (): readonly VirtualArtifactFingerprint[] => [
  {
    kind: "config",
    name: "vite-plugin-inputs",
    unavailableReason:
      "Vite plugin fingerprints are unavailable; pass artifactStore.fingerprints.pluginFingerprints to enable cache reuse",
  },
];

const createCompilerFingerprints = (
  options: VirtualModulesVitePluginOptions,
): readonly VirtualArtifactFingerprint[] =>
  options.createTypeInfoApiSession
    ? [
        {
          kind: "typescript",
          name: "type-info-session",
          unavailableReason: "TypeInfo compiler fingerprints are unavailable in Vite",
        },
      ]
    : [createPluginConfigFingerprint("vite-compiler-surface", { typeInfo: false })];

const getArtifactStoreFingerprints = (
  options: VirtualModulesVitePluginOptions,
): ArtifactStoreFingerprints =>
  options.artifactStore && typeof options.artifactStore === "object"
    ? (options.artifactStore.fingerprints ?? {})
    : {};

const artifactStoreEnabled = (options: VirtualModulesVitePluginOptions): boolean =>
  options.artifactStore !== false;

const decodeEffectiveImporter = (importer: string): string => {
  if (!isVirtualId(importer)) return importer;
  const decoded = decodeVirtualId(importer);
  return decoded && validateDecodedPayload(decoded.id, decoded.importer)
    ? decoded.importer
    : importer;
};

const resolveOptionalProjectRoot = (projectRoot: string | undefined): string | undefined =>
  typeof projectRoot === "string" && projectRoot.trim().length > 0
    ? resolve(projectRoot)
    : undefined;

const warnDiagnostic = (
  diagnostic: VirtualModuleDiagnostic,
  enabled: boolean,
  phase = "",
): void => {
  if (!enabled) return;
  console.warn(`[${PLUGIN_NAME}] ${phase}${diagnostic.pluginName}: ${diagnostic.message}`);
};

const createArtifactDiagnostic = (
  pluginName: string,
  action: "materialize" | "resolve",
  error: unknown,
): VirtualModuleDiagnostic => ({
  code: `artifact-store-${action}-failed`,
  pluginName,
  message: `Virtual artifact ${action} failed: ${toErrorMessage(error)}`,
});

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
