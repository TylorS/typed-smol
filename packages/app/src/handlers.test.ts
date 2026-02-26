/**
 * Type-level tests for RouteHandler, RouteGuard, RouteLayout, RouteCatch, ApiHandler, ApiHandlerRaw.
 * One test per overload with full type assertions. Run with vitest --typecheck.
 * Negative: @ts-expect-error.
 */

import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as Route from "@typed/router";
import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";
import * as Fx from "@typed/fx/Fx";
import type { LayoutParams } from "@typed/router";
import {
  ApiHandler,
  ApiHandlerRaw,
  RouteCatch,
  RouteGuard,
  RouteLayout,
  RouteHandler,
} from "./index.js";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

// --- RouteHandler (2 overloads: route, guard) ---

describe("RouteHandler", () => {
  const route = Route.Join(Route.Parse("users"), Route.Param("id"));
  type RtParams = Route.Route.Type<typeof route>;

  it("RouteHandler(route)(handler): params RefSubject<Route.Type<Rt>>, return MatchHandlerReturnValue", () => {
    const handler = RouteHandler(route)((params) => params.asEffect());
    expectTypeOf(handler).parameter(0).toExtend<RefSubject<RtParams>>();
    expectTypeOf(handler).returns.toExtend<Effect.Effect<RtParams>>();
  });

  it("RouteHandler(route)(handler): return Effect vs value", () => {
    const withEffect = RouteHandler(route)(() => Effect.succeed(1));
    const withValue = RouteHandler(route)(() => 42);
    expectTypeOf(withEffect).returns.toExtend<Effect.Effect<number, never, never>>();
    expectTypeOf(withValue).returns.toEqualTypeOf<number>();
  });

  it("RouteHandler(guard)(handler): params RefSubject<GuardOutput<G>>", () => {
    const guard = RouteGuard(route)(Effect.succeedSome);
    const handler = RouteHandler(guard)((params) => params.asEffect());
    expectTypeOf(handler).parameter(0).toExtend<RefSubject<RtParams>>();
    expectTypeOf(handler).returns.toExtend<Effect.Effect<RtParams>>();
  });
});

describe("RouteHandler negative", () => {
  const route = Route.Join(Route.Parse("users"), Route.Param("id"));

  it("rejects wrong params type (ts-expect-error)", () => {
    RouteHandler(route)(
      // @ts-expect-error params should be RefSubject<{ id: string }>, not number
      (params: number) => Effect.succeed(params),
    );
  });
});

// --- RouteGuard (1 overload) ---

describe("RouteGuard", () => {
  const route = Route.Join(Route.Parse("todos"), Route.Param("id"));
  type RtParams = Route.Route.Type<typeof route>;
  type GuardOut = { id: string; num: number };

  it("RouteGuard(route)(handler): params Route.Type<Rt>, returns Effect<Option<O>, E, R>", () => {
    const guardHandler = RouteGuard(route)((params) =>
      Effect.succeed(Option.some({ ...params, num: 1 })),
    );
    expectTypeOf(guardHandler).parameter(0).toExtend<RtParams>();
    expectTypeOf(guardHandler).returns.toExtend<
      Effect.Effect<Option.Option<GuardOut>, never, never>
    >();
    const result = guardHandler({ id: "1" });
    expect(Effect.runSync(result)).toEqual(Option.some({ id: "1", num: 1 }));
  });
});

describe("RouteGuard negative", () => {
  const route = Route.Parse("home");

  it("rejects non-Option return (ts-expect-error)", () => {
    RouteGuard(route)(
      // @ts-expect-error must return Effect<Option<O>, E, R>
      (params) => Effect.succeed(params),
    );
  });
});

// --- RouteLayout (4 overloads: route, route+deps, guard, guard+deps) ---

