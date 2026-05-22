import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as Route from "@typed/router";
import * as App from "./index.js";
import { ApiHandler, ApiHandlerRaw } from "./index.js";

describe("ApiHandler canonical public API", () => {
  it("uses the route/method/schemas helper shape from the package root", () => {
    const route = Route.Join(Route.Parse("articles"), Route.Param("slug"));
    const success = Schema.Struct({ slug: Schema.String });

    const handler = ApiHandler(route, "GET", { success })(({ path }) =>
      Effect.succeed({ slug: path.slug }),
    );

    expectTypeOf(handler).parameter(0).toExtend<{
      path: { slug: string };
    }>();
    expectTypeOf(handler).returns.toExtend<Effect.Effect<{ slug: string }, never, never>>();

    return Effect.runPromise(
      handler({
        path: { slug: "hello-world" },
        query: {},
        headers: {},
        body: undefined,
      }),
    ).then((result) => expect(result).toEqual({ slug: "hello-world" }));
  });

  it("exposes decoded route path and query values to handlers", () => {
    const route = Route.Join(
      Route.Parse("articles"),
      Route.Int("id"),
      Route.QueryParams(Route.Int("page")),
    );
    const success = Schema.Struct({ id: Schema.Number, page: Schema.Number });

    const handler = ApiHandler(route, "GET", { success })(({ path, query }) =>
      Effect.succeed({ id: path.id, page: query.page }),
    );

    expectTypeOf(handler).parameter(0).toExtend<{
      path: { id: number };
      query: { page: number };
    }>();

    return Effect.runPromise(
      handler({
        path: { id: 1 },
        query: { page: 2 },
        headers: {},
        body: undefined,
      }),
    ).then((result) => expect(result).toEqual({ id: 1, page: 2 }));
  });

  it("exposes decoded query values to raw handlers", () => {
    const route = Route.Join(
      Route.Parse("articles"),
      Route.QueryParams(Route.Int("limit").optional()),
    );

    const handler = ApiHandlerRaw({ route, method: "GET" })(({ query }) =>
      Effect.succeed(HttpServerResponse.text(String(query.limit ?? 0))),
    );

    expectTypeOf(handler).parameter(0).toExtend<{
      query: { limit?: number };
    }>();

    return Effect.runPromise(
      handler({
        path: {},
        query: { limit: 10 },
        headers: {},
        body: undefined,
      }),
    ).then((result) => expect(result).toBeDefined());
  });

  it("does not expose the historical alias", () => {
    const historicalAlias = ["define", "ApiHandler"].join("");
    expect(historicalAlias in App).toBe(false);
  });
});
