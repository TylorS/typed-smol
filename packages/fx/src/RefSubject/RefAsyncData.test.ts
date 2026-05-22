import * as AsyncData from "@typed/async-data";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as Fx from "../Fx/index.js";
import * as RefAsyncData from "./RefAsyncData.js";
import * as RefSubject from "./RefSubject.js";

interface ApiError {
  readonly _tag: "ApiError";
  readonly message: string;
}

describe("RefAsyncData", () => {
  it("creates AsyncData state as a RefSubject", () =>
    Effect.gen(function* () {
      const ref = yield* RefAsyncData.make<number, ApiError>();

      expect(RefSubject.isRefSubject(ref)).toBe(true);
      expect(yield* ref).toEqual(AsyncData.NoData);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("serializes refresh so another refresh cannot interleave loading and result", () =>
    Effect.gen(function* () {
      const ref = yield* RefAsyncData.make<number, ApiError>(AsyncData.success(0));
      const gate = yield* Deferred.make<void>();
      const progress = { loaded: 1, total: 2 };

      const refresh1 = yield* Effect.forkChild(
        RefAsyncData.refresh(ref, Effect.as(Deferred.await(gate), 1), progress),
        { startImmediately: true },
      );

      yield* Effect.yieldNow;
      expect(yield* ref).toEqual(AsyncData.success(0, progress));

      const refresh2 = yield* Effect.forkChild(RefAsyncData.refresh(ref, Effect.succeed(2)), {
        startImmediately: true,
      });

      yield* Effect.yieldNow;
      expect(yield* ref).toEqual(AsyncData.success(0, progress));

      yield* Deferred.succeed(gate, undefined);
      yield* Fiber.join(refresh1);
      yield* Fiber.join(refresh2);

      expect(yield* ref).toEqual(AsyncData.success(2));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("refreshes through loading into success without failing the Effect channel", () =>
    Effect.gen(function* () {
      const ref = yield* RefAsyncData.make<number, ApiError>(AsyncData.success(1));
      const gate = yield* Deferred.make<void>();
      const progress = { loaded: 1, total: 2 };

      const fiber = yield* Effect.forkChild(
        RefAsyncData.refresh(ref, Effect.as(Deferred.await(gate), 2), progress),
        { startImmediately: true },
      );

      yield* Effect.yieldNow;
      expect(yield* ref).toEqual(AsyncData.success(1, progress));

      yield* Deferred.succeed(gate, undefined);
      const result = yield* Fiber.join(fiber);

      expect(result).toEqual(AsyncData.success(2));
      expect(yield* ref).toEqual(AsyncData.success(2));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("captures refresh failures in AsyncData instead of the Effect channel", () =>
    Effect.gen(function* () {
      const ref = yield* RefAsyncData.make<number, ApiError>();
      const error: ApiError = { _tag: "ApiError", message: "nope" };

      const result = yield* RefAsyncData.refresh(ref, Effect.fail(error));

      expect(result).toEqual(AsyncData.failure(Cause.fail(error)));
      expect(yield* ref).toEqual(AsyncData.failure(Cause.fail(error)));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("refreshes AsyncData when a computed input changes", () =>
    Effect.gen(function* () {
      const page = yield* RefSubject.make(1);
      const ref = yield* RefAsyncData.fromComputedEffect(page, (value) =>
        Effect.succeed(`page-${value}`),
      );

      expect(yield* ref).toEqual(AsyncData.success("page-1"));

      yield* RefSubject.set(page, 2);
      yield* Effect.yieldNow;

      expect(yield* ref).toEqual(AsyncData.success("page-2"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("matches RefAsyncData into a computed value", () =>
    Effect.gen(function* () {
      const ref = yield* RefAsyncData.make<number, ApiError>(AsyncData.success(1));
      const label = RefAsyncData.match(ref, {
        NoData: () => "none",
        Loading: () => "loading",
        Failure: (cause) => `failure:${Cause.pretty(cause)}`,
        Success: (value) => `success:${value}`,
        Optimistic: (value) => `optimistic:${value}`,
      });

      expect(yield* label).toBe("success:1");

      yield* RefAsyncData.setNoData(ref);
      expect(yield* label).toBe("none");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("matches RefAsyncData into Fx and gives successful branches a value ref", () =>
    Effect.gen(function* () {
      const ref = yield* RefAsyncData.make<number, ApiError>(AsyncData.success(1));
      const labels = RefAsyncData.matchFx(ref, {
        NoData: () => Fx.succeed("none"),
        Loading: () => Fx.succeed("loading"),
        Failure: () => Fx.succeed("failure"),
        Success: (value) => Fx.fromEffect(Effect.map(value, (current) => `success:${current}`)),
        Optimistic: (value) =>
          Fx.fromEffect(Effect.map(value, (current) => `optimistic:${current}`)),
      });

      expect(yield* Fx.collectUpTo(labels, 1)).toEqual(["success:1"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves value, async-error, ref-error, and service type parameters", () => {
    class ApiService extends Context.Service<
      ApiService,
      {
        readonly load: Effect.Effect<number, ApiError>;
      }
    >()("ApiService") {}

    const load = Effect.gen(function* () {
      const api = yield* Effect.service(ApiService);
      return yield* api.load;
    });

    const refresh = (ref: RefAsyncData.RefAsyncData<number, ApiError>) =>
      RefAsyncData.refresh(ref, load);

    expectTypeOf(refresh).parameter(0).toExtend<RefAsyncData.RefAsyncData<number, ApiError>>();
    expectTypeOf(refresh).returns.toExtend<
      Effect.Effect<AsyncData.AsyncData<number, ApiError>, never, ApiService>
    >();
  });
});