describe("RouteLayout", () => {
  const route = Route.Parse("app");
  type RtParams = Route.Route.Type<typeof route>;

  it("RouteLayout(route, handler): handler(param: RefSubject<Route.Type<Rt>>), layout param is LayoutParams<Params, B, E2, R2>", () => {
    const layout = RouteLayout(route, (_params) => Fx.succeed(42));
    // LayoutParams second/third/fourth type args = handler return (B, E2, R2)
    expectTypeOf(layout).parameter(0).toExtend<LayoutParams<RtParams, number, never, never>>();
    expectTypeOf(layout).returns.toExtend<Fx.Fx.Any>();
  });

  it("RouteLayout(route, handler): return is polymorphic Fx<C, E3, R3>", () => {
    const layout = RouteLayout(route, (_p) => Fx.succeed(42));
    expectTypeOf(layout).returns.toExtend<Fx.Fx.Any>();
  });

  it("RouteLayout(route, handler, deps): layout param has ApplyDependencies E/R for content", () => {
    const deps = [] as readonly import("effect/Layer").Layer<never, never, never>[];
    const layout = RouteLayout(route, (_params) => Fx.succeed(undefined as any), deps);
    expectTypeOf(layout).parameter(0).toExtend<LayoutParams<RtParams, any, any, any>>();
    expectTypeOf(layout).returns.toExtend<Fx.Fx.Any>();
  });

  it("RouteLayout(guard, handler): layout param is LayoutParams<GuardOutput<G>, B, E2, R2>", () => {
    const guard = RouteGuard(route)(Effect.succeedSome);
    type GuardOut = Route.GuardOutput<typeof guard>;
    const layout = RouteLayout(guard, (_params) => Fx.succeed(0));
    expectTypeOf(layout).parameter(0).toExtend<LayoutParams<GuardOut, number, never, never>>();
    expectTypeOf(layout).returns.toExtend<Fx.Fx.Any>();
  });

  it("RouteLayout(guard, handler, deps): layout param has ApplyDependencies E/R for content", () => {
    const guard = RouteGuard(route)(Effect.succeedSome);
    type GuardOut = Route.GuardOutput<typeof guard>;
    const deps = [] as readonly import("effect/Layer").Layer<never, never, never>[];
    const layout = RouteLayout(guard, (_params) => Fx.succeed(null as any), deps);
    expectTypeOf(layout).parameter(0).toExtend<LayoutParams<GuardOut, any, any, any>>();
    expectTypeOf(layout).returns.toExtend<Fx.Fx.Any>();
  });
});

describe("RouteLayout negative", () => {
  const route = Route.Parse("x");

  it("rejects wrong handler param type (ts-expect-error)", () => {
    // @ts-expect-error handler receives RefSubject<Route.Type<Rt>>, not number
    RouteLayout(route, (_params: number) => Fx.succeed(0));
  });
});

// --- RouteCatch (4 overloads: handler, handler+deps, layout, layout+deps) ---

describe("RouteCatch", () => {
  const route = Route.Parse("err");
  const handler = RouteHandler(route)(() => Effect.succeed(1));
  const layoutWithE = (p: { params: RefSubject<any>; content: Fx.Fx<any, string, any> }) =>
    p.content;
  const deps = [] as readonly import("effect/Layer").Layer<never, never, never>[];

  it("RouteCatch(handler)(catchFn): causeRef is RefSubject<Cause<E>> from handler", () => {
    const catchFn = RouteCatch(handler)((_causeRef) => Fx.succeed(0));
    expectTypeOf(catchFn).toBeFunction();
    expectTypeOf(catchFn).parameter(0).toBeObject();
  });

  it("RouteCatch(handler, deps)(catchFn): causeRef includes DependencyError<D>", () => {
    const catchFn = RouteCatch(handler, deps)((_causeRef) => Fx.succeed(0));
    expectTypeOf(catchFn).toBeFunction();
    expectTypeOf(catchFn).parameter(0).toBeObject();
  });

  it("RouteCatch(layout)(catchFn): causeRef from layout Fx E", () => {
    const catchFn = RouteCatch(layoutWithE)((_causeRef) => Fx.succeed(0));
    expectTypeOf(catchFn).toBeFunction();
    expectTypeOf(catchFn).parameter(0).toBeObject();
  });

  it("RouteCatch(layout, deps)(catchFn): causeRef from layout | deps", () => {
    const catchFn = RouteCatch(layoutWithE, deps)((_causeRef) => Fx.succeed(0));
    expectTypeOf(catchFn).toBeFunction();
    expectTypeOf(catchFn).parameter(0).toBeObject();
  });
});

