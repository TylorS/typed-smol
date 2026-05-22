import type * as ts from "typescript";
import { dirname, relative, resolve } from "node:path";
import type {
  ResolveVirtualModuleOptions,
  VirtualArtifactStoreFactory,
  VirtualModulePluginNameResolution,
  VirtualModuleDiagnostic,
  VirtualModuleRecord,
  VirtualModuleResolution,
} from "../types.js";
import type { ResolveVirtualArtifactResult } from "./ArtifactStore.js";
import type { VirtualArtifactMessage } from "./ArtifactManifest.js";
import { rewriteSourceForPreviewLocation } from "./materializeVirtualFile.js";
import {
  createVirtualFileName,
  createVirtualKey,
  createWatchDescriptorKey,
  toPosixPath,
} from "./path.js";

export type MutableVirtualRecord = Omit<VirtualModuleRecord, "version" | "stale"> & {
  version: number;
  stale: boolean;
};

export interface ResolveRecordResultResolved {
  readonly status: "resolved";
  readonly record: MutableVirtualRecord;
}

export interface ResolveRecordResultUnresolved {
  readonly status: "unresolved";
}

export interface ResolveRecordResultError {
  readonly status: "error";
  readonly diagnostic: VirtualModuleDiagnostic;
}

export type ResolveRecordResult =
  | ResolveRecordResultResolved
  | ResolveRecordResultUnresolved
  | ResolveRecordResultError;

export interface VirtualRecordStoreOptions {
  readonly projectRoot: string;
  readonly resolver: {
    resolveModule(options: ResolveVirtualModuleOptions): VirtualModuleResolution;
    resolvePluginName?(options: ResolveVirtualModuleOptions): VirtualModulePluginNameResolution;
  };
  readonly createTypeInfoApiSession?: ResolveVirtualModuleOptions["createTypeInfoApiSession"];
  readonly artifactStoreFactory?: VirtualArtifactStoreFactory;
  readonly debounceMs?: number;
  readonly watchHost?: {
    watchFile?(path: string, callback: () => void): ts.FileWatcher;
    watchDirectory?(path: string, callback: () => void, recursive?: boolean): ts.FileWatcher;
  };
  /** Used by evictStaleImporters: records for which this returns true are evicted. */
  readonly shouldEvictRecord: (record: MutableVirtualRecord) => boolean;
  /** Used before returning a non-stale cached record. Return false to rebuild it. */
  readonly shouldReuseRecord?: (record: MutableVirtualRecord) => boolean;
  /** Called when flushPendingStale runs (after debounce). LS uses for epoch++. */
  readonly onFlushStale?: () => void;
  /** Called when a record is marked stale (immediate or after flush). CH uses for invalidatedPaths. */
  readonly onMarkStale?: (record: MutableVirtualRecord) => void;
  /** Called at start of resolveRecord (e.g. LS sets inResolveRecord). */
  readonly onBeforeResolve?: () => void;
  /** Called in finally after resolveRecord (e.g. LS clears inResolveRecord). */
  readonly onAfterResolve?: () => void;
  /** Called after a record is stored and watchers registered (e.g. LS clears diagnostics for importer). */
  readonly onRecordResolved?: (record: MutableVirtualRecord) => void;
  /** Called when a record is evicted (e.g. LS clears diagnostics for importer). */
  readonly onEvictRecord?: (record: MutableVirtualRecord) => void;
}

export function toResolvedModule(
  tsMod: typeof import("typescript"),
  fileName: string,
): ts.ResolvedModuleFull {
  return {
    resolvedFileName: fileName,
    extension: tsMod.Extension.Ts,
    isExternalLibraryImport: false,
  };
}

