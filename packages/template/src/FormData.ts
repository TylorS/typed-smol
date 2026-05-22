import { Data } from "effect";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export const FieldTypeId = Symbol.for("@typed/template/FormData/Field");
export type FieldTypeId = typeof FieldTypeId;

export type Source = globalThis.FormData | HTMLFormElement;

export interface Field<A, E = never, R = never> {
  readonly [FieldTypeId]: FieldTypeId;
  readonly read: (formData: globalThis.FormData) => Effect.Effect<A, E, R>;
}

export namespace Field {
  export type Any = Field<any, any, any>;
}

export type Type<T> = T extends Field<infer A, any, any> ? A : never;
export type Error<T> = T extends Field<any, infer E, any> ? E : never;
export type Services<T> = T extends Field<any, any, infer R> ? R : never;

export class FormDataError extends Data.TaggedError("FormDataError")<{
  readonly field: string;
  readonly reason: string;
}> {}

export const make = <A, E = never, R = never>(
  read: (formData: globalThis.FormData) => Effect.Effect<A, E, R>,
): Field<A, E, R> => ({ [FieldTypeId]: FieldTypeId, read });

export const decode = <F extends Field.Any>(
  field: F,
  source: Source,
): Effect.Effect<Type<F>, Error<F>, Services<F>> =>
  field.read(toNativeFormData(source)) as Effect.Effect<Type<F>, Error<F>, Services<F>>;

export const text = (name: string): Field<string, FormDataError> =>
  make((formData) => readText(formData, name));

export const nullableText = (name: string): Field<string | null, FormDataError> =>
  make((formData) =>
    readText(formData, name).pipe(Effect.map((value) => nonEmptyTrimmed(value) ?? null)),
  );

export const optionalText = (name: string): Field<string | undefined, FormDataError> =>
  make((formData) => readText(formData, name).pipe(Effect.map((value) => nonEmptyTrimmed(value))));

export const texts = (name: string): Field<readonly string[], FormDataError> =>
  make((formData) => Effect.forEach(formData.getAll(name), (value) => textEntry(name, value)));

export const split = (
  name: string,
  separator: RegExp | string = /\s*,\s*|\s+/,
): Field<readonly string[], FormDataError> =>
  make((formData) =>
    readText(formData, name).pipe(
      Effect.map((value) =>
        value
          .split(separator)
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    ),
  );

type FieldStruct = { readonly [key: string]: Field.Any };
type StructType<Fields extends FieldStruct> = {
  readonly [K in keyof Fields]: Type<Fields[K]>;
};

export const struct = <const Fields extends FieldStruct>(
  fields: Fields,
): Field<StructType<Fields>, Error<Fields[keyof Fields]>, Services<Fields[keyof Fields]>> =>
  make(
    (formData) =>
      Effect.all(readStructFields(fields, formData)) as Effect.Effect<
        StructType<Fields>,
        Error<Fields[keyof Fields]>,
        Services<Fields[keyof Fields]>
      >,
  );

export const schema = <S extends Schema.Top, F extends Field.Any>(
  schema: S,
  field: F,
): Field<S["Type"], Error<F> | Schema.SchemaError, Services<F> | S["DecodingServices"]> =>
  make((formData) =>
    field.read(formData).pipe(Effect.flatMap((value) => Schema.decodeUnknownEffect(schema)(value))),
  );

const toNativeFormData = (source: Source): globalThis.FormData =>
  source instanceof globalThis.FormData ? source : new globalThis.FormData(source);

const readText = (
  formData: globalThis.FormData,
  name: string,
): Effect.Effect<string, FormDataError> => textEntry(name, formData.get(name) ?? "");

const textEntry = (name: string, value: FormDataEntryValue): Effect.Effect<string, FormDataError> =>
  typeof value === "string"
    ? Effect.succeed(value)
    : Effect.fail(new FormDataError({ field: name, reason: "expected a text field" }));

const nonEmptyTrimmed = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readStructFields = <Fields extends FieldStruct>(
  fields: Fields,
  formData: globalThis.FormData,
): {
  readonly [K in keyof Fields]: Effect.Effect<
    Type<Fields[K]>,
    Error<Fields[K]>,
    Services<Fields[K]>
  >;
} =>
  Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.read(formData)])) as {
    readonly [K in keyof Fields]: Effect.Effect<
      Type<Fields[K]>,
      Error<Fields[K]>,
      Services<Fields[K]>
    >;
  };
