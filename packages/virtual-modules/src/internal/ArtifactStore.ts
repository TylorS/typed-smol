import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import {
  createArtifactPaths,
  createVirtualLogicalIdentity,
  type VirtualArtifactPaths,
  type VirtualLogicalIdentity,
} from "./ArtifactIdentity.js";
import {
  createGeneratedSourceHash,
  getNonReusableFingerprintReasons,
  hashVirtualArtifactJson,
} from "./ArtifactFingerprint.js";
import {
  createVirtualArtifactIndex,
  parseVirtualArtifactIndex,
  parseVirtualArtifactManifest,
  VIRTUAL_ARTIFACT_MANIFEST_VERSION,
  type VirtualArtifactDependencyDescriptor,
  type VirtualArtifactFingerprint,
  type VirtualArtifactIndex,
  type VirtualArtifactIndexEntry,
  type VirtualArtifactManifest,
  type VirtualArtifactMessage,
} from "./ArtifactManifest.js";
import { createVirtualKey, VIRTUAL_NODE_MODULES_RELATIVE } from "./path.js";

export interface ArtifactStoreFingerprints {
  readonly sourceInputFingerprints?: readonly VirtualArtifactFingerprint[];
  readonly pluginFingerprints?: readonly VirtualArtifactFingerprint[];
  readonly compilerFingerprints?: readonly VirtualArtifactFingerprint[];
}

export interface CreateVirtualArtifactStoreOptions {
  readonly projectRoot: string;
  readonly pluginName: string;
  readonly virtualKey?: string;
  readonly fingerprints?: ArtifactStoreFingerprints;
  readonly lockTimeoutMs?: number;
  readonly lockRetryMs?: number;
  readonly staleLockMs?: number;
}

export interface ResolveVirtualArtifactParams {
  readonly id: string;
  readonly importer: string;
  readonly virtualKey?: string;
  readonly fingerprints?: ArtifactStoreFingerprints;
}

export interface MaterializeVirtualArtifactParams extends ResolveVirtualArtifactParams {
  readonly sourceText: string;
  readonly sourceInputFingerprints?: readonly VirtualArtifactFingerprint[];
  readonly pluginFingerprints?: readonly VirtualArtifactFingerprint[];
  readonly compilerFingerprints?: readonly VirtualArtifactFingerprint[];
  readonly dependencyDescriptors?: readonly VirtualArtifactDependencyDescriptor[];
  readonly diagnostics?: readonly VirtualArtifactMessage[];
  readonly warnings?: readonly VirtualArtifactMessage[];
  readonly debugMetadata?: JsonObject;
}

export interface MaterializedVirtualArtifact {
  readonly logicalIdentity: VirtualLogicalIdentity;
  readonly paths: VirtualArtifactPaths;
  readonly manifest: VirtualArtifactManifest;
}

export type ReadVirtualArtifactManifestResult =
  | { readonly status: "ok"; readonly manifest: VirtualArtifactManifest }
  | { readonly status: "missing"; readonly reason: "manifest-missing" }
  | { readonly status: "corrupt"; readonly reason: "manifest-corrupt"; readonly details: string };

export type ReadVirtualArtifactIndexResult =
  | { readonly status: "ok"; readonly index: VirtualArtifactIndex }
  | { readonly status: "missing"; readonly reason: "index-missing" }
  | { readonly status: "corrupt"; readonly reason: "index-corrupt"; readonly details: string };

