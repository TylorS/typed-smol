import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { VirtualArtifactFingerprint } from "./ArtifactManifest.js";

type NormalizedJson =
  | readonly ["array", readonly NormalizedJson[]]
  | readonly ["boolean", boolean]
  | readonly ["hole"]
  | readonly ["null"]
  | readonly ["number", string]
  | readonly ["object", readonly (readonly [string, NormalizedJson])[]]
  | readonly ["string", string]
  | readonly ["undefined"];

type NormalizeJsonResult =
  | { readonly ok: true; readonly value: NormalizedJson }
  | { readonly ok: false; readonly reason: string };

type HashJsonResult =
  | { readonly ok: true; readonly hash: string }
  | { readonly ok: false; readonly reason: string };

const HASH_PREFIX = "sha256:" as const;

export function createGeneratedSourceHash(source: string): string {
  return hashVirtualArtifactContent(source);
}

export function createSourceInputFingerprint(sourcePath: string): VirtualArtifactFingerprint {
  return createFileContentFingerprint(
    "file",
    sourcePath,
    sourcePath,
    `Unable to read source input: ${sourcePath}`,
  );
}

export function createPluginModuleFingerprint(
  pluginName: string,
  modulePath: string,
): VirtualArtifactFingerprint {
  return createFileContentFingerprint(
    "module",
    pluginName,
    modulePath,
    `Unable to read plugin module: ${modulePath}`,
  );
}

export function createPluginConfigFingerprint(
  pluginName: string,
  config: unknown,
): VirtualArtifactFingerprint {
  const hash = tryHashVirtualArtifactJson(config, `Unable to hash plugin config for ${pluginName}`);
  if (!hash.ok) {
    return {
      kind: "config",
      name: pluginName,
      unavailableReason: hash.reason,
    };
  }

  return {
    kind: "config",
    name: pluginName,
    hash: hash.hash,
  };
}

export function createPluginPackageFingerprint(
  packageName: string,
  packageVersion?: string,
): VirtualArtifactFingerprint {
  if (packageVersion === undefined || packageVersion.length === 0) {
    return {
      kind: "package",
      name: packageName,
      packageName,
      unavailableReason: "Plugin package version is unavailable",
    };
  }

  return {
    kind: "package",
    name: packageName,
    packageName,
    packageVersion,
    hash: hashVirtualArtifactJson({ packageName, packageVersion }),
  };
}

export function createTypeScriptFingerprint(version: string): VirtualArtifactFingerprint {
  return {
    kind: "typescript",
    name: "typescript",
    version,
    hash: hashVirtualArtifactJson({ name: "typescript", version }),
  };
}

export function createParsedTsconfigFingerprint(
  parsedTsconfig: unknown,
): VirtualArtifactFingerprint {
  const hash = tryHashVirtualArtifactJson(parsedTsconfig, "Unable to hash parsed tsconfig");
  if (!hash.ok) {
    return {
      kind: "tsconfig",
      name: "parsed-tsconfig",
      unavailableReason: hash.reason,
    };
  }

  return {
    kind: "tsconfig",
    name: "parsed-tsconfig",
    hash: hash.hash,
  };
}

export function getNonReusableFingerprintReasons(
  fingerprints: readonly VirtualArtifactFingerprint[],
): readonly string[] {
  return fingerprints
    .map((fingerprint) => fingerprint.unavailableReason)
    .filter((reason): reason is string => typeof reason === "string" && reason.length > 0);
}

export function hashVirtualArtifactContent(content: string | Uint8Array): string {
  return `${HASH_PREFIX}${createHash("sha256").update(content).digest("hex")}`;
}

export function hashVirtualArtifactJson(value: unknown): string {
  return hashVirtualArtifactContent(stableJsonStringify(value));
}

export function stableJsonStringify(value: unknown): string {
  const normalized = normalizeJsonValue(value, new WeakSet());
  if (!normalized.ok) {
    throw new TypeError(normalized.reason);
  }
  return JSON.stringify(normalized.value);
}

const createFileContentFingerprint = (
  kind: "file" | "module",
  name: string,
  filePath: string,
  unavailableReason: string,
): VirtualArtifactFingerprint => {
  try {
    return {
      kind,
      name,
      hash: hashVirtualArtifactContent(readFileSync(filePath)),
    };
  } catch {
    return {
      kind,
      name,
      unavailableReason,
    };
  }
};

const tryHashVirtualArtifactJson = (value: unknown, reasonPrefix: string): HashJsonResult => {
  try {
    return { ok: true, hash: hashVirtualArtifactJson(value) };
  } catch (error) {
    return { ok: false, reason: `${reasonPrefix}: ${toErrorMessage(error)}` };
  }
};

