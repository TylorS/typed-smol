import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export type DataFields = Schema.Struct.Fields;

export interface DataAttr<Fields extends DataFields> {
  readonly fields: Fields;
}

export type Type<Fields extends DataFields> = Schema.Struct.Type<Fields>;

export type Encoded<Fields extends DataFields> = Readonly<
  Partial<Record<keyof Fields & string, string>>
>;

export type BooleanString = "true" | "false";

export function schema<const Fields extends DataFields>(fields: Fields): DataAttr<Fields> {
  return { fields };
}

export function encode<const Fields extends DataFields>(
  data: DataAttr<Fields>,
  value: Type<Fields>,
): Effect.Effect<Encoded<Fields>, Schema.SchemaError, Schema.Struct.EncodingServices<Fields>> {
  return Effect.gen(function* () {
    const output: Record<string, string> = {};

    for (const [key, fieldSchema] of Object.entries(data.fields)) {
      const fieldValue = value[key as keyof Type<Fields>];
      if (fieldValue === undefined) continue;

      const encoded = yield* Schema.encodeEffect(fieldSchema)(fieldValue);
      output[key] = String(encoded);
    }

    return output as Encoded<Fields>;
  });
}

export function snapshot<const Fields extends DataFields>(
  data: DataAttr<Fields>,
  value: Type<Fields>,
): Effect.Effect<Encoded<Fields>, Schema.SchemaError, Schema.Struct.EncodingServices<Fields>> {
  return encode(data, value);
}

export function restore<Fields extends {}, State extends Fields>(
  state: State,
  fields: Fields,
): State {
  return Object.assign({}, state, fields);
}

export function props<const Fields extends DataFields>(
  data: DataAttr<Fields>,
  value: Type<Fields>,
): Effect.Effect<
  Readonly<Record<`data-${string}`, string>>,
  Schema.SchemaError,
  Schema.Struct.EncodingServices<Fields>
> {
  return Effect.map(encode(data, value), (encoded) => {
    const output: Record<`data-${string}`, string> = {};

    for (const [key, fieldValue] of Object.entries(encoded)) {
      if (fieldValue !== undefined) output[`data-${kebabCase(key)}`] = fieldValue;
    }

    return output;
  });
}

export function mergeEncoded(
  ...values: readonly Readonly<Record<string, string | undefined>>[]
): Readonly<Record<string, string>> {
  const output: Record<string, string> = {};

  for (const value of values) {
    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldValue !== undefined) output[key] = fieldValue;
    }
  }

  return output;
}

export function boolean(value: boolean): BooleanString {
  return value ? "true" : "false";
}

export function decode<const Fields extends DataFields>(
  data: DataAttr<Fields>,
  source: DatasetSource | Element | Readonly<Record<string, string | undefined>>,
): Effect.Effect<Type<Fields>, Schema.SchemaError, Schema.Struct.DecodingServices<Fields>> {
  return Effect.gen(function* () {
    const input = hasDataset(source) ? source.dataset : isElement(source) ? {} : source;
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(data.fields)) {
      const value = input[key];
      if (value !== undefined) output[key] = coerceDatasetValue(value);
    }

    return yield* Schema.decodeUnknownEffect(Schema.Struct(data.fields))(output);
  });
}

interface DatasetSource {
  readonly dataset: DOMStringMap;
}

function coerceDatasetValue(value: string | undefined): unknown {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function hasDataset(
  source: DatasetSource | Element | Readonly<Record<string, string | undefined>>,
): source is DatasetSource {
  return "dataset" in source && typeof source.dataset === "object";
}

function isElement(
  source: DatasetSource | Element | Readonly<Record<string, string | undefined>>,
): source is Element {
  return "nodeType" in source;
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
