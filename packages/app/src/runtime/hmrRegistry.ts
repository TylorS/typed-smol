import * as Effect from "effect/Effect";

export const typedHmrRegistryKey = "__typed_hmr_registry__";

export interface HmrStateDescriptor {
  readonly moduleId: string;
  readonly serviceId: string;
  readonly symbolId?: string;
  readonly shapeFingerprint: string;
  readonly captureFingerprint?: string;
  readonly contextFingerprint?: string;
  readonly continuationFingerprints?: readonly string[];
  readonly dependencyFingerprints?: readonly string[];
  readonly version?: string;
}

export interface HmrRegistryEntry<A = unknown> extends HmrStateDescriptor {
  readonly value: A;
  readonly compatibilityFingerprint: string;
  readonly dispose: (() => void) | undefined;
}

export interface HmrRegistryOptions {
  readonly enabled?: boolean;
  readonly hotData?: Record<string, unknown>;
  readonly globalObject?: Record<PropertyKey, unknown>;
  readonly onDispose?: () => void;
}

export interface HmrRegistry {
  readonly entries: Map<string, HmrRegistryEntry>;
}

export function getOrCreateHmrState<A>(
  descriptor: HmrStateDescriptor,
  create: () => A,
  options: HmrRegistryOptions = {},
): A {
  if (options.enabled === false) return create();

  const registry = getRegistry(options);
  const key = entryKey(descriptor);
  const fingerprint = compatibilityFingerprint(descriptor);
  const entry = registry.entries.get(key);

  if (entry?.compatibilityFingerprint === fingerprint) return entry.value as A;
  if (entry) disposeEntry(entry);

  const value = create();
  registry.entries.set(key, {
    ...descriptor,
    value,
    compatibilityFingerprint: fingerprint,
    dispose: options.onDispose,
  });
  return value;
}

export function getOrCreateHmrStateEffect<A, E, R>(
  descriptor: HmrStateDescriptor,
  create: () => Effect.Effect<A, E, R>,
  options: HmrRegistryOptions = {},
): Effect.Effect<A, E, R> {
  if (options.enabled === false) return create();

  const registry = getRegistry(options);
  const key = entryKey(descriptor);
  const fingerprint = compatibilityFingerprint(descriptor);
  const entry = registry.entries.get(key);

  if (entry?.compatibilityFingerprint === fingerprint) return Effect.succeed(entry.value as A);
  if (entry) disposeEntry(entry);

  return Effect.map(create(), (value) => {
    registry.entries.set(key, {
      ...descriptor,
      value,
      compatibilityFingerprint: fingerprint,
      dispose: options.onDispose,
    });
    return value;
  });
}

export function getOrCreateRefSubjectHmrService<A>(
  descriptor: HmrStateDescriptor,
  create: () => A,
  options: HmrRegistryOptions = {},
): A {
  return getOrCreateHmrState(descriptor, create, options);
}

export function disposeHmrState(
  descriptor: Pick<HmrStateDescriptor, "moduleId" | "serviceId">,
  options: HmrRegistryOptions = {},
): void {
  const registry = getExistingRegistry(options);
  if (!registry) return;
  const key = entryKey(descriptor);
  const entry = registry.entries.get(key);
  if (!entry) return;
  disposeEntry(entry);
  registry.entries.delete(key);
}

export function pruneHmrState(
  predicate: (entry: HmrRegistryEntry) => boolean,
  options: HmrRegistryOptions = {},
): void {
  const registry = getExistingRegistry(options);
  if (!registry) return;
  for (const [key, entry] of registry.entries) {
    if (predicate(entry)) {
      disposeEntry(entry);
      registry.entries.delete(key);
    }
  }
}

function getRegistry(options: HmrRegistryOptions): HmrRegistry {
  const existing = getExistingRegistry(options);
  if (existing) return existing;

  const registry: HmrRegistry = { entries: new Map() };
  const globalObject = getGlobalObject(options);
  globalObject[typedHmrRegistryKey] = registry;
  if (options.hotData) options.hotData[typedHmrRegistryKey] = registry;
  return registry;
}

function getExistingRegistry(options: HmrRegistryOptions): HmrRegistry | undefined {
  const hotRegistry = options.hotData?.[typedHmrRegistryKey];
  if (isRegistry(hotRegistry)) return hotRegistry;

  const globalRegistry = getGlobalObject(options)[typedHmrRegistryKey];
  if (!isRegistry(globalRegistry)) return undefined;
  if (options.hotData) options.hotData[typedHmrRegistryKey] = globalRegistry;
  return globalRegistry;
}

function compatibilityFingerprint(descriptor: HmrStateDescriptor): string {
  return JSON.stringify({
    captureFingerprint: descriptor.captureFingerprint,
    contextFingerprint: descriptor.contextFingerprint,
    continuationFingerprints: [...(descriptor.continuationFingerprints ?? [])].sort(),
    dependencyFingerprints: [...(descriptor.dependencyFingerprints ?? [])].sort(),
    shapeFingerprint: descriptor.shapeFingerprint,
    symbolId: descriptor.symbolId,
    version: descriptor.version ?? "1",
  });
}

function entryKey(
  descriptor: Pick<HmrStateDescriptor, "moduleId" | "serviceId" | "symbolId">,
): string {
  return `${descriptor.moduleId}:${descriptor.symbolId ?? ""}:${descriptor.serviceId}`;
}

function disposeEntry(entry: HmrRegistryEntry): void {
  entry.dispose?.();
}

function getGlobalObject(options: HmrRegistryOptions): Record<PropertyKey, unknown> {
  return options.globalObject ?? (globalThis as unknown as Record<PropertyKey, unknown>);
}

function isRegistry(value: unknown): value is HmrRegistry {
  return (
    typeof value === "object" && value !== null && value instanceof Object && "entries" in value
  );
}
