import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { CurrentPath, Navigation } from "@typed/navigation";
import * as Router from "./Router.js";

describe("typed/router/Router", () => {
  it("push forks navigation so callers do not wait for navigation completion", () =>
    Effect.gen(function* () {
      yield* Navigation.onBeforeNavigation(() =>
        Effect.succeed(Option.some(Effect.sleep("50 millis"))),
      );

      const startedAt = Date.now();
      yield* Router.push("http://localhost/blocked");
      const elapsed = Date.now() - startedAt;
      yield* Effect.yieldNow;

      assert.equal(yield* CurrentPath, "/start");
      assert.ok(elapsed < 40, `push waited ${elapsed}ms for navigation`);
      yield* Effect.sleep("75 millis");
      assert.equal(yield* CurrentPath, "/blocked");
    }).pipe(
      Effect.provide(Router.ServerRouter({ url: "http://localhost/start" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("replace forks navigation with replace history semantics", () =>
    Effect.gen(function* () {
      yield* Router.push("http://localhost/next");
      yield* Effect.yieldNow;

      yield* Router.replace("http://localhost/replaced");
      yield* Effect.yieldNow;

      assert.equal(yield* CurrentPath, "/replaced");
      assert.deepEqual(
        (yield* Navigation.entries).map((entry) => entry.url.pathname),
        ["/start", "/replaced"],
      );
    }).pipe(
      Effect.provide(Router.ServerRouter({ url: "http://localhost/start" })),
      Effect.scoped,
      Effect.runPromise,
    ));
});
