import { isVirtualLogicalIdentity, type VirtualLogicalIdentity } from "./ArtifactIdentity.js";

export const VIRTUAL_ARTIFACT_MANIFEST_VERSION = 1 as const;

export type VirtualArtifactFingerprintKind =
  | "source"
  | "file"
  | "glob"
  | "config"
  | "module"
  | "package"
  | "typescript"
  | "tsconfig";

export interface VirtualArtifactFingerprint {
  readonly kind: VirtualArtifactFingerprintKind;
  readonly name: string;
  readonly hash?: string;
  readonly version?: string;
  readonly packageName?: string;
  readonly packageVersion?: string;
  readonly unavailableReason?: string;
}

export type VirtualArtifactDependencyDescriptor =
  | {
      readonly type: "file";
      readonly path: string;
    }
  | {
      readonly type: "glob";
      readonly baseDir: string;
      readonly relativeGlobs: readonly string[];
      readonly recursive: boolean;
    };

export interface VirtualArtifactMessage {
  readonly severity: "error" | "warning" | "info";
  readonly message: string;
  readonly code?: string;
  readonly source?: string;
}

export interface VirtualArtifactDebugMetadata {
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly metadata?: JsonObject;
}

export interface VirtualArtifactManifest {
  readonly schemaVersion: typeof VIRTUAL_ARTIFACT_MANIFEST_VERSION;
  readonly logicalIdentity: VirtualLogicalIdentity;
  readonly virtualId: string;
  readonly effectiveImporter: string;
  readonly pluginName: string;
  readonly generatedSourcePath: string;
  readonly generatedSourceHash: string;
  readonly sourceInputFingerprints: readonly VirtualArtifactFingerprint[];
  readonly pluginFingerprints: readonly VirtualArtifactFingerprint[];
  readonly compilerFingerprints: readonly VirtualArtifactFingerprint[];
  readonly dependencyDescriptors: readonly VirtualArtifactDependencyDescriptor[];
  readonly diagnostics: readonly VirtualArtifactMessage[];
  readonly warnings: readonly VirtualArtifactMessage[];
  readonly debug: VirtualArtifactDebugMetadata;
}

export interface VirtualArtifactIndexEntry {
  readonly logicalIdentity: VirtualLogicalIdentity;
  readonly manifestPath: string;
  readonly generatedSourcePath: string;
  readonly virtualId: string;
  readonly effectiveImporter: string;
  readonly pluginName: string;
  readonly generatedSourceHash?: string;
  readonly diagnosticsCount?: number;
  readonly warningsCount?: number;
  readonly updatedAt?: string;
}

export interface VirtualArtifactIndex {
  readonly schemaVersion: typeof VIRTUAL_ARTIFACT_MANIFEST_VERSION;
  readonly artifacts: Readonly<Record<VirtualLogicalIdentity, VirtualArtifactIndexEntry>>;
}

export type ParseVirtualArtifactManifestResult =
  | { readonly ok: true; readonly manifest: VirtualArtifactManifest }
  | { readonly ok: false; readonly reason: string };

export type ParseVirtualArtifactIndexResult =
  | { readonly ok: true; readonly index: VirtualArtifactIndex }
  | { readonly ok: false; readonly reason: string };

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
type JsonObject = { readonly [key: string]: JsonValue };

export function parseVirtualArtifactManifest(value: unknown): ParseVirtualArtifactManifestResult {
  const object = expectObject(value, "manifest");
  if (!object.ok) return object;

  const version = expectVersion(object.value, "manifest");
  if (!version.ok) return version;

  const fields = validateManifestFields(object.value);
  if (!fields.ok) return fields;

  return { ok: true, manifest: object.value as unknown as VirtualArtifactManifest };
}

export function parseVirtualArtifactIndex(value: unknown): ParseVirtualArtifactIndexResult {
  const object = expectObject(value, "index");
  if (!object.ok) return object;

  const version = expectVersion(object.value, "index");
  if (!version.ok) return version;

  const artifacts = validateIndexEntries(object.value.artifacts);
  if (!artifacts.ok) return artifacts;

  return { ok: true, index: object.value as unknown as VirtualArtifactIndex };
}