export type ResolveVirtualArtifactResult =
  | {
      readonly status: "hit";
      readonly logicalIdentity: VirtualLogicalIdentity;
      readonly paths: VirtualArtifactPaths;
      readonly manifest: VirtualArtifactManifest;
      readonly sourceText: string;
      readonly diagnostics: readonly VirtualArtifactMessage[];
      readonly warnings: readonly VirtualArtifactMessage[];
    }
  | {
      readonly status: "miss";
      readonly reason: "manifest-missing";
      readonly logicalIdentity: VirtualLogicalIdentity;
      readonly paths: VirtualArtifactPaths;
      readonly diagnostics: readonly VirtualArtifactMessage[];
      readonly warnings: readonly VirtualArtifactMessage[];
    }
  | {
      readonly status: "invalid";
      readonly reason:
        | "fingerprint-mismatch"
        | "fingerprint-unavailable"
        | "manifest-corrupt"
        | "manifest-identity-mismatch"
        | "source-hash-mismatch"
        | "source-missing";
      readonly details?: string;
      readonly logicalIdentity: VirtualLogicalIdentity;
      readonly paths: VirtualArtifactPaths;
      readonly manifest?: VirtualArtifactManifest;
      readonly diagnostics: readonly VirtualArtifactMessage[];
      readonly warnings: readonly VirtualArtifactMessage[];
    };

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
type JsonObject = { readonly [key: string]: JsonValue };

const EMPTY_FINGERPRINTS: Required<ArtifactStoreFingerprints> = {
  sourceInputFingerprints: [
    {
      kind: "source",
      name: "source-inputs",
      unavailableReason: "Source input fingerprints are unavailable",
    },
  ],
  pluginFingerprints: [
    {
      kind: "config",
      name: "plugin-inputs",
      unavailableReason: "Plugin fingerprints are unavailable",
    },
  ],
  compilerFingerprints: [
    {
      kind: "typescript",
      name: "compiler-inputs",
      unavailableReason: "Compiler fingerprints are unavailable",
    },
  ],
};

let atomicWriteCounter = 0;

interface LockOptions {
  readonly timeoutMs: number;
  readonly retryMs: number;
  readonly staleMs: number;
}

export interface VirtualArtifactStore {
  readonly indexPath: string;
  resolve(params: ResolveVirtualArtifactParams): ResolveVirtualArtifactResult;
  readManifest(logicalIdentity: VirtualLogicalIdentity): ReadVirtualArtifactManifestResult;
  materialize(params: MaterializeVirtualArtifactParams): MaterializedVirtualArtifact;
  readProjectIndex(): ReadVirtualArtifactIndexResult;
  __unsafeReleaseLockForTesting(lockPath: string, ownerToken: string): void;
}

export function createVirtualArtifactStore(
  options: CreateVirtualArtifactStoreOptions,
): VirtualArtifactStore {
  const projectRoot = resolve(options.projectRoot);
  const indexPath = join(projectRoot, VIRTUAL_NODE_MODULES_RELATIVE, "index.json");
  const defaults = normalizeFingerprints(options.fingerprints);
  const lockOptions = createLockOptions(options);

  return {
    indexPath,
    resolve: (params) => resolveArtifact(options, projectRoot, defaults, params),
    readManifest: (logicalIdentity) =>
      readManifestFile(createArtifactPaths(projectRoot, logicalIdentity)),
    materialize: (params) =>
      materializeArtifact(options, projectRoot, defaults, indexPath, lockOptions, params),
    readProjectIndex: () => readProjectIndexFile(indexPath),
    __unsafeReleaseLockForTesting: releaseFileLock,
  };
}

const resolveArtifact = (
  options: CreateVirtualArtifactStoreOptions,
  projectRoot: string,
  defaults: Required<ArtifactStoreFingerprints>,
  params: ResolveVirtualArtifactParams,
): ResolveVirtualArtifactResult => {
  const identity = resolveIdentity(options, params);
  const paths = createArtifactPaths(projectRoot, identity);
  const manifestResult = readManifestFile(paths);
  if (manifestResult.status === "missing") {
    return createMiss(identity, paths);
  }
  if (manifestResult.status === "corrupt") {
    return createInvalid(identity, paths, "manifest-corrupt", manifestResult.details);
  }
  return validateManifestHit(
    identity,
    paths,
    mergeFingerprints(defaults, params.fingerprints),
    manifestResult.manifest,
  );
};

