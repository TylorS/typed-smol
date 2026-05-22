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

export function decode<const Fields extends DataFields>(
  data: DataAttr<Fields>,
  source: DatasetSource | Readonly<Record<string, string | undefined>>,
): Effect.Effect<Type<Fields>, Schema.SchemaError, Schema.Struct.DecodingServices<Fields>> {
  return Effect.gen(function* () {
    const input = hasDataset(source) ? source.dataset : source;
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
  source: DatasetSource | Readonly<Record<string, string | undefined>>,
): source is DatasetSource {
  return "dataset" in source && typeof source.dataset === "object";
}
