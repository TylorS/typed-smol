import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import * as Vite from "vite";
import type { Plugin, ResolvedConfig } from "vite";
import {
  createPluginConfigFingerprint,
  createSourceInputFingerprint,
  createVirtualArtifactStore,
  analyzeRequestedExports,
} from "@typed/virtual-modules";
import type {
  ArtifactStoreFingerprints,
  CreateTypeInfoApiSession,
  VirtualArtifactFingerprint,
  VirtualModuleBuildContext,
  VirtualModuleConsumer,
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
  /**
   * Optional host hook for selecting an environment-specific virtual module id
   * before resolution, e.g. client-only vs server-capable generated modules.
   */
  readonly mapId?: (input: {
    readonly id: string;
    readonly importer: string;
    readonly consumer?: string;
    readonly environmentName?: string;
  }) => string;
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
  let viteCommand: "build" | "serve" = "serve";
  const contextByResolvedId = new Map<string, VirtualModuleBuildContext>();

  return {
    name: PLUGIN_NAME,
    enforce: "pre",

    configResolved(config: ResolvedConfig): void {
      projectRoot ??= resolve(config.root);
      viteCommand = config.command;
    },

    resolveId(
      this: {
        readonly environment?: Vite.Environment;
        resolve(
          id: string,
          importer?: string,
          options?: { readonly skipSelf?: boolean },
        ): Promise<{ readonly id: string } | null>;
      },
      id: string,
      importer: string | undefined,
    ): string | null | Promise<string | null> {
      if (!importer) {
        return null;
      }
      const effectiveImporter = decodeEffectiveImporter(importer);
      if (!effectiveImporter) {
        return null;
      }
      const relativeVirtualImport = resolveRelativeVirtualImport(id, importer, effectiveImporter);
      if (relativeVirtualImport) return relativeVirtualImport;
      const mappedId = mapVirtualId(options, id, effectiveImporter, this?.environment);
      const context = createBuildContext({
        id: mappedId,
        rootImporter: effectiveImporter,
        containingFile: importer,
        consumer: consumerFromEnvironment(this?.environment),
        command: viteCommand,
      });
      const resolveOptions = {
        id: mappedId,
        importer: effectiveImporter,
        context,
        createTypeInfoApiSession,
      };
      const pluginResolution = resolver.resolvePluginName?.(resolveOptions);
      if (pluginResolution?.status === "resolved") {
        const encoded = encodeVirtualId(mappedId, effectiveImporter);
        contextByResolvedId.set(encoded, context);
        return encoded;
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
        const encoded = encodeVirtualId(mappedId, effectiveImporter);
        contextByResolvedId.set(encoded, context);
        return encoded;
      }
      if (result.status === "error" && warnOnError) {
        warnDiagnostic(result.diagnostic, warnOnError);
      }
      if (isVirtualId(importer)) {
        return this.resolve(id, effectiveImporter, { skipSelf: true }).then(
          (resolved) => resolved?.id ?? null,
        );
      }
      return null;
    },

    async load(resolvedId: string): Promise<{ code: string } | null> {
      if (!isVirtualId(resolvedId)) {
        return null;
      }
      const parsed = decodeVirtualId(resolvedId);
      if (!parsed || !validateDecodedPayload(parsed.id, parsed.importer)) {
        return null;
      }
      const { id, importer } = parsed;
      const context =
        contextByResolvedId.get(resolvedId) ??
        createBuildContext({
          id,
          rootImporter: importer,
          containingFile: importer,
          consumer: "unknown",
          command: viteCommand,
        });
      const cached = resolveCachedArtifact({
        options,
        projectRoot,
        id,
        importer,
        context,
      });
      if (cached.status === "hit") {
        return transformVirtualModuleSource(cached.sourceText, parsed.id);
      }
      if (cached.status === "error") {
        warnDiagnostic(cached.diagnostic, warnOnError, "load ");
        return null;
      }

      const result = resolver.resolveModule({
        id,
        importer,
        context,
        createTypeInfoApiSession,
      });
      if (result.status === "resolved") {
        const sourceText = materializeArtifact({
          options,
          projectRoot,
          id,
          importer,
          context,
          resolution: result,
          warnOnError,
        });
        return transformVirtualModuleSource(sourceText, id);
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
  readonly context?: VirtualModuleBuildContext;
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

const mapVirtualId = (
  options: VirtualModulesVitePluginOptions,
  id: string,
  importer: string,
  environment: Vite.Environment | undefined,
): string =>
  options.mapId?.({
    id,
    importer,
    consumer: environment?.config.consumer,
    environmentName: environment?.name,
  }) ?? id;

const consumerFromEnvironment = (
  environment: Vite.Environment | undefined,
): VirtualModuleConsumer => {
  const consumer = environment?.config.consumer;
  return consumer === "client" || consumer === "server" ? consumer : "unknown";
};

const createBuildContext = (input: {
  readonly id: string;
  readonly rootImporter: string;
  readonly containingFile: string;
  readonly consumer: VirtualModuleConsumer;
  readonly command: "build" | "serve";
}): VirtualModuleBuildContext => ({
  id: input.id,
  rootImporter: input.rootImporter,
  containingFile: input.containingFile,
  consumer: input.consumer,
  requestedExports:
    input.command === "build"
      ? requestedExportsFromContainingFile(input.containingFile, input.id)
      : { kind: "all", reason: "dev mode" },
});

const requestedExportsFromContainingFile = (
  containingFile: string,
  id: string,
): VirtualModuleBuildContext["requestedExports"] => {
  if (isVirtualId(containingFile)) {
    return { kind: "all", reason: "virtual importer source unavailable" };
  }
  try {
    return analyzeRequestedExports(readFileSync(containingFile, "utf8"), id);
  } catch {
    return { kind: "all", reason: "importer source unavailable" };
  }
};

const transformVirtualModuleSource = async (
  sourceText: string,
  id: string,
): Promise<{ readonly code: string }> => {
  const filename = virtualTypeScriptFileName(id);
  const transformed = await transformTypeScriptSource(sourceText, filename);
  return { code: transformed.code };
};

type VirtualModuleTransformResult = { readonly code: string };
type OxcTransform = (
  code: string,
  filename: string,
  options: { readonly lang: "ts" },
) => Promise<VirtualModuleTransformResult>;

const transformTypeScriptSource = (
  sourceText: string,
  filename: string,
): Promise<VirtualModuleTransformResult> => {
  const transformWithOxc = (Vite as typeof Vite & { readonly transformWithOxc?: OxcTransform })
    .transformWithOxc;
  if (transformWithOxc) {
    return transformWithOxc(sourceText, filename, { lang: "ts" });
  }
  return Vite.transformWithEsbuild(sourceText, filename, {
    loader: "ts",
    format: "esm",
    sourcemap: false,
    target: "esnext",
  });
};

const virtualTypeScriptFileName = (id: string): string => {
  const basename = id.replace(/[^a-zA-Z0-9._-]/g, "_") || "virtual-module";
  return `${basename}.ts`;
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
    ...contextFingerprints(request.context),
    ...(getArtifactStoreFingerprints(request.options).sourceInputFingerprints ?? []),
  ],
});

const contextFingerprints = (
  context: VirtualModuleBuildContext | undefined,
): readonly VirtualArtifactFingerprint[] =>
  shouldFingerprintBuildContext(context)
    ? [
        createPluginConfigFingerprint(
          "virtual-module-build-context",
          fingerprintBuildContext(context),
        ),
      ]
    : [];

const shouldFingerprintBuildContext = (
  context: VirtualModuleBuildContext | undefined,
): boolean => context !== undefined && !(context.requestedExports.kind === "all" && context.requestedExports.reason === "dev mode");

const fingerprintBuildContext = (context: VirtualModuleBuildContext | undefined): unknown => {
  if (!context) return { requestedExports: "all", reason: "missing context" };
  const requestedExports =
    context.requestedExports.kind === "all"
      ? context.requestedExports
      : {
          kind: "names",
          names: [...context.requestedExports.names].sort(),
          typeOnlyNames: [...context.requestedExports.typeOnlyNames].sort(),
        };
  return {
    consumer: context.consumer,
    rootImporter: context.rootImporter,
    containingFile: context.containingFile,
    requestedExports,
  };
};

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

const decodeEffectiveImporter = (importer: string): string | undefined => {
  if (!isVirtualId(importer)) {
    return importer.includes("\0") ? undefined : importer;
  }
  const decoded = decodeVirtualId(importer);
  return decoded && validateDecodedPayload(decoded.id, decoded.importer)
    ? decoded.importer
    : undefined;
};

const resolveOptionalProjectRoot = (projectRoot: string | undefined): string | undefined =>
  typeof projectRoot === "string" && projectRoot.trim().length > 0
    ? resolve(projectRoot)
    : undefined;

const resolveRelativeVirtualImport = (
  id: string,
  importer: string,
  effectiveImporter: string,
): string | undefined => {
  if (!isVirtualId(importer) || !isRelativeImport(id)) return undefined;
  return firstExistingPath(resolve(dirname(effectiveImporter), id));
};

const isRelativeImport = (id: string): boolean => id.startsWith("./") || id.startsWith("../");

const firstExistingPath = (candidate: string): string | undefined => {
  const paths = extname(candidate)
    ? [candidate, ...sourceAlternatives(candidate)]
    : [`${candidate}.ts`, `${candidate}.tsx`, candidate];
  return paths.find((path) => existsSync(path));
};

const sourceAlternatives = (candidate: string): readonly string[] => {
  if (candidate.endsWith(".js")) return [candidate.slice(0, -3) + ".ts"];
  if (candidate.endsWith(".jsx")) return [candidate.slice(0, -4) + ".tsx"];
  return [];
};

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