export function createVirtualRecordStore(options: VirtualRecordStoreOptions) {
  const recordsByKey = new Map<string, MutableVirtualRecord>();
  const recordsByVirtualFile = new Map<string, MutableVirtualRecord>();
  const descriptorToVirtualKeys = new Map<string, Set<string>>();
  const watcherByDescriptor = new Map<string, ts.FileWatcher>();

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const pendingStaleKeys = new Set<string>();
  const {
    debounceMs,
    watchHost,
    shouldEvictRecord,
    shouldReuseRecord,
    onFlushStale,
    onMarkStale,
    onBeforeResolve,
    onAfterResolve,
    onRecordResolved,
    onEvictRecord,
  } = options;

  const evictRecord = (record: MutableVirtualRecord): void => {
    onEvictRecord?.(record);
    recordsByKey.delete(record.key);
    recordsByVirtualFile.delete(record.virtualFileName);
    for (const descriptor of record.dependencies) {
      const descriptorKey = createWatchDescriptorKey(descriptor);
      const dependents = descriptorToVirtualKeys.get(descriptorKey);
      if (dependents) {
        dependents.delete(record.key);
        if (dependents.size === 0) {
          descriptorToVirtualKeys.delete(descriptorKey);
          const watcher = watcherByDescriptor.get(descriptorKey);
          if (watcher) {
            watcher.close();
            watcherByDescriptor.delete(descriptorKey);
          }
        }
      }
    }
  };

  const evictStaleImporters = (): void => {
    const toEvict: MutableVirtualRecord[] = [];
    for (const record of recordsByKey.values()) {
      if (shouldEvictRecord(record)) {
        toEvict.push(record);
      }
    }
    for (const record of toEvict) {
      evictRecord(record);
    }
  };

  const registerWatchers = (record: MutableVirtualRecord): void => {
    for (const descriptor of record.dependencies) {
      const descriptorKey = createWatchDescriptorKey(descriptor);
      const dependents = descriptorToVirtualKeys.get(descriptorKey) ?? new Set<string>();
      dependents.add(record.key);
      descriptorToVirtualKeys.set(descriptorKey, dependents);

      if (watcherByDescriptor.has(descriptorKey)) {
        continue;
      }

      if (descriptor.type === "file" && watchHost?.watchFile) {
        const watcher = watchHost.watchFile(descriptor.path, () => {
          markStale(descriptorKey);
        });
        watcherByDescriptor.set(descriptorKey, watcher);
      } else if (descriptor.type === "glob" && watchHost?.watchDirectory) {
        const watcher = watchHost.watchDirectory(
          descriptor.baseDir,
          () => {
            markStale(descriptorKey);
          },
          descriptor.recursive,
        );
        watcherByDescriptor.set(descriptorKey, watcher);
      }
    }
  };

  const markRecordStale = (record: MutableVirtualRecord): void => {
    if (record.stale) {
      return;
    }
    record.stale = true;
    onMarkStale?.(record);
  };

  const validateRecordForReuse = (record: MutableVirtualRecord): MutableVirtualRecord => {
    if (!record.stale && shouldReuseRecord && !shouldReuseRecord(record)) {
      markRecordStale(record);
    }
    return record;
  };

  const flushPendingStale = (): void => {
    if (pendingStaleKeys.size === 0) {
      return;
    }
    onFlushStale?.();
    for (const descriptorKey of pendingStaleKeys) {
      const keys = descriptorToVirtualKeys.get(descriptorKey);
      if (!keys || keys.size === 0) {
        continue;
      }
      for (const key of keys) {
        const record = recordsByKey.get(key);
        if (record) {
          markRecordStale(record);
        }
      }
    }
    pendingStaleKeys.clear();
    debounceTimer = undefined;
  };

  const markStale = (descriptorKey: string): void => {
    if (debounceMs !== undefined && debounceMs > 0) {
      pendingStaleKeys.add(descriptorKey);
      if (debounceTimer === undefined) {
        debounceTimer = setTimeout(() => {
          flushPendingStale();
        }, debounceMs);
      }
      return;
    }

    const keys = descriptorToVirtualKeys.get(descriptorKey);
    if (!keys || keys.size === 0) {
      return;
    }

    for (const key of keys) {
      const record = recordsByKey.get(key);
      if (record) {
        markRecordStale(record);
      }
    }
  };

  const markAllStale = (): void => {
    for (const record of recordsByKey.values()) {
      markRecordStale(record);
    }
  };

  const storeRecord = (
    record: MutableVirtualRecord,
    previous?: MutableVirtualRecord,
  ): ResolveRecordResultResolved => {
    recordsByKey.set(record.key, record);
    if (previous && previous.virtualFileName !== record.virtualFileName) {
      recordsByVirtualFile.delete(previous.virtualFileName);
    }
    recordsByVirtualFile.set(record.virtualFileName, record);
    registerWatchers(record);
    onRecordResolved?.(record);
    return {
      status: "resolved",
      record,
    };
  };

  const resolveRecord = (
    id: string,
    importer: string,
    previous?: MutableVirtualRecord,
  ): ResolveRecordResult => {
    onBeforeResolve?.();
    try {
      const key = createVirtualKey(id, importer);
      const resolveOptions: ResolveVirtualModuleOptions = {
        id,
        importer,
        createTypeInfoApiSession: options.createTypeInfoApiSession,
      };

      const cached = resolveCachedArtifactSource(options, resolveOptions, key);
      if (cached.status === "error") {
        return cached;
      }
      if (cached.status === "resolved" && !previous?.stale) {
        const record: MutableVirtualRecord = {
          key,
          id,
          importer,
          pluginName: cached.pluginName,
          virtualFileName: cached.virtualFileName,
          sourceText: cached.sourceText,
          dependencies: cached.dependencies,
          ...(cached.warnings?.length ? { warnings: cached.warnings } : {}),
          version: previous ? previous.version + 1 : 1,
          stale: false,
        };
        return storeRecord(record, previous);
      }

      const resolution = options.resolver.resolveModule(resolveOptions);
      if (resolution.status === "unresolved") {
        return { status: "unresolved" };
      }

      if (resolution.status === "error") {
        return {
          status: "error",
          diagnostic: resolution.diagnostic,
        };
      }

      const virtualFileName = createVirtualFileName(
        resolution.pluginName,
        key,
        { id, importer },
        { projectRoot: options.projectRoot },
      );
      const materialized = materializeRecordSource(
        options,
        resolution,
        key,
        id,
        importer,
        virtualFileName,
        (nestedId) => {
          const nested = getOrBuildRecord(nestedId, importer);
          return nested.status === "resolved" ? nested.record.virtualFileName : undefined;
        },
      );
      if (materialized.status === "error") {
        return materialized;
      }
      const record: MutableVirtualRecord = {
        key,
        id,
        importer,
        pluginName: resolution.pluginName,
        virtualFileName: materialized.virtualFileName,
        sourceText: materialized.sourceText,
        dependencies: resolution.dependencies,
        ...(resolution.warnings?.length ? { warnings: resolution.warnings } : {}),
        version: previous ? previous.version + 1 : 1,
        stale: false,
      };

      return storeRecord(record, previous);
    } finally {
      onAfterResolve?.();
    }
  };

  const getOrBuildRecord = (id: string, importer: string): ResolveRecordResult => {
    evictStaleImporters();

    const key = createVirtualKey(id, importer);
    const existing = recordsByKey.get(key);
    if (existing && !validateRecordForReuse(existing).stale) {
      return {
        status: "resolved",
        record: existing,
      };
    }

    return resolveRecord(id, importer, existing);
  };

  const findRecordByVirtualFile = (fileName: string): MutableVirtualRecord | undefined => {
    const exact = recordsByVirtualFile.get(fileName);
    if (exact) {
      return exact;
    }
    const normalized = toPosixPath(fileName);
    for (const record of recordsByVirtualFile.values()) {
      if (toPosixPath(record.virtualFileName) === normalized) {
        return record;
      }
    }
    return undefined;
  };

  /**
   * Walk the virtual-file chain from containingFile back to the root real-file importer.
   * When a virtual module imports another virtual module, the containing file is a virtual
   * file path; plugins must receive the real file as importer. Returns input unchanged if
   * not a virtual file. Handles cycles by breaking the loop.
   */
  const resolveEffectiveImporter = (containingFile: string): string => {
    let current = containingFile;
    const visited = new Set<string>();
    while (true) {
      if (visited.has(current)) break;
      visited.add(current);
      const record = findRecordByVirtualFile(current);
      if (!record) break;
      current = record.importer;
    }
    return current;
  };

  const dispose = (): void => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
    pendingStaleKeys.clear();

    for (const watcher of watcherByDescriptor.values()) {
      watcher.close();
    }
    watcherByDescriptor.clear();
    descriptorToVirtualKeys.clear();
    recordsByKey.clear();
    recordsByVirtualFile.clear();
  };

  return {
    recordsByKey,
    recordsByVirtualFile,
    descriptorToVirtualKeys,
    watcherByDescriptor,
    evictRecord,
    evictStaleImporters,
    registerWatchers,
    markStale,
    markAllStale,
    flushPendingStale,
    validateRecordForReuse,
    resolveRecord,
    getOrBuildRecord,
    findRecordByVirtualFile,
    resolveEffectiveImporter,
    dispose,
  };
}

