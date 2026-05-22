/* eslint-disable no-restricted-syntax */
import * as Effect from "effect/Effect";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import { singleton } from "effect/Record";
import * as Schema from "effect/Schema";
import * as Parser from "effect/SchemaParser";
import * as Transformation from "effect/SchemaTransformation";
import type { Simplify } from "effect/Types";
import * as AST from "./AST.js";
import * as Path from "./Path.js";

export interface Route<
  P extends string,
  S extends Schema.Codec<any, any, any, any> = Schema.Codec<Path.Params<P>>,
  PathS extends Schema.Codec<any, any, any, any> = Schema.Codec<Path.PathParams<P>>,
  QueryS extends Schema.Codec<any, any, any, any> = Schema.Codec<Path.QueryParams<P>>,
> extends Pipeable {
  readonly ast: AST.RouteAst;
  readonly path: P;

  readonly paramsSchema: S;
  readonly pathSchema: PathS;
  readonly querySchema: QueryS;

  optional(): Optional<this>;
}

export declare namespace Route {
  export type Any = Route<any, any, any, any>;

  export type Path<T> = T extends Route<infer P, any, any, any> ? P : never;
  export type Schema<T> = T extends Route<any, infer S, any, any> ? S : never;
  export type Type<T> = T extends Route<any, infer S, any, any> ? S["Type"] : never;
  export type Params<T> = T extends Route<infer P, infer _S, any, any> ? Path.Params<P> : never;
  export type DecodingServices<T> = T extends Route<any, infer S, any, any>
    ? S["DecodingServices"]
    : never;
  export type EncodingServices<T> = T extends Route<any, infer S, any, any>
    ? S["EncodingServices"]
    : never;

  export type PathType<T extends Any> = T["pathSchema"]["Type"];
  export type QueryType<T extends Any> = T["querySchema"]["Type"];
}

export type Any = Route.Any;
export type Params<T> = Route.Params<T>;
export type Type<T> = Route.Type<T>;
export type PathType<T extends Any> = Route.PathType<T>;
export type QueryType<T extends Any> = Route.QueryType<T>;
type OptionalParamRecord<P extends string, A> = { readonly [K in P]?: A };
type Optionalize<A> = Simplify<{ readonly [K in keyof A]?: A[K] }>;
type OptionalSchema<S extends Schema.Codec<any, any, any, any>> = S extends Schema.Codec<
  infer A,
  infer I,
  infer R,
  infer R2
>
  ? Schema.Codec<Optionalize<A>, Optionalize<I>, R, R2>
  : never;
export type Optional<R extends Route<any, any, any, any>> = R extends Route<
  `/:${infer P}`,
  infer S,
  infer PathS,
  infer QueryS
>
  ? Route<`/:${P}?`, OptionalSchema<S>, OptionalSchema<PathS>, QueryS>
  : never;

export function make<
  const P extends string,
  S extends Schema.Codec<any, any, any, any> = Schema.Codec<Path.Params<P>>,
  PathS extends Schema.Codec<any, any, any, any> = Schema.Codec<Path.PathParams<P>>,
  QueryS extends Schema.Codec<any, any, any, any> = Schema.Codec<Path.QueryParams<P>>,
>(ast: AST.RouteAst): Route<P, S, PathS, QueryS> {
  const getParts = once(() => getPathAst(ast));
  const path = once(() => Path.join(getParts()) as P);
  const paramsSchema = once(() => getParamsSchema(ast) as S);
  const pathSchema = once(() => getPathSchema(ast) as PathS);
  const querySchema = once(() => getQuerySchema(ast) as QueryS);

  return {
    ast,
    get path() {
      return path();
    },
    get paramsSchema() {
      return paramsSchema();
    },
    get pathSchema() {
      return pathSchema();
    },
    get querySchema() {
      return querySchema();
    },
    optional() {
      return Optional(this as Route.Any) as Optional<Route<P, S, PathS, QueryS>>;
    },
    pipe() {
      return pipeArguments(this, arguments);
    },
  };
}

function once<T>(fn: () => T): () => T {
  let memoized: [T] | [] = [];
  return (): T => {
    if (memoized.length === 1) {
      return memoized[0];
    }
    const result = fn();
    memoized = [result];
    return result;
  };
}

function getPathAst(ast: AST.RouteAst): ReadonlyArray<AST.PathAst> {
  return getAllPathAst(ast).filter((part) => part.type !== "query-params");
}

