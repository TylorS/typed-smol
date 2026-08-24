/* eslint-disable no-restricted-syntax */
import * as Effect from "effect/Effect";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import * as Schema from "effect/Schema";
import * as SchemaIssue from "effect/SchemaIssue";
import * as SchemaParser from "effect/SchemaParser";
import * as Transformation from "effect/SchemaTransformation";
import type { Simplify } from "effect/Types";
import * as AST from "./AST.js";
import * as Path from "./Path.js";

export interface Route<
  P extends string,
  S extends Schema.Codec<any, Path.Params<P>, any, any> = Schema.Codec<Path.Params<P>>,
> extends Pipeable {
  readonly ast: AST.RouteAst;
  readonly path: P;

  readonly paramsSchema: S;
  readonly pathSchema: Schema.Codec<Path.PathParams<P>>;
  readonly querySchema: Schema.Codec<Path.QueryParams<P>>;
}

export declare namespace Route {
  export type Any = Route<any, any>;

  export type Path<T> = T extends Route<infer P, any> ? P : never;
  export type Schema<T> = T extends Route<any, infer S> ? S : never;
  export type Type<T> = T extends Route<any, infer S> ? S["Type"] : never;
  export type Params<T> = T extends Route<infer P, infer _S> ? Path.Params<P> : never;
  export type DecodingServices<T> = T extends Route<any, infer S> ? S["DecodingServices"] : never;
  export type EncodingServices<T> = T extends Route<any, infer S> ? S["EncodingServices"] : never;

  export type PathType<T extends Any> = T["pathSchema"]["Type"];
  export type QueryType<T extends Any> = T["querySchema"]["Type"];
}

export type Any = Route.Any;
export type Params<T> = Route.Params<T>;
export type Type<T> = Route.Type<T>;
export type PathType<T extends Any> = Route.PathType<T>;
export type QueryType<T extends Any> = Route.QueryType<T>;

export function make<
  const P extends string,
  S extends Schema.Codec<any, Path.Params<P>, any, any> = Schema.Codec<Path.Params<P>>,
