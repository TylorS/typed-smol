import type * as ts from "typescript";
import type {
  ResolveVirtualModuleOptions,
  VirtualModuleDiagnostic,
  VirtualModuleRecord,
  VirtualModuleResolution,
} from "../types.js";
import { createVirtualFileName, createVirtualKey, createWatchDescriptorKey } from "./path.js";

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
  };
  readonly createTypeInfoApiSession?: ResolveVirtualModuleOptions["createTypeInfoApiSession"];
  readonly debounceMs?: number;
  readonly watchHost?: {
    watchFile?(path: string, callback: () => void): ts.FileWatcher;
    watchDirectory?(path: string, callback: () => void, recursive?: boolean): ts.FileWatcher;
  };
  /** Used by evictStaleImporters: records for which this returns true are evicted. */
  readonly shouldEvictRecord: (record: MutableVirtualRecord) => boolean;
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
          record.stale = true;
          onMarkStale?.(record);
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
        record.stale = true;
        onMarkStale?.(record);
      }
    }
  };

  const resolveRecord = (
    id: string,
    importer: string,
    previous?: MutableVirtualRecord,
  ): ResolveRecordResult => {
    onBeforeResolve?.();
    try {
      const resolveOptions: ResolveVirtualModuleOptions = {
        id,
        importer,
        createTypeInfoApiSession: options.createTypeInfoApiSession,
      };

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

      const key = createVirtualKey(id, importer);
      const virtualFileName = createVirtualFileName(
        resolution.pluginName,
        key,
        { id, importer },
        { projectRoot: options.projectRoot },
      );
      const record: MutableVirtualRecord = {
        key,
        id,
        importer,
        pluginName: resolution.pluginName,
        virtualFileName,
        sourceText: resolution.sourceText,
        dependencies: resolution.dependencies,
        ...(resolution.warnings?.length ? { warnings: resolution.warnings } : {}),
        version: previous ? previous.version + 1 : 1,
        stale: false,
      };

      recordsByKey.set(key, record);
      recordsByVirtualFile.set(virtualFileName, record);
      registerWatchers(record);
      onRecordResolved?.(record);
      return {
        status: "resolved",
        record,
      };
    } finally {
      onAfterResolve?.();
    }
  };

  const getOrBuildRecord = (id: string, importer: string): ResolveRecordResult => {
    evictStaleImporters();

    const key = createVirtualKey(id, importer);
    const existing = recordsByKey.get(key);
    if (existing && !existing.stale) {
      return {
        status: "resolved",
        record: existing,
      };
    }

    return resolveRecord(id, importer, existing);
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
    flushPendingStale,
    resolveRecord,
    getOrBuildRecord,
    dispose,
  };
}