export function createVirtualArtifactIndex(
  entries: readonly VirtualArtifactIndexEntry[],
): VirtualArtifactIndex {
  const artifacts: Record<VirtualLogicalIdentity, VirtualArtifactIndexEntry> = {};
  for (const entry of entries) {
    artifacts[entry.logicalIdentity] = entry;
  }
  return {
    schemaVersion: VIRTUAL_ARTIFACT_MANIFEST_VERSION,
    artifacts,
  };
}

const validateManifestFields = (value: JsonObject): ParseVirtualArtifactManifestResult => {
  const requiredStrings = [
    "virtualId",
    "effectiveImporter",
    "pluginName",
    "generatedSourcePath",
    "generatedSourceHash",
  ] as const;

  if (!isVirtualLogicalIdentity(value.logicalIdentity)) {
    return { ok: false, reason: "manifest.logicalIdentity must be a typed-virtual identity" };
  }

  for (const field of requiredStrings) {
    const result = expectString(value[field], `manifest.${field}`);
    if (!result.ok) return result;
  }

  return validateManifestCollections(value);
};

const validateManifestCollections = (value: JsonObject): ParseVirtualArtifactManifestResult => {
  const fingerprints = validateFingerprintArray(
    value.sourceInputFingerprints,
    "manifest.sourceInputFingerprints",
  );
  if (!fingerprints.ok) return fingerprints;

  const pluginFingerprints = validateFingerprintArray(
    value.pluginFingerprints,
    "manifest.pluginFingerprints",
  );
  if (!pluginFingerprints.ok) return pluginFingerprints;

  const compilerFingerprints = validateFingerprintArray(
    value.compilerFingerprints,
    "manifest.compilerFingerprints",
  );
  if (!compilerFingerprints.ok) return compilerFingerprints;

  const dependencies = validateDependencyDescriptorArray(
    value.dependencyDescriptors,
    "manifest.dependencyDescriptors",
  );
  if (!dependencies.ok) return dependencies;

  const diagnostics = validateMessageArray(value.diagnostics, "manifest.diagnostics");
  if (!diagnostics.ok) return diagnostics;

  const warnings = validateMessageArray(value.warnings, "manifest.warnings");
  if (!warnings.ok) return warnings;

  const debug = validateDebugMetadata(value.debug, "manifest.debug");
  return debug.ok ? { ok: true, manifest: value as unknown as VirtualArtifactManifest } : debug;
};

const FINGERPRINT_KINDS: ReadonlySet<VirtualArtifactFingerprintKind> = new Set([
  "source",
  "file",
  "glob",
  "config",
  "module",
  "package",
  "typescript",
  "tsconfig",
]);

const MESSAGE_SEVERITIES: ReadonlySet<VirtualArtifactMessage["severity"]> = new Set([
  "error",
  "warning",
  "info",
]);

const validateFingerprintArray = (
  value: JsonValue | undefined,
  label: string,
): ParseVirtualArtifactManifestResult => {
  if (!Array.isArray(value)) {
    return { ok: false, reason: `${label} must be an array` };
  }

  for (let index = 0; index < value.length; index++) {
    const result = validateFingerprint(value[index], `${label}[${index}]`);
    if (!result.ok) return result;
  }

  return { ok: true, manifest: {} as VirtualArtifactManifest };
};

const validateFingerprint = (
  value: JsonValue,
  label: string,
): ParseVirtualArtifactManifestResult => {
  const fingerprint = expectPlainObject(value, label);
  if (!fingerprint.ok) return fingerprint;

  if (
    typeof fingerprint.value.kind !== "string" ||
    !FINGERPRINT_KINDS.has(fingerprint.value.kind as VirtualArtifactFingerprintKind)
  ) {
    return { ok: false, reason: `${label}.kind is unsupported` };
  }

  const name = expectString(fingerprint.value.name, `${label}.name`);
  if (!name.ok) return name;

  for (const field of [
    "hash",
    "version",
    "packageName",
    "packageVersion",
    "unavailableReason",
  ] as const) {
    const result = expectOptionalString(fingerprint.value[field], `${label}.${field}`);
    if (!result.ok) return result;
  }

  return { ok: true, manifest: {} as VirtualArtifactManifest };
};

