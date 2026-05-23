import * as Schema from "effect/Schema";

export type SerializedPrimitiveValue =
  | { readonly _tag: "Null" }
  | { readonly _tag: "Undefined" }
  | { readonly _tag: "Boolean"; readonly value: boolean }
  | { readonly _tag: "Number"; readonly value: number }
  | { readonly _tag: "String"; readonly value: string; readonly truncated: boolean }
  | { readonly _tag: "BigInt"; readonly value: string }
  | { readonly _tag: "Symbol"; readonly value: string }
  | { readonly _tag: "Function"; readonly name?: string };

export type SerializedObjectEntry = {
  readonly key: string;
  readonly value: SerializedValue;
};

export type SerializedValue =
  | SerializedPrimitiveValue
  | {
      readonly _tag: "Array";
      readonly items: readonly SerializedValue[];
      readonly truncated: boolean;
    }
  | {
      readonly _tag: "Object";
      readonly entries: readonly SerializedObjectEntry[];
      readonly truncated: boolean;
    }
  | {
      readonly _tag: "Error";
      readonly name: string;
      readonly message: string;
      readonly stack?: SerializedValue;
    }
  | { readonly _tag: "Redacted"; readonly reason: string }
  | { readonly _tag: "Circular"; readonly path: string }
  | { readonly _tag: "MaxDepth"; readonly depth: number }
  | { readonly _tag: "Unserializable"; readonly reason: string };

export type DevtoolsSerializationOptions = {
  readonly maxDepth?: number;
  readonly maxEntries?: number;
  readonly maxStringLength?: number;
  readonly redactKeys?: readonly string[];
};

type NormalizedSerializationOptions = Required<DevtoolsSerializationOptions>;

type SerializationState = {
  readonly options: NormalizedSerializationOptions;
  readonly seen: WeakMap<object, string>;
};

const FiniteNumberSchema = Schema.Number.check(Schema.isFinite());

export const DEFAULT_REDACT_KEYS = [
  "authorization",
  "cookie",
  "password",
  "secret",
  "set-cookie",
  "token",
] as const;

export const SerializedValueSchema: Schema.Codec<SerializedValue> = Schema.Union([
  Schema.Struct({ _tag: Schema.Literal("Null") }),
  Schema.Struct({ _tag: Schema.Literal("Undefined") }),
  Schema.Struct({ _tag: Schema.Literal("Boolean"), value: Schema.Boolean }),
  Schema.Struct({ _tag: Schema.Literal("Number"), value: FiniteNumberSchema }),
  Schema.Struct({
    _tag: Schema.Literal("String"),
    value: Schema.String,
    truncated: Schema.Boolean,
  }),
  Schema.Struct({ _tag: Schema.Literal("BigInt"), value: Schema.String }),
  Schema.Struct({ _tag: Schema.Literal("Symbol"), value: Schema.String }),
  Schema.Struct({ _tag: Schema.Literal("Function"), name: Schema.optional(Schema.String) }),
  Schema.Struct({
    _tag: Schema.Literal("Array"),
    items: Schema.Array(Schema.suspend((): Schema.Codec<SerializedValue> => SerializedValueSchema)),
    truncated: Schema.Boolean,
  }),
  Schema.Struct({
    _tag: Schema.Literal("Object"),
    entries: Schema.Array(
      Schema.Struct({
        key: Schema.String,
        value: Schema.suspend((): Schema.Codec<SerializedValue> => SerializedValueSchema),
      }),
    ),
    truncated: Schema.Boolean,
  }),
  Schema.Struct({
    _tag: Schema.Literal("Error"),
    message: Schema.String,
    name: Schema.String,
    stack: Schema.optional(
      Schema.suspend((): Schema.Codec<SerializedValue> => SerializedValueSchema),
    ),
  }),
  Schema.Struct({ _tag: Schema.Literal("Redacted"), reason: Schema.String }),
  Schema.Struct({ _tag: Schema.Literal("Circular"), path: Schema.String }),
  Schema.Struct({ _tag: Schema.Literal("MaxDepth"), depth: FiniteNumberSchema }),
  Schema.Struct({ _tag: Schema.Literal("Unserializable"), reason: Schema.String }),
]);

export function serializeDevtoolsValue(
  value: unknown,
  options: DevtoolsSerializationOptions = {},
): SerializedValue {
  return serializeValue(value, { options: normalizeOptions(options), seen: new WeakMap() }, "$", 0);
}

export function serializeDevtoolsError(
  error: unknown,
  options: DevtoolsSerializationOptions = {},
): SerializedValue {
  if (error instanceof Error) {
    return serializeError(error, { options: normalizeOptions(options), seen: new WeakMap() });
  }

  return serializeDevtoolsValue(error, options);
}