type ArtifactSourceResult =
  | {
      readonly status: "resolved";
      readonly pluginName: string;
      readonly virtualFileName: string;
      readonly sourceText: string;
      readonly dependencies: MutableVirtualRecord["dependencies"];
      readonly warnings?: MutableVirtualRecord["warnings"];
    }
  | { readonly status: "miss" }
  | ResolveRecordResultError;

const resolveCachedArtifactSource = (
  options: VirtualRecordStoreOptions,
  resolveOptions: ResolveVirtualModuleOptions,
  virtualKey: string,
): ArtifactSourceResult => {
  const resolvePluginName = options.resolver.resolvePluginName?.bind(options.resolver);
  if (!options.artifactStoreFactory || !resolvePluginName) {
    return { status: "miss" };
  }

  const pluginResolution = resolvePluginName(resolveOptions);
  if (pluginResolution.status === "unresolved") {
    return { status: "miss" };
  }
  if (pluginResolution.status === "error") {
    return {
      status: "error",
      diagnostic: pluginResolution.diagnostic,
    };
  }

  const resolvedArtifact = resolveArtifactStoreEntry(
    options,
    pluginResolution.pluginName,
    virtualKey,
    resolveOptions.id,
    resolveOptions.importer,
  );
  if (resolvedArtifact.status === "error") {
    return resolvedArtifact;
  }
  if (resolvedArtifact.result.status !== "hit") {
    return { status: "miss" };
  }

  return {
    status: "resolved",
    pluginName: pluginResolution.pluginName,
    virtualFileName: resolvedArtifact.result.paths.sourcePath,
    sourceText: resolvedArtifact.result.sourceText,
    dependencies: resolvedArtifact.result.manifest.dependencyDescriptors,
    warnings: toVirtualModuleDiagnostics(
      pluginResolution.pluginName,
      resolvedArtifact.result.warnings,
    ),
  };
};

