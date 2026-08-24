import { assert, describe, it } from "vitest";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import * as Fx from "../../Fx.js";
import * as RefSubject from "../RefSubject.js";

describe("RefSubject hydration", () => {
  it("keeps make arguments after the leading Schema and honors options.eq", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.hydrate(Schema.Number, Effect.succeed(1), {
        eq: () => true,
      });

      assert.strictEqual(yield* ref, 1);
      assert.strictEqual(typeof ref.hydrateFromElement, "function");
      yield* RefSubject.set(ref, 1);
      const version = yield* ref.version;

      yield* RefSubject.set(ref, 2);
      assert.strictEqual(yield* ref.version, version);
      assert.strictEqual(yield* ref, 2);
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("derives equality from the Schema by default", () =>
    Effect.gen(function* () {
      const Value = Schema.Struct({ count: Schema.Number });
      const initial = { count: 1 };
      const ref = yield* RefSubject.hydrate(Value, initial);
      yield* RefSubject.set(ref, initial);
      const version = yield* ref.version;

      yield* RefSubject.set(ref, { count: 1 });

      assert.strictEqual(yield* ref.version, version);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses the DOM value as the first initialization without evaluating an Effect initializer", () =>
    Effect.gen(function* () {
      let initialized = 0;
      const ref = yield* RefSubject.hydrate(
        Schema.Number,
        Effect.sync(() => {
          initialized++;
          return 0;
        }),
      );
      const values: number[] = [];
      yield* Effect.forkChild(Fx.observe(ref, (value) => values.push(value)));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(initialized, 0);
      assert.deepStrictEqual(values, []);

      yield* ref.hydrateFromElement(makeElement('{"version":1,"values":[7]}'));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(initialized, 0);
      assert.deepStrictEqual(values, [7]);
      assert.strictEqual(yield* ref, 7);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("initializes from the DOM before continuing with an Fx", () =>
    Effect.gen(function* () {
      const release = yield* Deferred.make<void>();
      let started = 0;
      const source = Fx.make<number>((sink) =>
        Effect.gen(function* () {
          yield* Effect.sync(() => started++);
          yield* Deferred.await(release);
          yield* sink.onSuccess(0);
          yield* sink.onSuccess(1);
        }),
      );
      const ref = yield* RefSubject.hydrate(Schema.Number, source);
      const values: number[] = [];
      yield* Effect.forkChild(Fx.observe(ref, (value) => values.push(value)));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 0);
      assert.deepStrictEqual(values, []);

      yield* ref.hydrateFromElement(makeElement('{"version":1,"values":[7]}'));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 1);
      assert.deepStrictEqual(values, [7]);

      yield* Deferred.succeed(release, undefined);
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.deepStrictEqual(values, [7, 0, 1]);
      assert.strictEqual(yield* ref, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("initializes from the DOM before continuing with a Stream", () =>
    Effect.gen(function* () {
      const release = yield* Deferred.make<void>();
      let started = 0;
      const source = Stream.unwrap(
        Effect.gen(function* () {
          yield* Effect.sync(() => started++);
          yield* Deferred.await(release);
          return Stream.fromIterable([0, 1]);
        }),
      );
      const ref = yield* RefSubject.hydrate(Schema.Number, source);
      const values: number[] = [];
      yield* Effect.forkChild(Fx.observe(ref, (value) => values.push(value)));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 0);
      assert.deepStrictEqual(values, []);

      yield* ref.hydrateFromElement(makeElement('{"version":1,"values":[7]}'));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 1);
      assert.deepStrictEqual(values, [7]);

      yield* Deferred.succeed(release, undefined);
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.deepStrictEqual(values, [7, 0, 1]);
      assert.strictEqual(yield* ref, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses the original Fx and Stream initializers for server serialization", () =>
    Effect.gen(function* () {
      const fx = yield* RefSubject.hydrate(Schema.Number, Fx.fromIterable([1]));
      const stream = yield* RefSubject.hydrate(Schema.Number, Stream.fromIterable([2]));

      const encoded = yield* RefSubject.hydrateAll(fx, stream)[RefSubject.HydrationRefTypeId]
        .toAttribute;

      assert.strictEqual(encoded, '{"version":1,"values":[1,2]}');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses the original Fx and Stream initializers when DOM metadata is absent", () =>
    Effect.gen(function* () {
      const fx = yield* RefSubject.hydrate(Schema.Number, Fx.fromIterable([1, 2]));
      const stream = yield* RefSubject.hydrate(Schema.Number, Stream.fromIterable([3, 4]));

      yield* RefSubject.hydrateAll(fx, stream)(makeElement(null));

      assert.strictEqual(yield* fx, 2);
      assert.strictEqual(yield* stream, 4);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("round-trips transformed values through the hydration attribute", () =>
    Effect.gen(function* () {
      const Value = Schema.Struct({ at: Schema.Date, total: Schema.BigInt });
      const server = yield* RefSubject.hydrate(Value, {
        at: new Date("2026-08-21T00:00:00.000Z"),
        total: 42n,
      });
      const encoded = yield* server.hydrateFromElement[RefSubject.HydrationRefTypeId].toAttribute;
      const element = makeElement(encoded);
      const client = yield* RefSubject.hydrate(Value, { at: new Date(0), total: 0n });

      yield* client.hydrateFromElement(element);

      assert.deepStrictEqual(yield* client, {
        at: new Date("2026-08-21T00:00:00.000Z"),
        total: 42n,
      });
      assert.strictEqual(element.getAttribute(RefSubject.HYDRATION_ATTRIBUTE), null);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves the make initializer when hydration metadata is absent", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.hydrate(Schema.Number, 3);

      yield* ref.hydrateFromElement(makeElement(null));

      assert.strictEqual(yield* ref, 3);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates a composed tuple in argument order", () =>
    Effect.gen(function* () {
      const serverCount = yield* RefSubject.hydrate(Schema.Number, 2);
      const serverWhen = yield* RefSubject.hydrate(
        Schema.Date,
        new Date("2026-08-21T12:00:00.000Z"),
      );
      const encoded = yield* RefSubject.hydrateAll(serverCount, serverWhen)[
        RefSubject.HydrationRefTypeId
      ].toAttribute;

      const clientCount = yield* RefSubject.hydrate(Schema.Number, 0);
      const clientWhen = yield* RefSubject.hydrate(Schema.Date, new Date(0));
      yield* RefSubject.hydrateAll(clientCount, clientWhen)(makeElement(encoded));

      assert.strictEqual(yield* clientCount, 2);
      assert.strictEqual((yield* clientWhen).toISOString(), "2026-08-21T12:00:00.000Z");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not partially apply a malformed composed tuple", () =>
    Effect.gen(function* () {
      const count = yield* RefSubject.hydrate(Schema.Number, 0);
      const when = yield* RefSubject.hydrate(Schema.Date, new Date(0));
      const seenCounts: number[] = [];
      const seenDates: Date[] = [];
      yield* Effect.forkChild(Fx.observe(count, (value) => seenCounts.push(value)));
      yield* Effect.forkChild(Fx.observe(when, (value) => seenDates.push(value)));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      const element = makeElement('{"version":1,"values":[2,"not-a-date"]}');
      yield* RefSubject.hydrateAll(count, when)(element);
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.deepStrictEqual(seenCounts, []);
      assert.deepStrictEqual(seenDates, []);
      assert.notStrictEqual(element.getAttribute(RefSubject.HYDRATION_ATTRIBUTE), null);
      assert.strictEqual(Exit.isFailure(yield* Effect.exit(count)), true);
      assert.strictEqual(Exit.isFailure(yield* Effect.exit(when)), true);
    }).pipe(Effect.scoped, Effect.runPromise));
});

function makeElement(initial: string | null): RefSubject.HydrationElement {
  let value: string | null = initial;
  return {
    getAttribute: (name) => (name === RefSubject.HYDRATION_ATTRIBUTE ? value : null),
    removeAttribute: (name) => {
      if (name === RefSubject.HYDRATION_ATTRIBUTE) value = null;
    },
  };
}
