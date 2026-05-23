import * as Effect from "effect/Effect";

export const typedHmrMemoMapKey = "__typed_hmr_memo_map__";

export interface HmrMemoMapOptions {
  readonly hotData?: Record<string, unknown>;
  readonly globalObject?: Record<PropertyKey, unknown>;
}

export interface HmrMemoMap {
  readonly values: Map<string, unknown>;
}

export function getOrCreateHmrMemoValue<A>(
  key: string,
  create: () => A,
  options: HmrMemoMapOptions = {},
): A {
  const memoMap = getMemoMap(options);
  if (memoMap.values.has(key)) return memoMap.values.get(key) as A;
  const value = create();
  memoMap.values.set(key, value);
  return value;
}

export function getOrCreateHmrMemoEffect<A, E, R>(
  key: string,
  create: () => Effect.Effect<A, E, R>,
  options: HmrMemoMapOptions = {},
): Effect.Effect<A, E, R> {
  return Effect.gen(function* () {
    const memoMap = getMemoMap(options);
    if (memoMap.values.has(key)) return memoMap.values.get(key) as A;
    const value = yield* create();
    memoMap.values.set(key, value);
    return value;
  });
}

function getMemoMap(options: HmrMemoMapOptions): HmrMemoMap {
  const existing = getExistingMemoMap(options);
  if (existing) return existing;

  const memoMap: HmrMemoMap = { values: new Map() };
  getGlobalObject(options)[typedHmrMemoMapKey] = memoMap;
  if (options.hotData) options.hotData[typedHmrMemoMapKey] = memoMap;
  return memoMap;
}

function getExistingMemoMap(options: HmrMemoMapOptions): HmrMemoMap | undefined {
  const hotMemoMap = options.hotData?.[typedHmrMemoMapKey];
  if (isMemoMap(hotMemoMap)) return hotMemoMap;

  const globalMemoMap = getGlobalObject(options)[typedHmrMemoMapKey];
  if (!isMemoMap(globalMemoMap)) return undefined;
  if (options.hotData) options.hotData[typedHmrMemoMapKey] = globalMemoMap;
  return globalMemoMap;
}

function getGlobalObject(options: HmrMemoMapOptions): Record<PropertyKey, unknown> {
  return options.globalObject ?? (globalThis as unknown as Record<PropertyKey, unknown>);
}

function isMemoMap(value: unknown): value is HmrMemoMap {
  return typeof value === "object" && value !== null && value instanceof Object && "values" in value;
}