const materializeArtifact = (
  options: CreateVirtualArtifactStoreOptions,
  projectRoot: string,
  defaults: Required<ArtifactStoreFingerprints>,
  indexPath: string,
  lockOptions: LockOptions,
  params: MaterializeVirtualArtifactParams,
): MaterializedVirtualArtifact => {
  const logicalIdentity = resolveIdentity(options, params);
  const paths = createArtifactPaths(projectRoot, logicalIdentity);
  const now = new Date().toISOString();
  const fingerprints = fingerprintsFromMaterialize(defaults, params);
  const manifest = createManifest(
    options.pluginName,
    logicalIdentity,
    paths,
    params,
    fingerprints,
    now,
  );

  withFileLock(`${paths.manifestPath}.lock`, "artifact lock", lockOptions, () => {
    withFileLock(`${indexPath}.lock`, "index lock", lockOptions, () => {
      atomicWriteText(paths.sourcePath, params.sourceText);
      atomicWriteJson(paths.manifestPath, manifest);
      updateProjectIndex(indexPath, createIndexEntry(manifest, paths));
    });
  });

  return { logicalIdentity, paths, manifest };
};

const validateManifestHit = (
  logicalIdentity: VirtualLogicalIdentity,
  paths: VirtualArtifactPaths,
  current: Required<ArtifactStoreFingerprints>,
  manifest: VirtualArtifactManifest,
): ResolveVirtualArtifactResult => {
  const base = {
    logicalIdentity,
    paths,
    manifest,
    diagnostics: manifest.diagnostics,
    warnings: manifest.warnings,
  };
  if (manifest.logicalIdentity !== logicalIdentity) {
    return { ...base, status: "invalid", reason: "manifest-identity-mismatch" };
  }

  const fingerprintIssue = validateFingerprints(current, manifest);
  if (fingerprintIssue) {
    return { ...base, status: "invalid", ...fingerprintIssue };
  }

  const source = readGeneratedSource(paths.sourcePath);
  if (!source.ok) {
    return { ...base, status: "invalid", reason: "source-missing" };
  }
  if (createGeneratedSourceHash(source.text) !== manifest.generatedSourceHash) {
    return { ...base, status: "invalid", reason: "source-hash-mismatch" };
  }

  return { ...base, status: "hit", sourceText: source.text };
};

const createMiss = (
  logicalIdentity: VirtualLogicalIdentity,
  paths: VirtualArtifactPaths,
): ResolveVirtualArtifactResult => ({
  status: "miss",
  reason: "manifest-missing",
  logicalIdentity,
  paths,
  diagnostics: [],
  warnings: [],
});

const createInvalid = (
  logicalIdentity: VirtualLogicalIdentity,
  paths: VirtualArtifactPaths,
  reason: "manifest-corrupt",
  details: string,
): ResolveVirtualArtifactResult => ({
  status: "invalid",
  reason,
  details,
  logicalIdentity,
  paths,
  diagnostics: [],
  warnings: [],
});

const validateFingerprints = (
  current: Required<ArtifactStoreFingerprints>,
  manifest: VirtualArtifactManifest,
):
  | { readonly reason: "fingerprint-mismatch" }
  | { readonly reason: "fingerprint-unavailable"; readonly details: string }
  | undefined => {
  const unavailable = getNonReusableFingerprintReasons(flattenFingerprints(current));
  if (unavailable.length > 0) {
    return { reason: "fingerprint-unavailable", details: unavailable.join("; ") };
  }

  const missingHashes = getMissingFingerprintHashReasons(flattenFingerprints(current));
  if (missingHashes.length > 0) {
    return { reason: "fingerprint-unavailable", details: missingHashes.join("; ") };
  }

  return fingerprintsMatch(current, manifest) ? undefined : { reason: "fingerprint-mismatch" };
};

const fingerprintsMatch = (
  current: Required<ArtifactStoreFingerprints>,
  manifest: VirtualArtifactManifest,
): boolean =>
  hashVirtualArtifactJson(current.sourceInputFingerprints) ===
    hashVirtualArtifactJson(manifest.sourceInputFingerprints) &&
  hashVirtualArtifactJson(current.pluginFingerprints) ===
    hashVirtualArtifactJson(manifest.pluginFingerprints) &&
  hashVirtualArtifactJson(current.compilerFingerprints) ===
    hashVirtualArtifactJson(manifest.compilerFingerprints);