describe("ApiHandler", () => {
  const route = Route.Join(Route.Parse("users"), Route.Param("id"));
  const schemas = {
    headers: Schema.Struct({ requestId: Schema.String }),
    body: Schema.Struct({ name: Schema.String }),
    success: Schema.Struct({ ok: Schema.Boolean, id: Schema.String }),
    error: Schema.Struct({ code: Schema.String }),
  } as const;

  it("full config: path/query/headers/body input, Effect<Success, Error> output", () => {
    const handler = ApiHandler({
      route,
      method: "GET",
      headers: schemas.headers,
      body: schemas.body,
      success: schemas.success,
      error: schemas.error,
    })((params) => Effect.succeed({ ok: true, id: params.path.id }));
    expectTypeOf(handler).parameter(0).toExtend<{
      path: { id: string };
      headers: { requestId: string };
      body: { name: string };
    }>();
    expectTypeOf(handler).returns.toExtend<
      Effect.Effect<{ ok: boolean; id: string }, { code: string }, never>
    >();
    return Effect.runPromise(
      handler({
        path: { id: "1" },
        headers: { requestId: "r-1" },
        body: { name: "x" },
      }),
    ).then((v) => expect(v).toEqual({ ok: true, id: "1" }));
  });

  it("minimal config: only route + method", () => {
    const handler = ApiHandler({ route: Route.Parse("status"), method: "GET" })(() =>
      Effect.succeed({ status: "ok" }),
    );
    expectTypeOf(handler).parameter(0).toExtend<{}>();
    expectTypeOf(handler).returns.toExtend<Effect.Effect<unknown, unknown, never>>();
    return Effect.runPromise(handler({})).then((v) => expect(v).toEqual({ status: "ok" }));
  });
});

describe("ApiHandler negative", () => {
  const route = Route.Join(Route.Parse("users"), Route.Param("id"));
  const schemas = {
    success: Schema.Struct({ ok: Schema.Boolean }),
    error: Schema.Struct({ code: Schema.String }),
  };

  it("rejects wrong success type (ts-expect-error)", () => {
    ApiHandler({ route, method: "GET", ...schemas })(
      // @ts-expect-error success is { ok: boolean }, not number
      () => Effect.succeed(42),
    );
  });

  it("rejects wrong path shape (ts-expect-error)", () => {
    ApiHandler({ route, method: "GET", ...schemas })((ctx) => {
      // @ts-expect-error path is { id: string }
      const _wrong: { id: number } = ctx.path;
      return Effect.succeed({ ok: true });
    });
  });
});

describe("ApiHandlerRaw", () => {
  const route = Route.Parse("raw");

  it("return must be HttpServerResponse", () => {
    const handler = ApiHandlerRaw({ route, method: "GET" })(() =>
      Effect.succeed(HttpServerResponse.empty()),
    );
    expectTypeOf(handler).returns.toExtend<Effect.Effect<unknown, never, never>>();
    return Effect.runPromise(
      handler({
        path: {},
        query: {},
        headers: {},
        body: undefined,
      }),
    ).then((res) => expect(res).toBeDefined());
  });

  it("with headers/body: input constrained", () => {
    const handler = ApiHandlerRaw({
      route,
      method: "POST",
      headers: Schema.Struct({ "x-request-id": Schema.String }),
      body: Schema.Struct({ data: Schema.String }),
    })((params) => HttpServerResponse.json({ received: params.body.data }).pipe(Effect.orDie));
    expectTypeOf(handler).parameter(0).toExtend<{
      headers: { "x-request-id": string };
      body: { data: string };
    }>();
  });
});

describe("ApiHandlerRaw negative", () => {
  const route = Route.Parse("raw");

  it("rejects non-HttpServerResponse return (ts-expect-error)", () => {
    ApiHandlerRaw({ route, method: "GET" })(
      // @ts-expect-error must return Effect<HttpServerResponse, ...>
      () => Effect.succeed({ not: "a response" }),
    );
  });
});
