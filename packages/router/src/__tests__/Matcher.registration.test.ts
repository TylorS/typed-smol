import { assert, describe, it, vi } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";

const registrations = vi.hoisted(
  () => [] as Array<{ readonly method: string; readonly path: string }>,
);

vi.mock("find-my-way-ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("find-my-way-ts")>();

  return {
    ...original,
    make: <A>(options?: Partial<import("find-my-way-ts").RouterConfig>) => {
      const router = original.make<A>(options);
      return {
        on: (
          method: string | Iterable<string>,
          path: import("find-my-way-ts").PathInput,
          handler: A,
        ) => {
          for (const value of typeof method === "string" ? [method] : method) {
            registrations.push({ method: value, path });
          }
          router.on(method, path, handler);
        },
        all: (path: import("find-my-way-ts").PathInput, handler: A) => {
          registrations.push({ method: "ALL", path });
          router.all(path, handler);
        },
        find: router.find.bind(router),
        has: router.has.bind(router),
      };
    },
  };
});

import * as Matcher from "../Matcher.js";
import * as Route from "../Route.js";
import { ServerRouter } from "../Router.js";

describe("typed/router/Matcher client registrations", () => {
  it("registers client routes only for the queried GET method", () =>
    Effect.gen(function* () {
      registrations.length = 0;
      const matcher = Matcher.empty.match(Route.Parse("about"), "about");

      const values = yield* Fx.collectAll(Fx.take(matcher, 1));

      assert.deepStrictEqual(values, ["about"]);
      assert.deepStrictEqual(registrations, [{ method: "GET", path: "/about" }]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/about" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("preserves regex constraints in matcher registrations", () =>
    Effect.gen(function* () {
      registrations.length = 0;
      const matcher = Matcher.empty.match(Route.Parse("/users/:id(\\d+)"), "user");

      const values = yield* Fx.collectAll(Fx.take(matcher, 1));

      assert.deepStrictEqual(values, ["user"]);
      assert.deepStrictEqual(registrations, [{ method: "GET", path: "/users/:id(\\d+)" }]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/42" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("expands non-terminal optional regex parameters into concrete registrations", () =>
    Effect.gen(function* () {
      registrations.length = 0;
      const matcher = Matcher.empty.match(Route.Parse("/users/:id(\\d+)?/settings"), "settings");

      const values = yield* Fx.collectAll(Fx.take(matcher, 1));

      assert.deepStrictEqual(values, ["settings"]);
      assert.deepStrictEqual(registrations, [
        { method: "GET", path: "/users/:id(\\d+)/settings" },
        { method: "GET", path: "/users/settings" },
      ]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/settings" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("keeps query declarations out of required and optional path registrations", () =>
    Effect.gen(function* () {
      registrations.length = 0;
      const matcher = Matcher.empty
        .match(Route.Parse("/users/:id?q=:term"), "required")
        .match(Route.Parse("/teams/:id??q=:term"), "optional");

      const values = yield* Fx.collectAll(Fx.take(matcher, 1));

      assert.deepStrictEqual(values, ["optional"]);
      assert.deepStrictEqual(registrations, [
        { method: "GET", path: "/users/:id" },
        { method: "GET", path: "/teams/:id" },
        { method: "GET", path: "/teams" },
      ]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/teams?q=hello" })),
      Effect.scoped,
      Effect.runPromise,
    ));
});