const flattenFingerprints = (
  fingerprints: Required<ArtifactStoreFingerprints>,
): readonly VirtualArtifactFingerprint[] => [
  ...fingerprints.sourceInputFingerprints,
  ...fingerprints.pluginFingerprints,
  ...fingerprints.compilerFingerprints,
];

const getMissingFingerprintHashReasons = (
  fingerprints: readonly VirtualArtifactFingerprint[],
): readonly string[] =>
  fingerprints.flatMap((fingerprint) =>
    typeof fingerprint.hash === "string" && fingerprint.hash.length > 0
      ? []
      : [`${fingerprint.name} fingerprint hash is unavailable`],
  );

const createManifest = (
  pluginName: string,
  logicalIdentity: VirtualLogicalIdentity,
  paths: VirtualArtifactPaths,
  params: MaterializeVirtualArtifactParams,
  fingerprints: Required<ArtifactStoreFingerprints>,
  now: string,
): VirtualArtifactManifest => ({
  schemaVersion: VIRTUAL_ARTIFACT_MANIFEST_VERSION,
  logicalIdentity,
  virtualId: params.id,
  effectiveImporter: params.importer,
  pluginName,
  generatedSourcePath: paths.sourcePath,
  generatedSourceHash: createGeneratedSourceHash(params.sourceText),
  sourceInputFingerprints: fingerprints.sourceInputFingerprints,
  pluginFingerprints: fingerprints.pluginFingerprints,
  compilerFingerprints: fingerprints.compilerFingerprints,
  dependencyDescriptors: params.dependencyDescriptors ?? [],
  diagnostics: params.diagnostics ?? [],
  warnings: params.warnings ?? [],
  debug: {
    createdAt: now,
    updatedAt: now,
    metadata: params.debugMetadata,
  },
});

const createIndexEntry = (
  manifest: VirtualArtifactManifest,
  paths: VirtualArtifactPaths,
): VirtualArtifactIndexEntry => ({
  logicalIdentity: manifest.logicalIdentity,
  manifestPath: paths.manifestPath,
  generatedSourcePath: paths.sourcePath,
  virtualId: manifest.virtualId,
  effectiveImporter: manifest.effectiveImporter,
  pluginName: manifest.pluginName,
  generatedSourceHash: manifest.generatedSourceHash,
  diagnosticsCount: manifest.diagnostics.length,
  warningsCount: manifest.warnings.length,
  updatedAt: manifest.debug.updatedAt,
});

const updateProjectIndex = (indexPath: string, entry: VirtualArtifactIndexEntry): void => {
  const current = readProjectIndexFile(indexPath);
  const entries =
    current.status === "ok"
      ? Object.values(current.index.artifacts).filter(
          (existing) => existing.logicalIdentity !== entry.logicalIdentity,
        )
      : [];
  atomicWriteJson(indexPath, createVirtualArtifactIndex([...entries, entry]));
};

const readManifestFile = (paths: VirtualArtifactPaths): ReadVirtualArtifactManifestResult => {
  const parsed = readJsonFile(paths.manifestPath);
  if (parsed.status === "missing") return { status: "missing", reason: "manifest-missing" };
  if (parsed.status === "corrupt") {
    return { status: "corrupt", reason: "manifest-corrupt", details: parsed.details };
  }

  const result = parseVirtualArtifactManifest(parsed.value);
  return result.ok
    ? { status: "ok", manifest: result.manifest }
    : { status: "corrupt", reason: "manifest-corrupt", details: result.reason };
};

const readProjectIndexFile = (indexPath: string): ReadVirtualArtifactIndexResult => {
  const parsed = readJsonFile(indexPath);
  if (parsed.status === "missing") return { status: "missing", reason: "index-missing" };
  if (parsed.status === "corrupt") {
    return { status: "corrupt", reason: "index-corrupt", details: parsed.details };
  }

  const result = parseVirtualArtifactIndex(parsed.value);
  return result.ok
    ? { status: "ok", index: result.index }
    : { status: "corrupt", reason: "index-corrupt", details: result.reason };
};

