import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Latch from "effect/Latch";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import * as Result from "effect/Result";
import * as ServiceMap from "effect/ServiceMap";
import * as Stream from "effect/Stream";
import { Fx } from "@typed/fx";
import type { RefSubject } from "@typed/fx/RefSubject";
import { Navigation } from "@typed/navigation";
import * as Matcher from "./Matcher.js";
import * as Route from "./Route.js";
import { absoluteUrl, runWithBrowserRouter } from "./test-utils/matcherBrowserHarness.js";
import { pipe } from "effect";

class TestError extends Data.TaggedError("TestError")<{ readonly message: string }> {}

class OtherError extends Data.TaggedError("OtherError")<{ readonly message: string }> {}

describe("typed/router/Matcher (browser)", () => {
  it("match with { handler, layout } composes under BrowserRouter", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/dashboard"));
        const route = Route.Parse("dashboard");
        const matcher = Matcher.empty.match(route, {
          handler: Fx.succeed(42),
          layout: ({ content }) => Fx.map(content, (n) => `wrapped:${n}`),
        });
        const values = yield* Fx.collectAll(Fx.take(matcher, 1));
        assert.deepStrictEqual(values, ["wrapped:42"]);
      }),
    ));

  it("emits as path changes via Navigation (push)", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));

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
        yield* Navigation.navigate(absoluteUrl("/about"));
        yield* done.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["users:1", "about"]);
      }),
    ));

  it("replace history updates CurrentPath", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/a"));
        const a = Route.Parse("a");
        const b = Route.Parse("b");
        const fx = Matcher.empty.match(a, "a").match(b, "b");
        const values: Array<string> = [];
        const step1 = Latch.makeUnsafe();
        const step2 = Latch.makeUnsafe();
        const fiber = yield* Effect.forkChild(
          Fx.observe(fx, (value) =>
            Effect.sync(() => values.push(value as string)).pipe(
              Effect.flatMap(() => {
                if (values.length === 1) return step1.open;
                if (values.length === 2) return step2.open;
                return Effect.void;
              }),
            ),
          ),
        );
        yield* Effect.yieldNow;
        yield* step1.await;
        yield* Navigation.navigate(absoluteUrl("/b"), { history: "replace" });
        yield* step2.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["a", "b"]);
      }),
    ));

  it("navigating back to a prior path re-matches (explicit navigate)", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/one"));
        const one = Route.Parse("one");
        const two = Route.Parse("two");
        const fx = Matcher.empty.match(one, "1").match(two, "2");
        const values: Array<string> = [];
        const l1 = Latch.makeUnsafe();
        const l2 = Latch.makeUnsafe();
        const l3 = Latch.makeUnsafe();
        const fiber = yield* Effect.forkChild(
          Fx.observe(fx, (value) =>
            Effect.sync(() => values.push(value as string)).pipe(
              Effect.flatMap(() => {
                if (values.length === 1) return l1.open;
                if (values.length === 2) return l2.open;
                if (values.length === 3) return l3.open;
                return Effect.void;
              }),
            ),
          ),
        );
        yield* Effect.yieldNow;
        yield* l1.await;
        yield* Navigation.navigate(absoluteUrl("/two"));
        yield* l2.await;
        yield* Navigation.navigate(absoluteUrl("/one"));
        yield* l3.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["1", "2", "1"]);
      }),
    ));

  it("RouteNotFound includes path from CurrentPath", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/nope"));
        const route = Route.Parse("about");
        const fx = Matcher.empty.match(route, "about");
        const result = yield* Fx.collectAll(Fx.take(fx, 1)).pipe(
          Effect.as("matched" as const),
          Effect.catchTag("RouteNotFound", (e) => Effect.succeed(e.path)),
        );
        assert.strictEqual(result, "/nope");
      }),
    ));

  it("updates params without re-running the handler for the same route", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));
        const mounts = yield* Ref.make(0);
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const matcher = Matcher.empty.match(users, (params) =>
          Fx.unwrap(
            Ref.update(mounts, (n) => n + 1).pipe(Effect.as(Fx.map(params, ({ id }) => id))),
          ),
        );
        const fx = matcher;
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
        yield* Navigation.navigate(absoluteUrl("/users/2"));
        yield* done.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["1", "2"]);
        assert.strictEqual(yield* Ref.get(mounts), 1);
      }),
    ));

  it("runs guards in order and uses the guard output", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));
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
      }),
    ));

  it("accumulates guard failures when no guard matches", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const fx = Matcher.empty
          .match(users, () => Effect.fail("g1"), "ok")
          .match(users, () => Effect.fail("g2"), "ok");
        const result = yield* Fx.collectAll(Fx.take(fx, 1)).pipe(
          Effect.as(0),
          Effect.catchTag("RouteGuardError", (e) => Effect.succeed(e.causes.length)),
        );
        assert.strictEqual(result, 2);
      }),
    ));

  it("reuses shared layers and layouts across route changes", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));
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
        yield* Navigation.navigate(absoluteUrl("/about"));
        yield* done.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["users:1", "about"]);
        assert.strictEqual(yield* Ref.get(mounts), 1);
        assert.strictEqual(yield* Ref.get(layouts), 1);
      }),
    ));

  it("ignores trailing slashes", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/about/"));
        const route = Route.Parse("about");
        const fx = Matcher.empty.match(route, "ok");
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["ok"]);
      }),
    ));

  it("is case insensitive for segments", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/ABOUT"));
        const route = Route.Parse("about");
        const fx = Matcher.empty.match(route, "ok");
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["ok"]);
      }),
    ));

  it("Matcher.catch recovers from typed failures", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/about"));
        const about = Route.Parse("about");
        const matcher = Matcher.empty
          .match(about, Fx.fail(new TestError({ message: "fail" })))
          .catch(() => Fx.succeed("recovered"));
        const fx = matcher;
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["recovered"]);
      }),
    ));

  it("Matcher.catchTag recovers for matching tag", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/about"));
        const about = Route.Parse("about");
        const matcher = Matcher.empty
          .match(about, Fx.fail(new TestError({ message: "fail" })))
          .catchTag("TestError", () => Fx.succeed("recovered"));
        const fx = matcher;
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["recovered"]);
      }),
    ));

  it("Matcher.catchCause recovers from any cause", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/about"));
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
      }),
    ));

  describe("function Matcher.catch* and composition (browser)", () => {
    it("Matcher.catchCause (function) recovers Effect.sync defect in inner handler Fx", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/about"));
          const about = Route.Parse("about");
          const inner = Matcher.empty.match(about, () =>
            Fx.unwrap(
              Effect.sync(() => {
                throw new Error("sync-boom");
              }),
            ),
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
          const values = yield* Fx.collectAll(Fx.take(Matcher.catchCause(handler)(wide), 1));
          assert.deepStrictEqual(values, ["recovered-sync"]);
        }),
      ));

    it("RouteGuardError from guards recoverable at Effect boundary", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/users/1"));
          const users = Route.Join(Route.Parse("users"), Route.Param("id"));
          const inner = Matcher.empty
            .match(users, () => Effect.fail("g1"), "a")
            .match(users, () => Effect.fail("g2"), "b");
          const recovered = yield* Fx.collectAll(Fx.take(inner, 1)).pipe(
            Effect.as("" as const),
            Effect.catchTag("RouteGuardError", () => Effect.succeed("recovered-guard" as const)),
          );
          assert.strictEqual(recovered, "recovered-guard");
        }),
      ));

    it("function Matcher.catchTag and Matcher.catch (curried)", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/about"));
          const about = Route.Parse("about");
          const inner = Matcher.empty.match(about, Fx.fail(new TestError({ message: "x" })));
          const wide = inner as any;
          const a = yield* Fx.collectAll(
            Fx.take((Matcher.catchTag as any)("TestError", () => Fx.succeed("a"))(wide), 1),
          );
          const b = yield* Fx.collectAll(Fx.take(Matcher.catch(() => Fx.succeed("b"))(wide), 1));
          assert.deepStrictEqual(a, ["a"]);
          assert.deepStrictEqual(b, ["b"]);
        }),
      ));

    it("function Matcher.catchCause recovers OtherError from inner Fx", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/about"));
          const about = Route.Parse("about");
          const inner = Matcher.empty.match(about, Fx.fail(new OtherError({ message: "o" })));
          const fx = pipe(
            inner,
            Matcher.catchCause((causeRef) =>
              Fx.unwrap(
                Effect.gen(function* () {
                  const cause = yield* causeRef;
                  const fr = Cause.findFail(cause);
                  if (Result.isFailure(fr)) {
                    return Fx.fromEffect(Effect.failCause(fr.failure));
                  }
                  assert.strictEqual((fr.success.error as OtherError)._tag, "OtherError");
                  return Fx.succeed("ok");
                }),
              ),
            ),
          );
          const values = yield* Fx.collectAll(Fx.take(fx, 1));
          assert.deepStrictEqual(values, ["ok"]);
        }),
      ));

    it("stacked function catchTag: inner recovers, outer RouteNotFound unused", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/about"));
          const about = Route.Parse("about");
          const inner = Matcher.empty.match(about, Fx.fail(new TestError({ message: "t" })));
          const wrapped = pipe(
            inner,
            Fx.catchTag("TestError", () => Fx.succeed("inner-ok")),
            Fx.catchTag("RouteNotFound", () => Fx.succeed("no")),
          );
          const values = yield* Fx.collectAll(Fx.take(wrapped, 1));
          assert.deepStrictEqual(values, ["inner-ok"]);
        }),
      ));

    it("multiple layout calls compose outermost last", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/about"));
          const about = Route.Parse("about");
          const fx = Matcher.empty
            .match(about, Fx.succeed("core"))
            .layout(({ content }) => Fx.map(content, (s) => `L1:${s}`))
            .layout(({ content }) => Fx.map(content, (s) => `L2:${s}`));
          const values = yield* Fx.collectAll(Fx.take(fx, 1));
          assert.deepStrictEqual(values, ["L2:L1:core"]);
        }),
      ));

    it("chained provide merges services", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/about"));
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
        }),
      ));

    it("route dependencies plus matcher provide", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/about"));
          class RouteSvc extends ServiceMap.Service<RouteSvc, { readonly x: number }>()(
            "RouteSvc",
          ) {}
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
        }),
      ));

    it("guard fail then none then success visits all guards in order", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/users/1"));
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
        }),
      ));

    it("instance catchTag does not catch RouteGuardError from guards", () =>
      runWithBrowserRouter(
        Effect.gen(function* () {
          yield* Navigation.navigate(absoluteUrl("/users/1"));
          const users = Route.Join(Route.Parse("users"), Route.Param("id"));
          const inner = pipe(
            Matcher.empty
              .match(users, () => Effect.fail("g"), "x")
              // @ts-expect-error - invalid tag
              .catchTag("RouteGuardError", () => Fx.succeed("never")),
          );
          const exited = yield* Fx.collectAll(Fx.take(inner, 1)).pipe(Effect.exit);
          assert.isTrue(Exit.isFailure(exited));
        }),
      ));
  });

  it("layout receives updated params when staying on same route", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));
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
        yield* Navigation.navigate(absoluteUrl("/users/2"));
        yield* done.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["1", "2"]);
        assert.strictEqual(yield* Ref.get(layoutMounts), 1);
      }),
    ));

  it("per-route dependencies provide services to handler", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/about"));
        class Counter extends ServiceMap.Service<Counter, { readonly value: number }>()(
          "Counter",
        ) {}
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
      }),
    ));

  it("layer finalizer does not run when guard fails after layer build on another branch", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/other"));
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
      }),
    ));

  it("merge combines matchers from different roots", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/about"));
        const about = Matcher.empty.match(Route.Parse("about"), "about-page");
        const users = Matcher.empty.match(
          Route.Join(Route.Parse("users"), Route.Param("id")),
          (p) => Fx.map(p, ({ id }) => `user:${id}`),
        );
        const merged = Matcher.merge(about, users);
        const fx = merged;
        const values: Array<string> = [];
        const l1 = Latch.makeUnsafe();
        const l2 = Latch.makeUnsafe();
        const fiber = yield* Effect.forkChild(
          Fx.observe(fx, (value) =>
            Effect.sync(() => values.push(value as string)).pipe(
              Effect.flatMap(() => {
                if (values.length === 1) return l1.open;
                if (values.length === 2) return l2.open;
                return Effect.void;
              }),
            ),
          ),
        );
        yield* Effect.yieldNow;
        yield* l1.await;
        yield* Navigation.navigate(absoluteUrl("/users/9"));
        yield* l2.await;
        yield* Fiber.interrupt(fiber);
        assert.deepStrictEqual(values, ["about-page", "user:9"]);
      }),
    ));

  it("prefix scopes routes under a path segment", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/admin/panel"));
        const matcher = Matcher.empty
          .match(Route.Parse("panel"), "admin-panel")
          .prefix(Route.Parse("admin"));
        const fx = matcher;
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["admin-panel"]);
      }),
    ));

  it("decodes percent-encoded path params (browser URL + find-my-way)", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("tag"), Route.Param("label"));
        yield* Navigation.navigate(absoluteUrl("/tag/hello%20world"));
        const fx = Matcher.empty.match(route, (params) => Fx.map(params, ({ label }) => label));
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["hello world"]);
      }),
    ));

  it("Stream handler emits multiple values", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/stream"));
        const route = Route.Parse("stream");
        const fx = Matcher.empty.match(route, Stream.fromIterable(["a", "b"] as const));
        const values = yield* Fx.collectAll(Fx.take(fx, 2));
        assert.deepStrictEqual(values, ["a", "b"]);
      }),
    ));

  it("provideService supplies a service to handlers", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/svc"));
        class Svc extends ServiceMap.Service<Svc, { readonly n: number }>()("Svc") {}
        const route = Route.Parse("svc");
        const matcher = Matcher.empty
          .match(route, () =>
            Fx.unwrap(
              Effect.gen(function* () {
                const s = yield* Svc;
                return Fx.succeed(s.n);
              }),
            ),
          )
          .provideService(Svc, { n: 99 });
        const values = yield* Fx.collectAll(Fx.take(matcher, 1));
        assert.deepStrictEqual(values, [99]);
      }),
    ));

  it("succeeds when first guard fails but later guard succeeds", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const fx = Matcher.empty
          .match(users, () => Effect.fail("bad"), "skip")
          .match(
            users,
            () => Effect.succeed(Option.some({ ok: true as const })),
            (p) => Fx.map(p, (x) => x.ok),
          );
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, [true]);
      }),
    ));

  it("RouteGuardError has empty causes when all guards return Option.none", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/users/1"));
        const users = Route.Join(Route.Parse("users"), Route.Param("id"));
        const fx = Matcher.empty
          .match(users, () => Effect.succeed(Option.none()), "a")
          .match(users, () => Effect.succeed(Option.none()), "b");
        const result = yield* Fx.collectAll(Fx.take(fx, 1)).pipe(
          Effect.as("matched" as const),
          Effect.catchTag("RouteGuardError", (e) => Effect.succeed(e.causes.length)),
        );
        assert.strictEqual(result, 0);
      }),
    ));
});
