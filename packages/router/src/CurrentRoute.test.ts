import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { CurrentRoute } from "./CurrentRoute.js";
import { ServerRouter } from "./Router.js";

describe("typed/router/CurrentRoute", () => {
  it("is provided by ServerRouter.Default", () =>
    Effect.gen(function* () {
      const current = yield* CurrentRoute;
      expect(current.route.path).toEqual("/");
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/tasks" })),
      Effect.scoped,
      Effect.runPromise,
    ));
});
