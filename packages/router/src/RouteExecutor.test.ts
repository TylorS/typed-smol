import { assert, describe, it } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { Fx } from "@typed/fx";
import * as Matcher from "./Matcher.js";
import * as Route from "./Route.js";
import { makeRouteExecutor } from "./RouteExecutor.js";

describe("RouteExecutor", () => {
  it("falls through guarded candidates in declaration order", () =>
    Effect.gen(function* () {
      const route = Route.Parse("users");
      const matcher = Matcher.empty
        .match(route, () => Effect.succeed(Option.none()), "first")
        .match(
          route,
          () => Effect.succeed(Option.some("allowed")),
          (params) => params,
        );
      const executor = yield* makeRouteExecutor<string, never, never>();

      const fx = yield* executor.transition({
        path: "/users",
        input: {},
        candidates: Matcher.compile(matcher.cases),
      });

      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(fx, 1)), ["allowed"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("updates params without recreating the selected handler", () =>
    Effect.gen(function* () {
      let mounts = 0;
      const route = Route.Param("id");
      const matcher = Matcher.empty.match(route, (params) => {
        mounts += 1;
        return Fx.map(params, ({ id }) => id);
      });
      const candidates = Matcher.compile(matcher.cases);
      const executor = yield* makeRouteExecutor<string, never, never>();
      const first = yield* executor.transition({ path: "/1", input: { id: "1" }, candidates });
      const second = yield* executor.transition({ path: "/2", input: { id: "2" }, candidates });

      assert.strictEqual(first, second);
      assert.strictEqual(mounts, 1);
      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(second, 1)), ["2"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("makes ambient services available to guards and handlers", () => {
    class Ambient extends Context.Service<Ambient, { readonly value: string }>()("Ambient") {}

    return Effect.gen(function* () {
      const route = Route.Parse("ambient");
      const matcher = Matcher.empty.match(
        route,
        () => Effect.map(Ambient, ({ value }) => Option.some(value)),
        {
          handler: () => Fx.fromEffect(Effect.map(Ambient, ({ value }) => value)),
          dependencies: [Layer.effectDiscard(Effect.asVoid(Ambient))],
        },
      );
      const executor = yield* makeRouteExecutor<string, never, Ambient>();
      const fx = yield* executor.transition({
        path: "/ambient",
        input: {},
        candidates: Matcher.compile(matcher.cases),
      });

      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(fx, 1)), ["available"]);
    }).pipe(
      Effect.provideService(Ambient, { value: "available" }),
      Effect.scoped,
      Effect.runPromise,
    );
  });

  it("rolls back Layers belonging to rejected candidates", () =>
    Effect.gen(function* () {
      const acquired = yield* Ref.make(0);
      const released = yield* Ref.make(0);
      const candidateLayer = Layer.effectDiscard(
        Effect.acquireRelease(
          Ref.update(acquired, (value) => value + 1),
          () => Ref.update(released, (value) => value + 1),
        ),
      );
      const route = Route.Parse("layered");
      const matcher = Matcher.empty
        .match(route, () => Effect.succeedNone, {
          handler: "first",
          dependencies: [candidateLayer],
        })
        .match(route, () => Effect.succeedSome({}), "second");
      const executor = yield* makeRouteExecutor<string, never, never>();
      const fx = yield* executor.transition({
        path: "/layered",
        input: {},
        candidates: Matcher.compile(matcher.cases),
      });

      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(fx, 1)), ["second"]);
      assert.strictEqual(yield* Ref.get(acquired), 1);
      assert.strictEqual(yield* Ref.get(released), 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("closes the previous route scope when the selected entry changes", () =>
    Effect.gen(function* () {
      const closed = yield* Ref.make(0);
      const firstMatcher = Matcher.empty.match(Route.Parse("first"), () =>
        Fx.unwrap(
          Effect.addFinalizer(() => Ref.update(closed, (value) => value + 1)).pipe(
            Effect.as(Fx.succeed("first")),
          ),
        ),
      );
      const secondMatcher = Matcher.empty.match(Route.Parse("second"), "second");
      const executor = yield* makeRouteExecutor<string, never, never>();
      const first = yield* executor.transition({
        path: "/first",
        input: {},
        candidates: Matcher.compile(firstMatcher.cases),
      });
      yield* Fx.collectAll(Fx.take(first, 1));

      yield* executor.transition({
        path: "/second",
        input: {},
        candidates: Matcher.compile(secondMatcher.cases),
      });

      assert.strictEqual(yield* Ref.get(closed), 1);
    }).pipe(Effect.scoped, Effect.runPromise));
});