const normalizeJsonValue = (value: unknown, seen: WeakSet<object>): NormalizeJsonResult => {
  if (value === undefined) {
    return { ok: true, value: ["undefined"] };
  }
  if (value === null) {
    return { ok: true, value: ["null"] };
  }
  if (typeof value === "string") {
    return { ok: true, value: ["string", value] };
  }
  if (typeof value === "boolean") {
    return { ok: true, value: ["boolean", value] };
  }
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { ok: true, value: ["number", Object.is(value, -0) ? "-0" : String(value)] }
      : { ok: false, reason: `Unsupported non-finite number: ${String(value)}` };
  }
  if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol") {
    return { ok: false, reason: `Unsupported JSON value type: ${typeof value}` };
  }
  if (Array.isArray(value)) {
    return normalizeJsonArray(value, seen);
  }
  if (typeof value === "object") {
    return normalizeJsonObject(value, seen);
  }
  return { ok: false, reason: `Unsupported JSON value type: ${typeof value}` };
};

const normalizeJsonArray = (
  value: readonly unknown[],
  seen: WeakSet<object>,
): NormalizeJsonResult => {
  if (seen.has(value)) {
    return { ok: false, reason: "Circular JSON value" };
  }

  const properties = validateArrayProperties(value);
  if (!properties.ok) return properties;

  seen.add(value);
  const normalized: NormalizedJson[] = [];
  for (let index = 0; index < value.length; index++) {
    if (!Object.hasOwn(value, index)) {
      normalized.push(["hole"]);
      continue;
    }
    const item = normalizeJsonValue(value[index], seen);
    if (!item.ok) {
      seen.delete(value);
      return item;
    }
    normalized.push(item.value);
  }
  seen.delete(value);
  return { ok: true, value: ["array", normalized] };
};

const normalizeJsonObject = (value: object, seen: WeakSet<object>): NormalizeJsonResult => {
  if (!isPlainObject(value)) {
    return { ok: false, reason: "Unsupported JSON object type; expected plain object" };
  }
  if (seen.has(value)) {
    return { ok: false, reason: "Circular JSON value" };
  }

  const properties = collectObjectDataProperties(value);
  if (!properties.ok) return properties;

  seen.add(value);
  const normalized: Array<readonly [string, NormalizedJson]> = [];
  for (const property of properties.properties) {
    const item = normalizeJsonValue(property.value, seen);
    if (!item.ok) {
      seen.delete(value);
      return item;
    }
    normalized.push([property.key, item.value]);
  }
  seen.delete(value);
  return { ok: true, value: ["object", normalized] };
};

type DataProperty = { readonly key: string; readonly value: unknown };

type DataPropertiesResult =
  | { readonly ok: true; readonly properties: readonly DataProperty[] }
  | { readonly ok: false; readonly reason: string };

const validateArrayProperties = (
  value: readonly unknown[],
): { ok: true } | DataPropertiesResult => {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") {
      return { ok: false, reason: "Unsupported symbol property key" };
    }
    if (key === "length") {
      continue;
    }
    if (!isArrayIndexKey(key)) {
      return { ok: false, reason: `Unsupported array property: ${key}` };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    const result = validateDataDescriptor(descriptor, `array.${key}`);
    if (!result.ok) return result;
  }
  return { ok: true };
};

const collectObjectDataProperties = (value: object): DataPropertiesResult => {
  const properties: DataProperty[] = [];
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") {
      return { ok: false, reason: "Unsupported symbol property key" };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) {
      return { ok: false, reason: `Missing property descriptor: ${key}` };
    }
    const result = validateDataDescriptor(descriptor, key);
    if (!result.ok) return result;
    properties.push({ key, value: descriptor.value });
  }
  return {
    ok: true,
    properties: properties.sort((left, right) => left.key.localeCompare(right.key)),
  };
};

const validateDataDescriptor = (
  descriptor: PropertyDescriptor | undefined,
  label: string,
): { ok: true } | { ok: false; reason: string } => {
  if (!descriptor) {
    return { ok: false, reason: `Missing property descriptor: ${label}` };
  }
  if ("get" in descriptor || "set" in descriptor) {
    return { ok: false, reason: `Unsupported accessor property: ${label}` };
  }
  if (!descriptor.enumerable) {
    return { ok: false, reason: `Unsupported non-enumerable property: ${label}` };
  }
  return { ok: true };
};

const isArrayIndexKey = (key: string): boolean => {
  const index = Number(key);
  return Number.isInteger(index) && index >= 0 && index < 2 ** 32 - 1 && String(index) === key;
};

const isPlainObject = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