const readJsonFile = (
  path: string,
):
  | { readonly status: "ok"; readonly value: unknown }
  | { readonly status: "missing" }
  | { readonly status: "corrupt"; readonly details: string } => {
  try {
    return { status: "ok", value: JSON.parse(readFileSync(path, "utf8")) };
  } catch (error) {
    if (isMissingFileError(error)) {
      return { status: "missing" };
    }
    return { status: "corrupt", details: toErrorMessage(error) };
  }
};

const readGeneratedSource = (
  path: string,
): { readonly ok: true; readonly text: string } | { readonly ok: false } => {
  try {
    return { ok: true, text: readFileSync(path, "utf8") };
  } catch {
    return { ok: false };
  }
};

const atomicWriteJson = (path: string, value: unknown): void =>
  atomicWriteText(path, `${canonicalJsonStringify(value)}\n`);

const atomicWriteText = (path: string, text: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  const counter = (atomicWriteCounter += 1);
  const tempPath = join(
    dirname(path),
    `.${basename(path)}.${process.pid}.${Date.now()}.${counter}.tmp`,
  );
  try {
    writeFileSync(tempPath, text, "utf8");
    renameSync(tempPath, path);
  } catch (error) {
    rmSync(tempPath, { force: true });
    throw error;
  }
};

const resolveIdentity = (
  options: CreateVirtualArtifactStoreOptions,
  params: ResolveVirtualArtifactParams,
): VirtualLogicalIdentity =>
  createVirtualLogicalIdentity(
    options.pluginName,
    params.virtualKey ?? options.virtualKey ?? createVirtualKey(params.id, params.importer),
    {
      id: params.id,
      importer: params.importer,
    },
  );

const fingerprintsFromMaterialize = (
  defaults: Required<ArtifactStoreFingerprints>,
  params: MaterializeVirtualArtifactParams,
): Required<ArtifactStoreFingerprints> => ({
  sourceInputFingerprints: mergeFingerprintGroup(
    params.sourceInputFingerprints,
    defaults.sourceInputFingerprints,
    EMPTY_FINGERPRINTS.sourceInputFingerprints,
  ),
  pluginFingerprints: mergeFingerprintGroup(
    params.pluginFingerprints,
    defaults.pluginFingerprints,
    EMPTY_FINGERPRINTS.pluginFingerprints,
  ),
  compilerFingerprints: mergeFingerprintGroup(
    params.compilerFingerprints,
    defaults.compilerFingerprints,
    EMPTY_FINGERPRINTS.compilerFingerprints,
  ),
});

const mergeFingerprints = (
  defaults: Required<ArtifactStoreFingerprints>,
  current?: ArtifactStoreFingerprints,
): Required<ArtifactStoreFingerprints> => ({
  sourceInputFingerprints: mergeFingerprintGroup(
    current?.sourceInputFingerprints,
    defaults.sourceInputFingerprints,
    EMPTY_FINGERPRINTS.sourceInputFingerprints,
  ),
  pluginFingerprints: mergeFingerprintGroup(
    current?.pluginFingerprints,
    defaults.pluginFingerprints,
    EMPTY_FINGERPRINTS.pluginFingerprints,
  ),
  compilerFingerprints: mergeFingerprintGroup(
    current?.compilerFingerprints,
    defaults.compilerFingerprints,
    EMPTY_FINGERPRINTS.compilerFingerprints,
  ),
});

const normalizeFingerprints = (
  fingerprints?: ArtifactStoreFingerprints,
): Required<ArtifactStoreFingerprints> => ({
  sourceInputFingerprints: mergeFingerprintGroup(
    fingerprints?.sourceInputFingerprints,
    EMPTY_FINGERPRINTS.sourceInputFingerprints,
    EMPTY_FINGERPRINTS.sourceInputFingerprints,
  ),
  pluginFingerprints: mergeFingerprintGroup(
    fingerprints?.pluginFingerprints,
    EMPTY_FINGERPRINTS.pluginFingerprints,
    EMPTY_FINGERPRINTS.pluginFingerprints,
  ),
  compilerFingerprints: mergeFingerprintGroup(
    fingerprints?.compilerFingerprints,
    EMPTY_FINGERPRINTS.compilerFingerprints,
    EMPTY_FINGERPRINTS.compilerFingerprints,
  ),
});