const validateDependencyDescriptorArray = (
  value: JsonValue | undefined,
  label: string,
): ParseVirtualArtifactManifestResult => {
  if (!Array.isArray(value)) {
    return { ok: false, reason: `${label} must be an array` };
  }

  for (let index = 0; index < value.length; index++) {
    const result = validateDependencyDescriptor(value[index], `${label}[${index}]`);
    if (!result.ok) return result;
  }

  return { ok: true, manifest: {} as VirtualArtifactManifest };
};

const validateDependencyDescriptor = (
  value: JsonValue,
  label: string,
): ParseVirtualArtifactManifestResult => {
  const descriptor = expectPlainObject(value, label);
  if (!descriptor.ok) return descriptor;

  if (descriptor.value.type === "file") {
    const path = expectString(descriptor.value.path, `${label}.path`);
    return path.ok ? { ok: true, manifest: {} as VirtualArtifactManifest } : path;
  }

  if (descriptor.value.type === "glob") {
    const baseDir = expectString(descriptor.value.baseDir, `${label}.baseDir`);
    if (!baseDir.ok) return baseDir;
    if (!Array.isArray(descriptor.value.relativeGlobs)) {
      return { ok: false, reason: `${label}.relativeGlobs must be an array` };
    }
    for (let index = 0; index < descriptor.value.relativeGlobs.length; index++) {
      const glob = expectString(
        descriptor.value.relativeGlobs[index],
        `${label}.relativeGlobs[${index}]`,
      );
      if (!glob.ok) return glob;
    }
    if (typeof descriptor.value.recursive !== "boolean") {
      return { ok: false, reason: `${label}.recursive must be a boolean` };
    }
    return { ok: true, manifest: {} as VirtualArtifactManifest };
  }

  return { ok: false, reason: `${label}.type is unsupported` };
};

const validateMessageArray = (
  value: JsonValue | undefined,
  label: string,
): ParseVirtualArtifactManifestResult => {
  if (!Array.isArray(value)) {
    return { ok: false, reason: `${label} must be an array` };
  }

  for (let index = 0; index < value.length; index++) {
    const result = validateMessage(value[index], `${label}[${index}]`);
    if (!result.ok) return result;
  }

  return { ok: true, manifest: {} as VirtualArtifactManifest };
};

const validateMessage = (value: JsonValue, label: string): ParseVirtualArtifactManifestResult => {
  const message = expectPlainObject(value, label);
  if (!message.ok) return message;

  if (
    typeof message.value.severity !== "string" ||
    !MESSAGE_SEVERITIES.has(message.value.severity as VirtualArtifactMessage["severity"])
  ) {
    return { ok: false, reason: `${label}.severity is unsupported` };
  }

  const messageText = expectString(message.value.message, `${label}.message`);
  if (!messageText.ok) return messageText;

  for (const field of ["code", "source"] as const) {
    const result = expectOptionalString(message.value[field], `${label}.${field}`);
    if (!result.ok) return result;
  }

  return { ok: true, manifest: {} as VirtualArtifactManifest };
};

const validateDebugMetadata = (
  value: JsonValue | undefined,
  label: string,
): ParseVirtualArtifactManifestResult => {
  const debug = expectPlainObject(value, label);
  if (!debug.ok) return debug;

  for (const field of ["createdAt", "updatedAt"] as const) {
    const result = expectOptionalString(debug.value[field], `${label}.${field}`);
    if (!result.ok) return result;
  }

  const metadata = expectOptionalJsonObject(debug.value.metadata, `${label}.metadata`);
  return metadata.ok ? { ok: true, manifest: {} as VirtualArtifactManifest } : metadata;
};