function getAllPathAst(ast: AST.RouteAst): ReadonlyArray<AST.PathAst> {
  switch (ast.type) {
    case "path":
      return [ast.path];
    case "transform":
      return getAllPathAst(ast.from);
    case "query":
      return [];
    case "join": {
      const result: Array<AST.PathAst> = [];
      let hasPath = false;
      for (let i = 0; i < ast.parts.length; i++) {
        const parts = getAllPathAst(ast.parts[i]);
        const pathParts = parts.filter((part) => part.type !== "query-params");
        if (hasPath && pathParts.length > 0) {
          result.push(AST.slash());
        }
        result.push(...parts);
        hasPath = hasPath || pathParts.length > 0;
      }
      return result;
    }
  }
}

function getParamsSchema(ast: AST.RouteAst): Schema.Top {
  switch (ast.type) {
    case "path": {
      const { paramsSchema } = Path.getSchemas(getAllPathAst(ast));
      return paramsSchema;
    }
    case "transform": {
      const { paramsSchema } = Path.getSchemas(getAllPathAst(ast.from));
      return paramsSchema.pipe(Schema.decodeTo(ast.to, ast.transformation));
    }
    case "query":
      return getParamsSchema(ast.route);
    case "join":
      return mergeDecodedParts(ast.parts, getParamsSchema);
  }
}

function getPathSchema(ast: AST.RouteAst): Schema.Top {
  switch (ast.type) {
    case "path":
      return Path.getSchemas(getAllPathAst(ast)).pathSchema;
    case "transform": {
      const base = Path.getSchemas(getAllPathAst(ast.from)).pathSchema;
      return hasPathFields(ast.from) ? base.pipe(Schema.decodeTo(ast.to, ast.transformation)) : base;
    }
    case "query":
      return emptySchema;
    case "join":
      return mergeDecodedParts(ast.parts, getPathSchema);
  }
}

function getQuerySchema(ast: AST.RouteAst): Schema.Top {
  switch (ast.type) {
    case "path":
      return Path.getSchemas(getAllPathAst(ast)).querySchema;
    case "transform": {
      const base = Path.getSchemas(getAllPathAst(ast.from)).querySchema;
      return hasQueryFields(ast.from) ? base.pipe(Schema.decodeTo(ast.to, ast.transformation)) : base;
    }
    case "query":
      return getParamsSchema(ast.route);
    case "join":
      return mergeDecodedParts(ast.parts, getQuerySchema);
  }
}

const emptySchema = Schema.Struct({});
const anyRecordSchema = Schema.StructWithRest(
  Schema.Struct({}),
  [Schema.Record(Schema.String, Schema.Unknown)],
);

function hasPathFields(ast: AST.RouteAst): boolean {
  const fields = Path.getSchemaFields(getAllPathAst(ast));
  return fields.requiredFields.length > 0 || fields.optionalFields.length > 0;
}

function hasQueryFields(ast: AST.RouteAst): boolean {
  return Path.getSchemaFields(getAllPathAst(ast)).queryParams.length > 0;
}

function mergeDecodedParts(
  parts: ReadonlyArray<AST.RouteAst>,
  schemaForPart: (ast: AST.RouteAst) => Schema.Top,
): Schema.Top {
  const schemas = parts.map(schemaForPart);
  const decoders = schemas.map(Parser.decodeEffect);
  const encoders = schemas.map(Parser.encodeEffect);
  return anyRecordSchema.pipe(
    Schema.decodeTo(
      anyRecordSchema,
      Transformation.transformOrFail({
        decode: (input) =>
          Effect.map(Effect.all(decoders.map((decode) => decode(input))), mergeRecords),
        encode: (output) =>
          Effect.map(Effect.all(encoders.map((encode) => encode(output))), mergeRecords),
      }),
    ),
  );
}

function mergeRecords(records: ReadonlyArray<unknown>): Record<string, unknown> {
  return Object.assign({}, ...records);
}

export const Parse = <const P extends string>(path: P): Route<Path.Join<Path.ParseAsts<P>>> => {
  const asts = Path.parse(path) as ReadonlyArray<AST.PathAst>;
  if (asts.length === 0) return Slash as unknown as Route<Path.Join<Path.ParseAsts<P>>>;
  if (asts.length === 1) return make(AST.path(asts[0]));
  return Join<Array<any>>(...asts.map((ast) => make(AST.path(ast)))) as unknown as Route<
    Path.Join<Path.ParseAsts<P>>
  >;
};

export const Slash = make<"/">(AST.path(AST.literal("")));

export const Wildcard = make<"*">(AST.path(AST.wildcard()));

export const Param = <const P extends string>(paramName: P): Route<`/:${P}`> =>
  make<`/:${P}`>(AST.path(AST.parameter(paramName)));

export const ParamWithSchema = <
  const P extends string,
  S extends Schema.Codec<any, string, any, any> = Schema.Codec<string>,
>(
  paramName: P,
  schema: S,
): Route<
  `/:${P}`,
  Schema.Codec<
    { readonly [K in P]: S["Type"] },
    Path.Params<`/:${P}`>,
    S["DecodingServices"],
    S["EncodingServices"]
  >,
  Schema.Codec<
    { readonly [K in P]: S["Type"] },
    Path.Params<`/:${P}`>,
    S["DecodingServices"],
    S["EncodingServices"]
  >