>(ast: AST.RouteAst): Route<P, S> {
  Path.assertUniqueDecodedRouteParamNames(ast);
  const getParts = once(() => Path.flattenRouteAst(ast));
  const path = once(() => Path.join(getParts()) as P);
  const paramsSchema = once(() => getParamsSchema(ast) as S);
  const pathSchema = once(() => getPathSchema(ast) as Schema.Codec<Path.PathParams<P>>);
  const querySchema = once(() => getQuerySchema(ast) as Schema.Codec<Path.QueryParams<P>>);

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

function getParamsSchema(ast: AST.RouteAst): Schema.Top {
  const parts = Path.flattenRouteAst(ast);
  switch (ast.type) {
    case "path": {
      return makeFlatParamsSchema(parts, true, true);
    }
    case "transform": {
      return getParamsSchema(ast.from).pipe(Schema.decodeTo(ast.to, ast.transformation));
    }
    case "join": {
      const encoded = makeFlatParamsSchema(parts, true, true);
      const childParts = ast.parts.map((part) => ({
        names: new Set(Path.flattenRouteAst(part).flatMap(Path.getDecodedParamNames)),
        schema: getParamsSchema(part),
      }));
      return encoded.pipe(
        Schema.decodeTo(
          Schema.Unknown,
          Transformation.transformOrFail<unknown, unknown, unknown, unknown>({
            decode: (input, options) => {
              return Effect.forEach(childParts, ({ names, schema }) =>
                SchemaParser.decodeEffect(schema)(projectRecord(input, names), options),
              ).pipe(Effect.flatMap((values) => mergeRecords(values, options)));
            },
            encode: (input, options) => {
              const childOptions = { ...options, onExcessProperty: "ignore" as const };
              return Effect.forEach(childParts, ({ names, schema }) =>
                SchemaParser.encodeUnknownEffect(schema)(input, childOptions).pipe(
                  Effect.map((encoded) => projectRecord(encoded, names)),
                ),
              ).pipe(Effect.flatMap((values) => mergeRecords(values, options)));
            },
          }),
        ),
      );
    }
  }
}

function getPathSchema(ast: AST.RouteAst): Schema.Top {
  return makeFlatParamsSchema(Path.flattenRouteAst(ast), true, false);
}

function getQuerySchema(ast: AST.RouteAst): Schema.Top {
  return makeFlatParamsSchema(Path.flattenRouteAst(ast), false, true);
}

function makeFlatParamsSchema(
  parts: ReadonlyArray<AST.PathAst>,
  includePath: boolean,
  includeQuery: boolean,
): Schema.Top {
  const fields = Path.getSchemaFields(parts);
  const requiredFields: Array<[string, Schema.Top]> = includePath ? [...fields.requiredFields] : [];
  const optionalFields: Array<[Schema.Record.Key, Schema.Top]> = includePath
    ? [...fields.optionalFields]
    : [];

  if (includeQuery) {
    for (const [, query] of fields.queryParams) {
      requiredFields.push(...query.requiredFields);
      optionalFields.push(...query.optionalFields);
    }
  }

  return Path.schemaFromFields({ requiredFields, optionalFields });
}

function mergeRecords(
  values: ReadonlyArray<unknown>,
  options: Parameters<typeof SchemaParser.decodeUnknownEffect>[1],
): Effect.Effect<Record<PropertyKey, unknown>, SchemaIssue.Issue> {
  const output: Record<PropertyKey, unknown> = {};
  const keys = new Set<PropertyKey>();
  for (const value of values) {
    if (typeof value === "object" && value !== null) {
      for (const key of Reflect.ownKeys(value)) {
        if (!Object.prototype.propertyIsEnumerable.call(value, key)) continue;
        if (keys.has(key)) {
          return Effect.fail(
            new SchemaIssue.InvalidValue(
              { message: `Duplicate decoded route parameter: ${String(key)}` },
              values,
              options,
            ),
          );
        }
        keys.add(key);
        output[key] = (value as Record<PropertyKey, unknown>)[key];
      }
    }
  }
  return Effect.succeed(output);
}

function projectRecord(input: unknown, names: ReadonlySet<string>): Record<PropertyKey, unknown> {
  const output: Record<PropertyKey, unknown> = {};
  if (typeof input !== "object" || input === null) return output;
  for (const name of names) {
    if (Object.prototype.propertyIsEnumerable.call(input, name)) {
      output[name] = (input as Record<PropertyKey, unknown>)[name];
    }
  }
  return output;
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
  >
> => {
  const paramsSchema = Schema.Struct({ [paramName]: schema });
  return make(
    AST.transform(AST.path(AST.parameter(paramName)), paramsSchema, Transformation.passthrough()),
  );
};

export const Number = <const P extends string>(
  paramName: P,
): Route<`/:${P}`, Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>> =>
  ParamWithSchema(paramName, Schema.FiniteFromString);

export const Int = <const P extends string>(
  paramName: P,
): Route<`/:${P}`, Schema.Codec<{ readonly [K in P]: number }, Path.Params<`/:${P}`>>> =>
  ParamWithSchema(paramName, Schema.FiniteFromString.pipe(Schema.check(Schema.isInt())));

export type Join<Routes extends ReadonlyArray<Route<any, any>>> = [
  Route<
    RouteJoinPath<Routes>,
    Schema.Codec<
      Simplify<UnionToIntersection<Routes[number]["paramsSchema"]["Type"]>>,
      Path.Params<RouteJoinPath<Routes>>,
      Routes[number]["paramsSchema"]["DecodingServices"],
      Routes[number]["paramsSchema"]["EncodingServices"]
    >
  >,
] extends [Route<infer Path, infer Schema>]
  ? Route<Path, Schema>
  : never;

type AnyRoutes = ReadonlyArray<Route<any, any> | ReadonlyArray<Route<any, any>>>;
type FlattenRoutes<T extends AnyRoutes> = T extends readonly [
  infer Head extends Route<any, any> | ReadonlyArray<Route<any, any>>,
  ...infer Tail extends AnyRoutes,
]
  ? readonly [
      ...(Head extends ReadonlyArray<Route<any, any>> ? FlattenRoutes<Head> : [Head]),
      ...FlattenRoutes<Tail>,
    ]
  : [];

const removeSlash = (ast: AST.RouteAst): ReadonlyArray<AST.RouteAst> => {
  if (ast.type === "path" && ast.path.type === "slash") return [];
  return [ast];
};

export const Join = <const Routes extends AnyRoutes>(
  ...routes: Routes
): Join<FlattenRoutes<Routes>> => {
  const parts = routes.flatMap((route) => {
    if (Array.isArray(route)) return route.flatMap(removeSlash);
    return removeSlash((route as Route<any, any>).ast);
  });
  return make(AST.join(parts));
};

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any
  ? R
  : never;
type RouteJoinPath<
  Routes extends ReadonlyArray<Route<any, any>>,
  R extends string = "",
> = Routes extends readonly [
  infer First extends Route<any, any>,
  ...infer Rest extends ReadonlyArray<Route<any, any>>,
]
  ? RouteJoinPath<Rest, `${R}/${StripSlashes<First["path"]>}`>
  : R;
type StripSlashes<T extends string> = StripTrailingSlash<StripLeadingSlash<T>>;
type StripLeadingSlash<T extends string> = T extends `/${infer Rest}` ? StripLeadingSlash<Rest> : T;
type StripTrailingSlash<T extends string> = T extends `/${infer Rest}`
  ? StripTrailingSlash<Rest>
  : T;
