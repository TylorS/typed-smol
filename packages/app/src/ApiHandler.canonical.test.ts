import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as Route from "@typed/router";
import * as App from "./index.js";
import { ApiHandler } from "./index.js";

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
    expectTypeOf(handler).returns.toExtend<
      Effect.Effect<{ slug: string }, never, never>
    >();

    return Effect.runPromise(
      handler({
        path: { slug: "hello-world" },
        query: {},
        headers: {},
        body: undefined,
      }),
    ).then((result) => expect(result).toEqual({ slug: "hello-world" }));
  });

  it("does not expose the historical alias", () => {
    const historicalAlias = ["define", "ApiHandler"].join("");
    expect(historicalAlias in App).toBe(false);
  });
});
