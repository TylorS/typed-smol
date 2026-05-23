import type * as Schema from "effect/Schema";

export namespace Serializable {
  export type AnySchema = Schema.Top;

  export type Descriptor<S extends AnySchema = AnySchema> =
    | SchemaDescriptor<S>
    | GeneratedDescriptor<Schema.Schema.Type<S>, S["Encoded"]>;

  export type SchemaDescriptor<S extends AnySchema = AnySchema> = {
    readonly _tag: "Schema";
    readonly id?: string;
    readonly schema: S;
  };

  export type GeneratedDescriptor<A = unknown, I = unknown> = {
    readonly _tag: "Generated";
    readonly id: string;
    readonly plan: GeneratedSchemaPlan;
    readonly Type?: A;
    readonly Encoded?: I;
  };

  export type GeneratedSchemaPlan = {
    readonly version: 1;
    readonly typeId: string;
    readonly root?: unknown;
    readonly source?: GeneratedSchemaSource;
    readonly fingerprint?: string;
  };

  export type GeneratedSchemaSource = {
    readonly fileName: string;
    readonly exportName?: string;
  };

  export type SchemaDescriptorOptions = {
    readonly id?: string;
  };

  export const schema = <S extends AnySchema>(
    schema: S,
    options: SchemaDescriptorOptions = {},
  ): SchemaDescriptor<S> =>
    options.id === undefined
      ? { _tag: "Schema", schema }
      : { _tag: "Schema", id: options.id, schema };

  export const generated = <A = unknown, I = unknown>(
    id: string,
    plan: GeneratedSchemaPlan,
  ): GeneratedDescriptor<A, I> => ({ _tag: "Generated", id, plan });

  export function fromSchemaOrGenerated<S extends AnySchema>(
    schema: S,
    id: string,
    plan: GeneratedSchemaPlan,
  ): SchemaDescriptor<S>;
  export function fromSchemaOrGenerated<A = unknown, I = unknown>(
    schema: undefined,
    id: string,
    plan: GeneratedSchemaPlan,
  ): GeneratedDescriptor<A, I>;
  export function fromSchemaOrGenerated<S extends AnySchema>(
    schema: S | undefined,
    id: string,
    plan: GeneratedSchemaPlan,
  ): SchemaDescriptor<S> | GeneratedDescriptor {
    return schema === undefined ? generated(id, plan) : Serializable.schema(schema, { id });
  }
}