> => {
  const decode = Parser.decodeEffect(schema);
  const encode = Parser.encodeEffect(schema);

  return make(
    AST.transform(
      AST.path(AST.parameter(paramName)),
      Schema.Struct(singleton(paramName, decodedSchema(schema))),
      Transformation.transformOrFail({
        decode: (input: Record<P, S["Encoded"]>) =>
          Effect.map(decode(input[paramName]), (decoded) => singleton(paramName, decoded)),
        encode: (output: Record<P, S["Type"]>) =>
          Effect.map(encode(output[paramName]), (encoded) => singleton(paramName, encoded)),
      }),
    ),
  );
};

export const OptionalParamWithSchema = <
  const P extends string,
  S extends Schema.Codec<any, string, any, any> = Schema.Codec<string>,
>(
  paramName: P,
  schema: S,
): Optional<ReturnType<typeof ParamWithSchema<P, S>>> => {
  const decode = Parser.decodeEffect(schema);
  const encode = Parser.encodeEffect(schema);
  const emptyDecoded: OptionalParamRecord<P, S["Type"]> = {};
  const emptyEncoded: OptionalParamRecord<P, S["Encoded"]> = {};
  const to = Schema.StructWithRest(
    Schema.Struct({}),
    [
      Schema.Record(
        Schema.optionalKey(Schema.Literal(paramName)),
        Schema.optional(decodedSchema(schema)),
      ),
    ],
  );

  return make(
    AST.transform(
      AST.path(AST.parameter(paramName, true)),
      to,
      Transformation.transformOrFail({
        decode: (input: OptionalParamRecord<P, S["Encoded"]>) =>
          input[paramName] === undefined
            ? Effect.succeed(emptyDecoded)
            : Effect.map(decode(input[paramName]), (decoded) => singleton(paramName, decoded)),
        encode: (output: OptionalParamRecord<P, S["Type"]>) =>
          output[paramName] === undefined
            ? Effect.succeed(emptyEncoded)
            : Effect.map(encode(output[paramName]), (encoded) => singleton(paramName, encoded)),
      }),
    ),
  ) as Optional<ReturnType<typeof ParamWithSchema<P, S>>>;
};

export const Optional = <R extends Route<any, any, any, any>>(route: R): Optional<R> => {
  const paramName = getSingleParameterName(route.ast);
  const decode = Parser.decodeEffect(route.paramsSchema);
  const encode = Parser.encodeEffect(route.paramsSchema);

  return make(
    AST.transform(
      markParametersOptional(route.ast),
      anyRecordSchema,
      Transformation.transformOrFail({
        decode: (input: Record<string, unknown>) =>
          input[paramName] === undefined ? Effect.succeed({}) : decode(input),
        encode: (output: Record<string, unknown>) =>
          output[paramName] === undefined ? Effect.succeed({}) : encode(output),
      }),
    ),
  ) as Optional<R>;
};

function getSingleParameterName(ast: AST.RouteAst): string {
  const params = getAllPathAst(ast).filter((part): part is AST.PathAst.Parameter =>
    part.type === "parameter",
  );
  if (params.length !== 1) {
    throw new Error("Route.optional() requires a single parameter route");
  }
  return params[0].name;
}

function markParametersOptional(ast: AST.RouteAst): AST.RouteAst {
  switch (ast.type) {
    case "path":
      return AST.path(markPathParameterOptional(ast.path));
    case "transform":
      return markParametersOptional(ast.from);
    case "query":
      return AST.query(markParametersOptional(ast.route));
    case "join":
      return AST.join(ast.parts.map(markParametersOptional));
  }
}

function markPathParameterOptional(path: AST.PathAst): AST.PathAst {
  if (path.type !== "parameter") return path;
  return AST.parameter(path.name, true, path.regex);
}

function decodedSchema<S extends Schema.Top>(schema: S): Schema.Top {
  return "to" in schema && Schema.isSchema(schema.to) ? schema.to : schema;
}

export const Number = <const P extends string>(
  paramName: P,
): Route<
  `/:${P}`,
  Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>,
  Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>
> =>
  ParamWithSchema(paramName, Schema.NumberFromString);

export const OptionalParam = <const P extends string>(paramName: P) =>
  OptionalParamWithSchema(paramName, Schema.String);

export const OptionalNumber = <const P extends string>(
  paramName: P,
): Route<
  `/:${P}?`,
  Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>,
  Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>
> =>
  Number(paramName).optional() as Route<
    `/:${P}?`,
    Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>,
    Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>
  >;

export const Int = <const P extends string>(
  paramName: P,
): Route<
  `/:${P}`,
  Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>,
  Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>