const materializeRecordSource = (
  options: VirtualRecordStoreOptions,
  resolution: Extract<VirtualModuleResolution, { status: "resolved" }>,
  virtualKey: string,
  id: string,
  importer: string,
  fallbackVirtualFileName: string,
  resolveNestedVirtualModule?: (id: string) => string | undefined,
):
  | { readonly status: "resolved"; readonly virtualFileName: string; readonly sourceText: string }
  | ResolveRecordResultError => {
  let artifactStore: ReturnType<VirtualArtifactStoreFactory> | undefined;
  try {
    artifactStore = options.artifactStoreFactory?.({
      pluginName: resolution.pluginName,
      virtualKey,
      projectRoot: options.projectRoot,
    });
  } catch (error) {
    return {
      status: "error",
      diagnostic: {
        code: "artifact-store-unavailable",
        pluginName: resolution.pluginName,
        message: `Virtual artifact store was unavailable during materialization: ${toErrorMessage(error)}`,
      },
    };
  }
  if (!artifactStore) {
    return {
      status: "resolved",
      virtualFileName: fallbackVirtualFileName,
      sourceText: resolution.sourceText,
    };
  }

  const resolvedArtifact = resolveArtifactStoreEntry(
    options,
    resolution.pluginName,
    virtualKey,
    id,
    importer,
  );
  if (resolvedArtifact.status === "error") {
    return resolvedArtifact;
  }
  if (resolvedArtifact.result.status === "hit") {
    return {
      status: "resolved",
      virtualFileName: resolvedArtifact.result.paths.sourcePath,
      sourceText: resolvedArtifact.result.sourceText,
    };
  }

  const sourceText = rewriteSourceForPreviewLocation(
    resolution.sourceText,
    importer,
    resolvedArtifact.result.paths.sourcePath,
    nestedVirtualModuleRewriter(
      options,
      importer,
      resolvedArtifact.result.paths.sourcePath,
      resolveNestedVirtualModule,
    ),
  );

  try {
    const materialized = artifactStore.materialize({
      id,
      importer,
      virtualKey,
      sourceText,
      dependencyDescriptors: resolution.dependencies,
      warnings: resolution.warnings?.map((warning) => ({
        severity: "warning",
        code: warning.code,
        message: warning.message,
        source: warning.pluginName,
      })),
    });
    return {
      status: "resolved",
      virtualFileName: materialized.paths.sourcePath,
      sourceText,
    };
  } catch (error) {
    return {
      status: "error",
      diagnostic: {
        code: "artifact-store-materialize-failed",
        pluginName: resolution.pluginName,
        message: `Virtual artifact materialization failed: ${toErrorMessage(error)}`,
      },
    };
  }
};