export function decodeSerializedValue(payload: unknown): SerializedValue {
  return Schema.decodeUnknownSync(SerializedValueSchema)(payload, { onExcessProperty: "error" });
}

function serializeValue(
  value: unknown,
  state: SerializationState,
  path: string,
  depth: number,
): SerializedValue {
  if (value === null) return { _tag: "Null" };
  if (value === undefined) return { _tag: "Undefined" };

  const primitive = serializePrimitive(value, state.options);
  if (primitive !== undefined) return primitive;
  if (typeof value !== "object") return { _tag: "Unserializable", reason: typeof value };
  if (value instanceof Error) return serializeError(value, state);
  if (depth >= state.options.maxDepth) return { _tag: "MaxDepth", depth };

  const circularPath = state.seen.get(value);
  if (circularPath !== undefined) return { _tag: "Circular", path: circularPath };

  state.seen.set(value, path);
  return Array.isArray(value)
    ? serializeArray(value, state, path, depth)
    : serializeObject(value, state, path, depth);
}

function serializePrimitive(
  value: unknown,
  options: NormalizedSerializationOptions,
): SerializedValue | undefined {
  if (typeof value === "boolean") return { _tag: "Boolean", value };
  if (typeof value === "bigint") return { _tag: "BigInt", value: value.toString() };
  if (typeof value === "symbol") return { _tag: "Symbol", value: String(value) };
  if (typeof value === "function") return serializeFunction(value);
  if (typeof value === "number") return serializeNumber(value);
  if (typeof value === "string") return serializeString(value, options);
  return undefined;
}

function serializeArray(
  value: readonly unknown[],
  state: SerializationState,
  path: string,
  depth: number,
): SerializedValue {
  const items = value
    .slice(0, state.options.maxEntries)
    .map((item, index) => serializeValue(item, state, `${path}[${index}]`, depth + 1));

  return { _tag: "Array", items, truncated: value.length > state.options.maxEntries };
}

function serializeObject(
  value: object,
  state: SerializationState,
  path: string,
  depth: number,
): SerializedValue {
  const descriptors = Object.entries(Object.getOwnPropertyDescriptors(value))
    .filter(([, descriptor]) => descriptor.enumerable)
    .slice(0, state.options.maxEntries)
    .map(([key, descriptor]) => serializeObjectEntry(key, descriptor, state, path, depth));

  return {
    _tag: "Object",
    entries: descriptors,
    truncated: Object.keys(value).length > state.options.maxEntries,
  };
}

function serializeObjectEntry(
  key: string,
  descriptor: PropertyDescriptor,
  state: SerializationState,
  path: string,
  depth: number,
): SerializedObjectEntry {
  if (shouldRedactKey(key, state.options.redactKeys)) {
    return { key, value: { _tag: "Redacted", reason: `key:${key}` } };
  }

  if (!("value" in descriptor)) {
    return { key, value: { _tag: "Unserializable", reason: "accessor-property" } };
  }

  return { key, value: serializeValue(descriptor.value, state, `${path}.${key}`, depth + 1) };
}

function serializeError(error: Error, state: SerializationState): SerializedValue {
  const stack = error.stack === undefined ? undefined : serializeString(error.stack, state.options);
  return { _tag: "Error", message: error.message, name: error.name, ...(stack && { stack }) };
}

function serializeFunction(value: Function): SerializedPrimitiveValue {
  return value.name.length === 0 ? { _tag: "Function" } : { _tag: "Function", name: value.name };
}

function serializeNumber(value: number): SerializedValue {
  return Number.isFinite(value)
    ? { _tag: "Number", value }
    : { _tag: "Unserializable", reason: "non-finite-number" };
}

function serializeString(
  value: string,
  options: NormalizedSerializationOptions,
): SerializedPrimitiveValue {
  const truncated = value.length > options.maxStringLength;
  return {
    _tag: "String",
    truncated,
    value: truncated ? value.slice(0, options.maxStringLength) : value,
  };
}

function normalizeOptions(options: DevtoolsSerializationOptions): NormalizedSerializationOptions {
  return {
    maxDepth: options.maxDepth ?? 5,
    maxEntries: options.maxEntries ?? 50,
    maxStringLength: options.maxStringLength ?? 2_000,
    redactKeys: options.redactKeys ?? DEFAULT_REDACT_KEYS,
  };
}

function shouldRedactKey(key: string, redactKeys: readonly string[]): boolean {
  const normalizedKey = normalizeRedactionKey(key);
  return redactKeys.some((candidate) => normalizedKey.includes(normalizeRedactionKey(candidate)));
}

function normalizeRedactionKey(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}
