/**
 * Tests for ApiHandler (defineApiHandler): runtime behavior and compile-time positive/negative typing.
 * Handler receives { path, query, headers, body }; schemas optional (headers, body, success, error).
 * API: ApiHandler(route, schemas?)(handler)
 * @see .docs/specs/httpapi-virtual-module-plugin/testing-strategy.md (TS-15)
 */

import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Route from "@typed/router/Route";
import { ApiHandler } from "./index.js";

describe("defineApiHandler", () => {
  const route = Route.Join(Route.Parse("users"), Route.Param("id"));
  const schemas = {
    headers: Schema.Struct({ requestId: Schema.String }),
    body: Schema.Struct({ name: Schema.String }),
    success: Schema.Struct({ ok: Schema.Boolean, id: Schema.String }),
    error: Schema.Struct({ code: Schema.String, message: Schema.String }),
  };

  it("returns handler in curried form and preserves identity", () => {
    const handler = ApiHandler(route, schemas)((ctx) =>
      Effect.succeed({ ok: true, id: ctx.path.id }),
    );
    expect(typeof handler).toBe("function");
  });

  it("handler context has typed path, query, headers, body", () => {
    const handler = ApiHandler(route, schemas)((ctx) => {
      const _path = ctx.path;
      const _query: Record<string, string | string[] | undefined> = ctx.query;
      const _body: { name: string } = ctx.body;
      const _headers: { requestId: string } = ctx.headers;
      return Effect.succeed({
        ok: true,
        id: _path.id,
      });
    });
    expect(handler).toBeDefined();
  });

  it("handler return type is Effect<Success, Error>", () => {
    const handler = ApiHandler(route, schemas)((ctx) =>
      Effect.succeed({ ok: true, id: ctx.path.id }),
    );
    const run = Effect.runPromise(
      handler({
        path: { id: "1" },
        query: {},
        body: { name: "x" },
        headers: { requestId: "r-1" },
      }),
    );
    return run.then((v) => {
      expect(v).toEqual({ ok: true, id: "1" });
    });
  });

  it("accepts Router.Route from Parse for simple path", () => {
    const statusRoute = Route.Parse("status");
    const handler = ApiHandler(statusRoute, {
      success: Schema.Struct({ status: Schema.String }),
    })(() => Effect.succeed({ status: "ok" }));
    const run = Effect.runPromise(
      handler({ path: {}, query: {}, headers: {}, body: undefined }),
    );
    return run.then((v) => expect(v).toEqual({ status: "ok" }));
  });
});

describe("defineApiHandler compile-time negative tests", () => {
  const route = Route.Join(Route.Parse("users"), Route.Param("id"));
  const schemas = {
    headers: Schema.Struct({ requestId: Schema.String }),
    body: Schema.Struct({ name: Schema.String }),
    success: Schema.Struct({ ok: Schema.Boolean }),
    error: Schema.Struct({ code: Schema.String }),
  };

  it("rejects handler returning wrong success shape (ts-expect-error)", () => {
    ApiHandler(route, schemas)(
      // @ts-expect-error invalid return type
      () => Effect.succeed(42),
    );
  });

  it("rejects handler using wrong path shape (ts-expect-error)", () => {
    ApiHandler(route, schemas)((ctx) => {
      // @ts-expect-error - ctx.path is { id: string }; number is not assignable to string
      const _wrong: { id: number } = ctx.path;
      return Effect.succeed({ ok: true });
    });
  });
});