const rewriteNestedVirtualModuleSpecifiers = (
  options: VirtualRecordStoreOptions,
  sourceText: string,
  importer: string,
  virtualFileName: string,
  resolveNestedVirtualModule: ((id: string) => string | undefined) | undefined,
): string =>
  rewriteSourceForPreviewLocation(
  sourceText,
  importer,
  virtualFileName,
  nestedVirtualModuleRewriter(options, importer, virtualFileName, resolveNestedVirtualModule),
  );

const nestedVirtualModuleRewriter = (
  options: VirtualRecordStoreOptions,
  importer: string,
  virtualFileName: string,
  resolveNestedVirtualModule: ((id: string) => string | undefined) | undefined,
): ((id: string) => string | undefined) | undefined => {
  if (!resolveNestedVirtualModule) return undefined;
  return (id) => {
    const pluginResolution = options.resolver.resolvePluginName?.({
      id,
      importer,
      createTypeInfoApiSession: options.createTypeInfoApiSession,
    });
    if (pluginResolution?.status !== "resolved") return undefined;
    const nestedVirtualFileName = resolveNestedVirtualModule(id);
    if (!nestedVirtualFileName) return undefined;
    return toRelativeJavaScriptSpecifier(virtualFileName, nestedVirtualFileName);
  };
};

const toRelativeJavaScriptSpecifier = (fromFile: string, toFile: string): string => {
  const relativePath = toPosixPath(relative(dirname(fromFile), toFile));
  const withJavaScriptExtension = relativePath.replace(/\.[cm]?tsx?$/, ".js");
  return withJavaScriptExtension.startsWith(".")
    ? withJavaScriptExtension
    : `./${withJavaScriptExtension}`;
};

const resolveArtifactStoreEntry = (
  options: VirtualRecordStoreOptions,
  pluginName: string,
  virtualKey: string,
  id: string,
  importer: string,
):
  | { readonly status: "ok"; readonly result: ResolveVirtualArtifactResult }
  | ResolveRecordResultError => {
  try {
    const artifactStore = options.artifactStoreFactory?.({
      pluginName,
      virtualKey,
      projectRoot: options.projectRoot,
    });
    if (!artifactStore) {
      return {
        status: "error",
        diagnostic: {
          code: "artifact-store-unavailable",
          pluginName,
          message: "Virtual artifact store was unavailable during artifact resolution",
        },
      };
    }
    return {
      status: "ok",
      result: artifactStore.resolve({ id, importer, virtualKey }),
    };
  } catch (error) {
    return {
      status: "error",
      diagnostic: {
        code: "artifact-store-resolve-failed",
        pluginName,
        message: `Virtual artifact resolution failed: ${toErrorMessage(error)}`,
      },
    };
  }
};

const toVirtualModuleDiagnostics = (
  pluginName: string,
  messages: readonly VirtualArtifactMessage[],
): readonly VirtualModuleDiagnostic[] =>
  messages.map((message) => ({
    code: message.code ?? "artifact-store-message",
    pluginName: message.source ?? pluginName,
    message: message.message,
  }));

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
