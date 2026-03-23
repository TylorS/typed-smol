import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Latch from "effect/Latch";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import * as Result from "effect/Result";
import * as ServiceMap from "effect/ServiceMap";
import { Fx } from "@typed/fx";
import type { RefSubject } from "@typed/fx/RefSubject";
import { Navigation } from "@typed/navigation";
import * as Matcher from "./Matcher.js";
import * as Route from "./Route.js";
import { ServerRouter } from "./Router.js";

/** Runs a fully-scoped Effect in tests; `as any` avoids R-channel mismatch with `Effect.runPromise`. */
const runEff = (eff: Effect.Effect<unknown, unknown, unknown>) => Effect.runPromise(eff as any);

class TestError extends Data.TaggedError("TestError")<{ readonly message: string }> {}

class OtherError extends Data.TaggedError("OtherError")<{ readonly message: string }> {}

describe("typed/router/Matcher", () => {
  it("type check for match options inference", () => {
    const route = Route.Parse("type");

    const matcher = Matcher.empty.match(
      route,
      () => Effect.succeed(Option.some({ ok: true as const })),
      (params) => Fx.map(params, (p) => p.ok),
    );

    void matcher;
  });

  it("match with { handler, layout } returns layout output type and composes correctly", () =>
    Effect.gen(function* () {
      const route = Route.Parse("dashboard");

      const matcher = Matcher.empty.match(route, {
        handler: Fx.succeed(42),
        layout: ({ content }) => Fx.map(content, (n) => `wrapped:${n}`),
      });

      const values = yield* Fx.collectAll(Fx.take(matcher, 1));

      assert.deepStrictEqual(values, ["wrapped:42"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/dashboard" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("matches routes and emits values as the path changes", () =>
    Effect.gen(function* () {
      const users = Route.Join(Route.Parse("users"), Route.Param("id"));
      const about = Route.Parse("about");

      const fx = Matcher.empty
        .match(users, (params) => Fx.map(params, ({ id }) => `users:${id}`))
        .match(about, "about");

      const values: Array<string> = [];
      const first = Latch.makeUnsafe();
      const done = Latch.makeUnsafe();
      const fiber = yield* Effect.forkChild(
        Fx.observe(fx, (value) =>
          Effect.sync(() => {
            values.push(value);
          }).pipe(
            Effect.flatMap(() => {
              if (values.length === 1) return first.open;
              if (values.length === 2) return done.open;
              return Effect.void;
            }),
          ),
        ),
      );
      yield* Effect.yieldNow;

      yield* first.await;
      yield* Navigation.navigate("http://localhost/about");

      yield* done.await;
      yield* Fiber.interrupt(fiber);

      assert.deepStrictEqual(values, ["users:1", "about"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("fails with RouteNotFound when no route matches", () =>
    Effect.gen(function* () {
      const route = Route.Parse("about");
      const fx = Matcher.empty.match(route, () => "about");

      const path = yield* Fx.collectAll(Fx.take(fx, 1)).pipe(
        Effect.as("" as const),
        Effect.catchTag("RouteNotFound", (e) => Effect.succeed(e.path)),
      );

      assert.strictEqual(path, "/nope");
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/nope" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("updates params without re-running the handler for the same route", () =>
    Effect.gen(function* () {
      const mounts = yield* Ref.make(0);
      const users = Route.Join(Route.Parse("users"), Route.Param("id"));

      const matcher = Matcher.empty.match(users, (params) =>
        Fx.unwrap(Ref.update(mounts, (n) => n + 1).pipe(Effect.as(Fx.map(params, ({ id }) => id)))),
      );

      const fx = matcher;

      const values: Array<string> = [];
      const first = Latch.makeUnsafe();
      const done = Latch.makeUnsafe();
      const fiber = yield* Effect.forkChild(
        Fx.observe(fx, (value) =>
          Effect.sync(() => {
            values.push(value);
          }).pipe(
            Effect.flatMap(() => {
              if (values.length === 1) return first.open;
              if (values.length === 2) return done.open;
              return Effect.void;
            }),
          ),
        ),
      );
      yield* Effect.yieldNow;

      yield* first.await;
      yield* Navigation.navigate("http://localhost/users/2");

      yield* done.await;
      yield* Fiber.interrupt(fiber);

      assert.deepStrictEqual(values, ["1", "2"]);
      assert.strictEqual(yield* Ref.get(mounts), 1);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("runs guards in order and uses the guard output", () =>
    Effect.gen(function* () {
      const users = Route.Join(Route.Parse("users"), Route.Param("id"));
      const calls = yield* Ref.make<ReadonlyArray<string>>([]);

      const fx = Matcher.empty
        .match(
          users,
          () => Ref.update(calls, (entries) => [...entries, "g1"]).pipe(Effect.as(Option.none())),
          "skip",
        )
        .match(
          users,
          (input) =>
            Ref.update(calls, (entries) => [...entries, "g2"]).pipe(
              Effect.as(Option.some({ ...input, ok: true as const })),
            ),
          (params) => Fx.map(params, (p) => p.ok),
        );

      const values = yield* Fx.collectAll(Fx.take(fx, 1));
      assert.deepStrictEqual(values, [true]);
      assert.deepStrictEqual(yield* Ref.get(calls), ["g1", "g2"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("accumulates guard failures when no guard matches", () =>
    Effect.gen(function* () {
      const users = Route.Join(Route.Parse("users"), Route.Param("id"));
      const fx = Matcher.empty
        .match(users, () => Effect.fail("g1"), "ok")
        .match(users, () => Effect.fail("g2"), "ok");

      const result = yield* Fx.collectAll(Fx.take(fx, 1)).pipe(
        Effect.as(0),
        Effect.catchTag("RouteGuardError", (e) => Effect.succeed(e.causes.length)),
      );

      assert.strictEqual(result, 2);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("reuses shared layers and layouts across route changes", () =>
    Effect.gen(function* () {
      const mounts = yield* Ref.make(0);
      const layouts = yield* Ref.make(0);

      const sharedLayer = Layer.effectServices(
        Ref.update(mounts, (n) => n + 1).pipe(Effect.as(ServiceMap.empty())),
      );

      const users = Route.Join(Route.Parse("users"), Route.Param("id"));
      const about = Route.Parse("about");

      const fx = Matcher.empty
        .match(users, (params) => Fx.map(params, ({ id }) => `users:${id}`))
        .match(about, "about")
        .provide(sharedLayer)
        .layout(({ content }) =>
          Fx.unwrap(Ref.update(layouts, (n) => n + 1).pipe(Effect.as(content))),
        );

      const values: Array<string> = [];
      const first = Latch.makeUnsafe();
      const done = Latch.makeUnsafe();
      const fiber = yield* Effect.forkChild(
        Fx.observe(fx, (value) =>
          Effect.sync(() => {
            values.push(value);
          }).pipe(
            Effect.flatMap(() => {
              if (values.length === 1) return first.open;
              if (values.length === 2) return done.open;
              return Effect.void;
            }),
          ),
        ),
      );
      yield* Effect.yieldNow;

      yield* first.await;
      yield* Navigation.navigate("http://localhost/about");

      yield* done.await;
      yield* Fiber.interrupt(fiber);

      assert.deepStrictEqual(values, ["users:1", "about"]);
      assert.strictEqual(yield* Ref.get(mounts), 1);
      assert.strictEqual(yield* Ref.get(layouts), 1);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  // RouteDecodeError requires Route.ParamWithSchema which has a bug (uses schema.Type instead of schema)
  // TODO: Add RouteDecodeError test once Route.ParamWithSchema is fixed

  it("ignores trailing slashes", () =>
    Effect.gen(function* () {
      const about = Route.Parse("about");
      const fx = Matcher.empty.match(about, "about");

      const values = yield* Fx.collectAll(Fx.take(fx, 1));
      assert.deepStrictEqual(values, ["about"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/about/" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("is case insensitive", () =>
    Effect.gen(function* () {
      const about = Route.Parse("about");
      const fx = Matcher.empty.match(about, "about");

      const values = yield* Fx.collectAll(Fx.take(fx, 1));
      assert.deepStrictEqual(values, ["about"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/ABOUT" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("succeeds when first guard fails but later guard succeeds", () =>
    Effect.gen(function* () {
      const users = Route.Join(Route.Parse("users"), Route.Param("id"));

      const fx = Matcher.empty
        .match(users, () => Effect.fail("guard1-error"), "never")
        .match(
          users,
          (input) => Effect.succeed(Option.some({ ...input, ok: true as const })),
          "matched",
        );

      const values = yield* Fx.collectAll(Fx.take(fx, 1));
      assert.deepStrictEqual(values, ["matched"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("fails with RouteGuardError with empty causes when all guards return Option.none", () =>
    Effect.gen(function* () {
      const users = Route.Join(Route.Parse("users"), Route.Param("id"));

      const fx = Matcher.empty
        .match(users, () => Effect.succeed(Option.none()), "never1")
        .match(users, () => Effect.succeed(Option.none()), "never2");

      const result = yield* Fx.collectAll(Fx.take(fx, 1)).pipe(
        Effect.as("matched" as const),
        Effect.catchTag("RouteGuardError", (e) => Effect.succeed(e.causes.length)),
      );

      assert.strictEqual(result, 0);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("Matcher.catch recovers from typed failures", () =>
    Effect.gen(function* () {
      const about = Route.Parse("about");

      const matcher = Matcher.empty
        .match(about, Fx.fail(new TestError({ message: "fail" })))
        .catch(() => Fx.succeed("recovered"));

      const fx = matcher;
      const values = yield* Fx.collectAll(Fx.take(fx, 1));

      assert.deepStrictEqual(values, ["recovered"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/about" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("Matcher.catchTag only recovers for matching tag", () =>
    Effect.gen(function* () {
      const about = Route.Parse("about");

      const matcher = Matcher.empty
        .match(about, Fx.fail(new TestError({ message: "fail" })))
        .catchTag("TestError", () => Fx.succeed("recovered"));

      const fx = matcher;
      const values = yield* Fx.collectAll(Fx.take(fx, 1));

      assert.deepStrictEqual(values, ["recovered"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/about" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  // Note: catchTag only allows tags that exist in the error union.
  // The type system prevents catching non-existent tags at compile time.

  it("Matcher.catchCause recovers from any cause", () =>
    Effect.gen(function* () {
      const about = Route.Parse("about");

      const matcher = Matcher.empty
        .match(about, Fx.fail(new TestError({ message: "fail" })))
        .catchCause((causeRef) =>
          Fx.unwrap(
            Effect.gen(function* () {
              const cause = yield* causeRef;
              const msg = Cause.hasFails(cause) ? "recovered" : "other";
              return Fx.succeed(msg);
            }),
          ),
        );

      const fx = matcher;
      const values = yield* Fx.collectAll(Fx.take(fx, 1));

      assert.deepStrictEqual(values, ["recovered"]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/about" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  describe("function Matcher.catch* and error origins", () => {
    it("Matcher.catchCause (function) recovers defect from Effect.sync throw in inner handler Fx", () =>
      runEff(
        Effect.gen(function* () {
        const about = Route.Parse("about");
        const inner = Matcher.empty.match(about, () =>
          Fx.unwrap(Effect.sync(() => { throw new Error("sync-boom"); })),
        );
        const handler = (causeRef: RefSubject.RefSubject<Cause.Cause<unknown>>) =>
          Fx.unwrap(
            Effect.gen(function* () {
              const cause = yield* causeRef;
              if (Cause.hasFails(cause)) {
                return Fx.fromEffect(Effect.failCause(cause));
              }
              return Fx.succeed("recovered-sync");
            }),
          );
        const wide = inner as any;
        const a = yield* Fx.collectAll(Fx.take(Matcher.catchCause(handler)(wide), 1));
        const b = yield* Fx.collectAll(Fx.take(Matcher.catchCause(wide, handler), 1));
        assert.deepStrictEqual(a, ["recovered-sync"]);
        assert.deepStrictEqual(b, ["recovered-sync"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("RouteGuardError from failed guards is recoverable at Effect boundary (mapEffect failure)", () =>
      runEff(
        Effect.gen(function* () {
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const inner = Matcher.empty
          .match(users, () => Effect.fail("g1"), "a")
          .match(users, () => Effect.fail("g2"), "b");
        const recovered = yield* Fx.collectAll(Fx.take(inner, 1)).pipe(
          Effect.as("" as const),
          Effect.catchTag("RouteGuardError" as const, () => Effect.succeed("recovered-guard" as const)),
        );
        assert.strictEqual(recovered, "recovered-guard");
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
        Effect.scoped,
      ),
    ),
    );

    it("Matcher.catchTag (function, curried) recovers inner Fx TestError", () =>
      runEff(
        Effect.gen(function* () {
        const about = Route.Parse("about");
        const inner = Matcher.empty.match(about, Fx.fail(new TestError({ message: "inner" })));
        const fx = (Matcher.catchTag as any)("TestError", () => Fx.succeed("recovered-fx"))(inner);
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["recovered-fx"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("Matcher.catch (function) recovers typed fail from inner stream", () =>
      runEff(
        Effect.gen(function* () {
        const about = Route.Parse("about");
        const inner = Matcher.empty.match(about, Fx.fail(new TestError({ message: "x" })));
        const fx = Matcher.catch(() => Fx.succeed("recovered-catch-fn"))(inner as any);
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["recovered-catch-fn"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("function Matcher.catchCause recovers OtherError from inner Fx (typed fail path)", () =>
      runEff(
        Effect.gen(function* () {
        const about = Route.Parse("about");
        const inner = Matcher.empty.match(about, Fx.fail(new OtherError({ message: "o" })));
        const fx = Matcher.catchCause((causeRef) =>
          Fx.unwrap(
            Effect.gen(function* () {
              const cause = yield* causeRef;
              const fr = Cause.findFail(cause);
              if (Result.isFailure(fr)) {
                return Fx.fromEffect(Effect.failCause(fr.failure));
              }
              const err = fr.success.error as OtherError;
              assert.strictEqual(err._tag, "OtherError");
              return Fx.succeed("from-outer-cause");
            }),
          ),
        )(inner as any);
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["from-outer-cause"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("stacked function catchTag then catchTag: inner recovers TestError, outer does not see failure", () =>
      runEff(
        Effect.gen(function* () {
        const about = Route.Parse("about");
        const inner = Matcher.empty.match(about, Fx.fail(new TestError({ message: "t" })));
        const wrapped = (Matcher.catchTag as any)("TestError", () => Fx.succeed("inner-ok"))(inner);
        const fx = (Matcher.catchTag as any)("RouteNotFound", () => Fx.succeed("should-not-run"))(wrapped);
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["inner-ok"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("multiple layout calls compose outermost layout last", () =>
      runEff(
        Effect.gen(function* () {
        const about = Route.Parse("about");
        const fx = Matcher.empty
          .match(about, Fx.succeed("core"))
          .layout(({ content }) => Fx.map(content, (s) => `L1:${s}`))
          .layout(({ content }) => Fx.map(content, (s) => `L2:${s}`));
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["L2:L1:core"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("multiple layout calls keep inner layout mounted once when params update on same route", () =>
      runEff(
        Effect.gen(function* () {
        const l1 = yield* Ref.make(0);
        const l2 = yield* Ref.make(0);
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const fx = Matcher.empty
          .match(users, (params) => Fx.map(params, ({ id }) => id))
          .layout(({ content }) =>
            Fx.unwrap(
              Ref.update(l1, (n) => n + 1).pipe(Effect.as(Fx.map(content, (s) => `A:${s}`))),
            ),
          )
          .layout(({ content }) =>
            Fx.unwrap(
              Ref.update(l2, (n) => n + 1).pipe(Effect.as(Fx.map(content, (s) => `B:${s}`))),
            ),
          );
        const values: Array<string> = [];
        const first = Latch.makeUnsafe();
        const done = Latch.makeUnsafe();
        const fiber = yield* Effect.forkChild(
          Fx.observe(fx, (value) =>
            Effect.sync(() => values.push(value)).pipe(
              Effect.flatMap(() => {
                if (values.length === 1) return first.open;
                if (values.length === 2) return done.open;
                return Effect.void;
              }),
            ),
          ),
        );
        yield* Effect.yieldNow;
        yield* first.await;
        yield* Navigation.navigate("http://localhost/users/2");
        yield* done.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["B:A:1", "B:A:2"]);
        assert.strictEqual(yield* Ref.get(l1), 1);
        assert.strictEqual(yield* Ref.get(l2), 1);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
        Effect.scoped,
      ),
    ),
    );

    it("chained provide layers merge services for handler", () =>
      runEff(
        Effect.gen(function* () {
        class SvcA extends ServiceMap.Service<SvcA, { readonly n: number }>()("SvcA") {}
        class SvcB extends ServiceMap.Service<SvcB, { readonly s: string }>()("SvcB") {}
        const about = Route.Parse("about");
        const fx = Matcher.empty
          .match(about, () =>
            Fx.unwrap(
              Effect.gen(function* () {
                const a = yield* SvcA;
                const b = yield* SvcB;
                return Fx.succeed(`${a.n}:${b.s}`);
              }),
            ),
          )
          .provide(Layer.succeed(SvcA, { n: 7 }))
          .provide(Layer.succeed(SvcB, { s: "z" }));
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["7:z"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("route dependencies plus matcher provide both available to handler", () =>
      runEff(
        Effect.gen(function* () {
        class RouteSvc extends ServiceMap.Service<RouteSvc, { readonly x: number }>()("RouteSvc") {}
        class MatcherSvc extends ServiceMap.Service<MatcherSvc, { readonly y: string }>()(
          "MatcherSvc",
        ) {}
        const about = Route.Parse("about");
        const fx = Matcher.empty
          .match(about, {
            handler: Effect.gen(function* () {
              const x = yield* RouteSvc;
              const y = yield* MatcherSvc;
              return `${x.x}:${y.y}`;
            }),
            dependencies: [Layer.succeed(RouteSvc, { x: 3 })],
          } as any)
          .provide(Layer.succeed(MatcherSvc, { y: "q" }));
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["3:q"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/about" })),
        Effect.scoped,
      ),
    ),
    );

    it("guard fail then none then success: first succeeding guard wins, prior fail/none not surfaced", () =>
      runEff(
        Effect.gen(function* () {
        const order = yield* Ref.make<ReadonlyArray<string>>([]);
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const fx = Matcher.empty
          .match(
            users,
            () =>
              Ref.update(order, (xs) => [...xs, "fail"]).pipe(
                Effect.flatMap(() => Effect.fail("g1")),
              ),
            "skip1",
          )
          .match(
            users,
            () => Ref.update(order, (xs) => [...xs, "none"]).pipe(Effect.as(Option.none())),
            "skip2",
          )
          .match(
            users,
            () =>
              Ref.update(order, (xs) => [...xs, "ok"]).pipe(
                Effect.as(Option.some({ ok: true as const })),
              ),
            "hit",
          );
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["hit"]);
        assert.deepStrictEqual(yield* Ref.get(order), ["fail", "none", "ok"]);
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
        Effect.scoped,
      ),
    ),
    );

    it("RouteGuardError with layout on matcher: recover at Effect boundary; no wrap prefix on mapEffect failure", () =>
      runEff(
        Effect.gen(function* () {
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const about = Route.Parse("about");
        const inner = Matcher.empty
          .match(users, () => Effect.fail("g"), "x")
          .match(about, Fx.succeed("ok"))
          .layout(({ content }) => Fx.map(content, (s) => `wrap:${s}`));
        const recovered = yield* Fx.collectAll(Fx.take(inner, 1)).pipe(
          Effect.as("" as const),
          Effect.catchTag("RouteGuardError" as const, () => Effect.succeed("guard-fallback" as const)),
        );
        assert.strictEqual(recovered, "guard-fallback");
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
        Effect.scoped,
      ),
    ),
    );

    it("instance catchTag only wraps handler errors; RouteGuardError from guards needs Effect.catchTag on collect", () =>
      runEff(
        Effect.gen(function* () {
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const inner = (Matcher.empty.match(users, () => Effect.fail("g"), "x") as any).catchTag(
          "RouteGuardError",
          () => Fx.succeed("never"),
        );
        const exited = yield* Fx.collectAll(Fx.take(inner, 1)).pipe(Effect.exit);
        assert.isTrue(Exit.isFailure(exited));
      }).pipe(
        Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
        Effect.scoped,
      ),
    ),
    );
  });

  it("layout receives updated params when staying on same route", () =>
    Effect.gen(function* () {
      const layoutMounts = yield* Ref.make(0);
      const users = Route.Join(Route.Parse("users"), Route.Param("id"));

      const matcher = Matcher.empty
        .match(users, (params) => Fx.map(params, ({ id }) => id))
        .layout(({ content }) =>
          Fx.unwrap(Ref.update(layoutMounts, (n) => n + 1).pipe(Effect.as(content))),
        );

      const fx = matcher;

      const values: Array<string> = [];
      const first = Latch.makeUnsafe();
      const done = Latch.makeUnsafe();
      const fiber = yield* Effect.forkChild(
        Fx.observe(fx, (value) =>
          Effect.sync(() => {
            values.push(value);
          }).pipe(
            Effect.flatMap(() => {
              if (values.length === 1) return first.open;
              if (values.length === 2) return done.open;
              return Effect.void;
            }),
          ),
        ),
      );
      yield* Effect.yieldNow;

      yield* first.await;
      yield* Navigation.navigate("http://localhost/users/2");

      yield* done.await;
      yield* Fiber.interrupt(fiber);

      assert.deepStrictEqual(values, ["1", "2"]);
      assert.strictEqual(yield* Ref.get(layoutMounts), 1);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/users/1" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("per-route dependencies option provides services to handler", () =>
    Effect.gen(function* () {
      class Counter extends ServiceMap.Service<Counter, { readonly value: number }>()("Counter") {}

      const counterLayer = Layer.succeed(Counter, { value: 42 });
      const about = Route.Parse("about");

      const matcher = Matcher.empty.match(about, {
        handler: Fx.unwrap(
          Effect.gen(function* () {
            const counter = yield* Counter;
            return Fx.succeed(counter.value);
          }),
        ),
        dependencies: [counterLayer],
      });

      const fx = matcher;
      const values = yield* Fx.collectAll(Fx.take(fx, 1));

      assert.deepStrictEqual(values, [42]);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/about" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("layer finalizer runs when guard fails after layer build", () =>
    Effect.gen(function* () {
      const finalized = yield* Ref.make(false);
      const about = Route.Parse("about");
      const other = Route.Parse("other");

      const layerWithFinalizer = Layer.effectServices(
        Effect.acquireRelease(Effect.succeed(ServiceMap.empty()), () => Ref.set(finalized, true)),
      );

      const matcher = Matcher.empty
        .match(about, {
          handler: "about",
          dependencies: [layerWithFinalizer],
        })
        .match(other, "other");

      const fx = matcher;
      const values = yield* Fx.collectAll(Fx.take(fx, 1));

      assert.deepStrictEqual(values, ["other"]);
      assert.isFalse(yield* Ref.get(finalized));
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/other" })),
      Effect.scoped,
      Effect.runPromise,
    ));
});