const mergeFingerprintGroup = (
  fingerprints: readonly VirtualArtifactFingerprint[] | undefined,
  fallback: readonly VirtualArtifactFingerprint[],
  emptyFallback: readonly VirtualArtifactFingerprint[],
): readonly VirtualArtifactFingerprint[] =>
  fingerprints === undefined ? fallback : fingerprints.length > 0 ? fingerprints : emptyFallback;

const createLockOptions = (options: CreateVirtualArtifactStoreOptions): LockOptions => ({
  timeoutMs: options.lockTimeoutMs ?? 10_000,
  retryMs: options.lockRetryMs ?? 10,
  staleMs: options.staleLockMs ?? 60_000,
});

const withFileLock = <T>(
  lockPath: string,
  label: string,
  options: LockOptions,
  run: () => T,
): T => {
  const ownerToken = acquireFileLock(lockPath, label, options);
  try {
    return run();
  } finally {
    releaseFileLock(lockPath, ownerToken);
  }
};

const acquireFileLock = (lockPath: string, label: string, options: LockOptions): string => {
  mkdirSync(dirname(lockPath), { recursive: true });
  const deadline = Date.now() + options.timeoutMs;
  const ownerToken = createLockOwnerToken();
  for (;;) {
    try {
      mkdirSync(lockPath);
      writeLockMetadata(lockPath, ownerToken);
      return ownerToken;
    } catch (error) {
      if (!isFileExistsError(error)) {
        throw new Error(`Timed out acquiring ${label}: ${lockPath}`);
      }
      if (removeStaleLock(lockPath, options.staleMs)) {
        continue;
      }
      if (Date.now() >= deadline) {
        throw new Error(`Timed out acquiring ${label}: ${lockPath}`);
      }
      sleepSync(options.retryMs);
    }
  }
};

const createLockOwnerToken = (): string =>
  `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const writeLockMetadata = (lockPath: string, ownerToken: string): void => {
  writeFileSync(
    join(lockPath, "lock.json"),
    `${JSON.stringify({
      createdAt: Date.now(),
      hostname: hostname(),
      ownerToken,
      pid: process.pid,
    })}\n`,
    "utf8",
  );
};

const removeStaleLock = (lockPath: string, staleMs: number): boolean => {
  const metadata = readLockMetadata(lockPath);
  if (metadata === undefined || Date.now() - metadata.createdAt < staleMs) {
    return false;
  }
  rmSync(lockPath, { recursive: true, force: true });
  return true;
};

const releaseFileLock = (lockPath: string, ownerToken: string): void => {
  const metadata = readLockMetadata(lockPath);
  if (metadata?.ownerToken !== ownerToken) {
    return;
  }
  rmSync(lockPath, { recursive: true, force: true });
};

const readLockMetadata = (
  lockPath: string,
): { readonly createdAt: number; readonly ownerToken?: string } | undefined => {
  try {
    const value = JSON.parse(readFileSync(join(lockPath, "lock.json"), "utf8")) as {
      readonly createdAt?: unknown;
      readonly ownerToken?: unknown;
    };
    return typeof value.createdAt === "number"
      ? {
          createdAt: value.createdAt,
          ...(typeof value.ownerToken === "string" ? { ownerToken: value.ownerToken } : {}),
        }
      : undefined;
  } catch {
    return undefined;
  }
};

const sleepSync = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const canonicalJsonStringify = (value: unknown): string =>
  JSON.stringify(sortJsonValue(value), null, 2);

const sortJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (isPlainObject(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortJsonValue(value[key]);
    }
    return sorted;
  }
  return value;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isFileExistsError = (error: unknown): boolean => isNodeErrorWithCode(error, "EEXIST");

const isMissingFileError = (error: unknown): boolean =>
  isNodeErrorWithCode(error, "ENOENT") || isNodeErrorWithCode(error, "ENOTDIR");

const isNodeErrorWithCode = (error: unknown, code: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { readonly code?: unknown }).code === code;

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