const validateIndexEntries = (value: JsonValue | undefined): ParseVirtualArtifactIndexResult => {
  const entries = expectPlainObject(value, "index.artifacts");
  if (!entries.ok) return entries;

  for (const [key, entry] of Object.entries(entries.value)) {
    const result = validateIndexEntry(key, entry);
    if (!result.ok) return result;
  }

  return { ok: true, index: { schemaVersion: VIRTUAL_ARTIFACT_MANIFEST_VERSION, artifacts: {} } };
};

const validateIndexEntry = (key: string, value: JsonValue): ParseVirtualArtifactIndexResult => {
  const entry = expectPlainObject(value, `index.artifacts.${key}`);
  if (!entry.ok) return entry;

  if (!isVirtualLogicalIdentity(key) || entry.value.logicalIdentity !== key) {
    return { ok: false, reason: `index.artifacts.${key} must match its logical identity key` };
  }

  for (const field of [
    "manifestPath",
    "generatedSourcePath",
    "virtualId",
    "effectiveImporter",
    "pluginName",
  ]) {
    const result = expectString(entry.value[field], `index.artifacts.${key}.${field}`);
    if (!result.ok) return result;
  }

  for (const field of ["generatedSourceHash", "updatedAt"] as const) {
    const result = expectOptionalString(entry.value[field], `index.artifacts.${key}.${field}`);
    if (!result.ok) return result;
  }

  for (const field of ["diagnosticsCount", "warningsCount"] as const) {
    const result = expectOptionalNonNegativeInteger(
      entry.value[field],
      `index.artifacts.${key}.${field}`,
    );
    if (!result.ok) return result;
  }

  return { ok: true, index: { schemaVersion: VIRTUAL_ARTIFACT_MANIFEST_VERSION, artifacts: {} } };
};

const expectVersion = (
  value: JsonObject,
  label: "manifest" | "index",
): { ok: true } | { ok: false; reason: string } => {
  if (value.schemaVersion !== VIRTUAL_ARTIFACT_MANIFEST_VERSION) {
    return {
      ok: false,
      reason: `Unsupported virtual artifact ${label} schema version: ${String(value.schemaVersion)}`,
    };
  }
  return { ok: true };
};

const expectString = (
  value: JsonValue | undefined,
  label: string,
): { ok: true } | { ok: false; reason: string } =>
  typeof value === "string" && value.length > 0
    ? { ok: true }
    : { ok: false, reason: `${label} must be a non-empty string` };

const expectOptionalString = (
  value: JsonValue | undefined,
  label: string,
): { ok: true } | { ok: false; reason: string } =>
  value === undefined || typeof value === "string"
    ? { ok: true }
    : { ok: false, reason: `${label} must be a string when present` };

const expectOptionalNonNegativeInteger = (
  value: JsonValue | undefined,
  label: string,
): { ok: true } | { ok: false; reason: string } =>
  value === undefined || (typeof value === "number" && Number.isInteger(value) && value >= 0)
    ? { ok: true }
    : { ok: false, reason: `${label} must be a non-negative integer` };

const expectOptionalJsonObject = (
  value: JsonValue | undefined,
  label: string,
): { ok: true } | { ok: false; reason: string } =>
  value === undefined || isJsonObject(value)
    ? { ok: true }
    : { ok: false, reason: `${label} must be a JSON object when present` };

const expectObject = (
  value: unknown,
  label: string,
): { ok: true; value: JsonObject } | { ok: false; reason: string } =>
  isPlainJsonObject(value)
    ? { ok: true, value }
    : { ok: false, reason: `${label} must be an object` };

const expectPlainObject = (
  value: unknown,
  label: string,
): { ok: true; value: JsonObject } | { ok: false; reason: string } =>
  isPlainJsonObject(value)
    ? { ok: true, value }
    : { ok: false, reason: `${label} must be an object` };

const isJsonObject = (value: unknown): value is JsonObject =>
  isPlainJsonObject(value) && isJsonValue(value, new WeakSet());

const isJsonValue = (value: unknown, seen: WeakSet<object>): value is JsonValue => {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return value.every((item) => isJsonValue(item, seen));
  }
  if (!isPlainJsonObject(value)) {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  return Object.values(value).every((item) => isJsonValue(item, seen));
};

const isPlainJsonObject = (value: unknown): value is JsonObject => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
