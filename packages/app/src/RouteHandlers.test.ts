import { describe, expect, it } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Fx } from "@typed/fx";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import { TestRouter } from "@typed/router";
import { RouteHandlers } from "./RouteHandlers.js";

class Greeting extends Context.Service<Greeting, { readonly value: string }>()(
  "test/RouteHandlers/Greeting",
) {}

describe("RouteHandlers", () => {
  it("overlays server handlers onto an environment-agnostic router matcher", () =>
    Effect.gen(function* () {
      const route = Route.Parse("article/:slug");
      const router = Matcher.empty.match(route, "browser-template");
      const handlers = RouteHandlers.empty.match(route, () => "server-handler");
      const combined = RouteHandlers.apply(router, handlers);

      const values = yield* Fx.collectAll(Fx.take(combined, 1)).pipe(
        Effect.provide(TestRouter({ url: "http://localhost/article/hello-world" })),
        Effect.scoped,
      );

      expect(values).toEqual(["server-handler"]);
    }).pipe(Effect.runPromise));

  it("leaves unmatched routes on the original matcher", () =>
    Effect.gen(function* () {
      const article = Route.Parse("article/:slug");
      const profile = Route.Parse("profile/:username");
      const router = Matcher.empty.match(article, "article-template");
      const handlers = RouteHandlers.empty.match(profile, () => "profile-handler");
      const combined = RouteHandlers.apply(router, handlers);

      const values = yield* Fx.collectAll(Fx.take(combined, 1)).pipe(
        Effect.provide(TestRouter({ url: "http://localhost/article/hello-world" })),
        Effect.scoped,
      );

      expect(values).toEqual(["article-template"]);
    }).pipe(Effect.runPromise));

  it("applies handler dependency layers to the combined matcher", () =>
    Effect.gen(function* () {
      const route = Route.Parse("article/:slug");
      const router = Matcher.empty.match(route, "browser-template");
      const handlers = RouteHandlers.empty
        .match(route, () => Effect.map(Greeting, (service) => service.value))
        .provide(Layer.succeed(Greeting, { value: "server-handler" }));
      const combined = RouteHandlers.apply(router, handlers);

      const values = yield* Fx.collectAll(Fx.take(combined, 1)).pipe(
        Effect.provide(TestRouter({ url: "http://localhost/article/hello-world" })),
        Effect.scoped,
      );

      expect(values).toEqual(["server-handler"]);
    }).pipe(Effect.runPromise));
});