> =>
  ParamWithSchema(paramName, Schema.NumberFromString.pipe(Schema.decodeTo(Schema.Int)));

export const OptionalInt = <const P extends string>(
  paramName: P,
): Route<
  `/:${P}?`,
  Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>,
  Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>
> =>
  Int(paramName).optional() as Route<
    `/:${P}?`,
    Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>,
    Schema.Codec<{ readonly [K in P]?: number }, { readonly [K in P]?: string }>
  >;

type QueryParamRoute = Route<`/:${string}`, Schema.Codec<any, any, any, any>, any, any>;

export type QueryParams<Routes extends ReadonlyArray<QueryParamRoute>> = [
  Route<
    "",
    Schema.Codec<
      Simplify<UnionToIntersection<Routes[number]["paramsSchema"]["Type"]>>,
      Simplify<UnionToIntersection<Routes[number]["paramsSchema"]["Encoded"]>>,
      Routes[number]["paramsSchema"]["DecodingServices"],
      Routes[number]["paramsSchema"]["EncodingServices"]
    >,
    Schema.Codec<{}>,
    Schema.Codec<
      Simplify<UnionToIntersection<Routes[number]["paramsSchema"]["Type"]>>,
      Simplify<UnionToIntersection<Routes[number]["paramsSchema"]["Encoded"]>>,
      Routes[number]["paramsSchema"]["DecodingServices"],
      Routes[number]["paramsSchema"]["EncodingServices"]
    >
  >,
] extends [infer R extends Route<any, any, any, any>] ? R : never;

export const QueryParams = <const Routes extends ReadonlyArray<QueryParamRoute>>(
  ...routes: Routes
): QueryParams<Routes> =>
  Join(...routes.map((route) => make(AST.query(route.ast)))) as unknown as QueryParams<Routes>;

export type Join<Routes extends ReadonlyArray<Route<any, any, any, any>>> = [
  Route<
    RouteJoinPath<Routes>,
    Schema.Codec<
      Simplify<UnionToIntersection<Routes[number]["paramsSchema"]["Type"]>>,
      Path.Params<RouteJoinPath<Routes>>,
      Routes[number]["paramsSchema"]["DecodingServices"],
      Routes[number]["paramsSchema"]["EncodingServices"]
    >,
    Schema.Codec<Simplify<UnionToIntersection<Routes[number]["pathSchema"]["Type"]>>>,
    Schema.Codec<Simplify<UnionToIntersection<Routes[number]["querySchema"]["Type"]>>>
  >,
] extends [Route<infer Path, infer Schema, infer PathSchema, infer QuerySchema>]
  ? Route<Path, Schema, PathSchema, QuerySchema>
  : never;

type AnyRoutes = ReadonlyArray<Route<any, any, any, any> | ReadonlyArray<Route<any, any, any, any>>>;
type FlattenRoutes<T extends AnyRoutes> = T extends readonly [
  infer Head extends Route<any, any, any, any> | ReadonlyArray<Route<any, any, any, any>>,
  ...infer Tail extends AnyRoutes,
]
  ? readonly [
      ...(Head extends ReadonlyArray<Route<any, any, any, any>> ? FlattenRoutes<Head> : [Head]),
      ...FlattenRoutes<Tail>,
    ]
  : [];

const removeSlash = (ast: AST.RouteAst): ReadonlyArray<AST.RouteAst> => {
  if (ast.type === "path" && ast.path.type === "slash") return [];
  return [ast];
};

export const Join = <const Routes extends AnyRoutes>(
  ...routes: Routes
): Join<FlattenRoutes<Routes>> =>
  make(
    AST.join(
      routes.flatMap((route) => {
        if (Array.isArray(route)) return route.flatMap(removeSlash);
        return removeSlash((route as Route<any, any>).ast);
      }),
    ),
  );

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any
  ? R
  : never;
type RouteJoinPath<
  Routes extends ReadonlyArray<Route<any, any, any, any>>,
  R extends string = "",
> = Routes extends readonly [
  infer First extends Route<any, any, any, any>,
  ...infer Rest extends ReadonlyArray<Route<any, any, any, any>>,
]
  ? RouteJoinPath<Rest, AppendRoutePath<R, First["path"]>>
  : R;
type AppendRoutePath<R extends string, P extends string> =
  StripSlashes<P> extends "" ? R : `${R}/${StripSlashes<P>}`;
type StripSlashes<T extends string> = StripTrailingSlash<StripLeadingSlash<T>>;
type StripLeadingSlash<T extends string> = T extends `/${infer Rest}` ? StripLeadingSlash<Rest> : T;
type StripTrailingSlash<T extends string> = T extends `/${infer Rest}`
  ? StripTrailingSlash<Rest>
  : T;
