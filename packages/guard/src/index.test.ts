import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as ServiceMap from "effect/ServiceMap";
import { describe, expect, it } from "vitest";
import {
  addTag,
  any,
  bind,
  bindTo,
  catchAll,
  catchTag,
  decode,
  encode,
  filter,
  filterMap,
  fromSchemaDecode,
  fromSchemaEncode,
  getGuard,
  Guard,
  liftPredicate,
  map,
  mapEffect,
  pipe,
  provideService,
  tap,
  Guard as GuardNamespace,
} from "./index.js";

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect);

describe("@typed/guard", () => {
  describe("getGuard", () => {
    it("returns the guard when given a Guard function", () => {
      const g: Guard<number, number> = (n) => Effect.succeed(Option.some(n));
      expect(getGuard(g)).toBe(g);
    });

    it("returns asGuard() when given an AsGuard", () => {
      const inner: Guard<string, number> = (s) => Effect.succeed(Option.some(Number(s)));
      const asGuard = { asGuard: () => inner };
      expect(getGuard(asGuard)).toBe(inner);
    });
  });

  describe("liftPredicate", () => {
    it("returns Some when predicate holds", async () => {
      const g = liftPredicate((n: number) => n > 0);
      const result = await run(g(42));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(42);
    });

    it("returns None when predicate fails", async () => {
      const g = liftPredicate((n: number) => n > 0);
      const result = await run(g(-1));
      expect(Option.isNone(result)).toBe(true);
    });

    it("supports refinements (narrowing type)", async () => {
      const g = liftPredicate((s: string): s is `ok_${string}` => s.startsWith("ok_"));
      const result = await run(g("ok_foo"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe("ok_foo");
      const none = await run(g("nope"));
      expect(Option.isNone(none)).toBe(true);
    });
  });

  describe("pipe", () => {
    it("chains two guards: second runs on first output", async () => {
      const g1 = liftPredicate((n: number) => n >= 0);
      const g2 = liftPredicate((n: number) => n < 100);
      const chained = pipe(g1, g2);
      const some = await run(chained(50));
      expect(Option.isSome(some)).toBe(true);
      if (Option.isSome(some)) expect(some.value).toBe(50);
      const none = await run(chained(150));
      expect(Option.isNone(none)).toBe(true);
    });

    it("returns None when first guard returns None", async () => {
      const g1 = liftPredicate((n: number) => n > 0);
      const g2 = liftPredicate((n: number) => n < 10);
      const chained = pipe(g1, g2);
      const result = await run(chained(-1));
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe("map", () => {
    it("maps the output of a guard", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const g = map(base, (n) => n * 2);
      const result = await run(g(3));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(6);
    });

    it("preserves None", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const g = map(base, (n) => n * 2);
      const result = await run(g(-1));
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe("mapEffect", () => {
    it("maps output with an Effect", async () => {
      const base = liftPredicate((s: string) => s.length > 0);
      const g = mapEffect(base, (s) => Effect.succeed(s.toUpperCase()));
      const result = await run(g("hello"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe("HELLO");
    });

    it("fails when the effect fails", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const g = mapEffect(base, (n) =>
        n > 10 ? Effect.fail("too big" as const) : Effect.succeed(n),
      );
      await expect(run(g(20))).rejects.toBe("too big");
    });
  });

  describe("tap", () => {
    it("runs side effect and returns original value", async () => {
      let side = 0;
      const base = liftPredicate((n: number) => n > 0);
      const g = tap(base, (n) =>
        Effect.sync(() => {
          side = n;
        }),
      );
      const result = await run(g(7));
      expect(side).toBe(7);
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(7);
    });
  });

  describe("filter", () => {
    it("keeps output when predicate holds", async () => {
      const base = liftPredicate((n: number) => n >= 0);
      const g = filter(base, (n) => n < 100);
      const result = await run(g(50));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(50);
    });

    it("returns None when predicate fails", async () => {
      const base = liftPredicate((n: number) => n >= 0);
      const g = filter(base, (n) => n < 100);
      const result = await run(g(200));
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe("filterMap", () => {
    it("transforms to Some when f returns Some", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const g = filterMap(base, (n) => (n % 2 === 0 ? Option.some(n / 2) : Option.none()));
      const result = await run(g(4));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(2);
    });

    it("returns None when f returns None", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const g = filterMap(base, (n) => (n % 2 === 0 ? Option.some(n) : Option.none()));
      const result = await run(g(3));
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe("any", () => {
    it("returns first matching guard result with _tag and value", async () => {
      const guards = {
        num: liftPredicate((x: number) => typeof x === "number" && x >= 0),
        str: liftPredicate((x: string) => typeof x === "string" && x.length > 0),
      };
      const g = any(guards);
      const numResult = await run(g(42 as number | string));
      expect(Option.isSome(numResult)).toBe(true);
      if (Option.isSome(numResult)) {
        expect(numResult.value._tag).toBe("num");
        expect(numResult.value.value).toBe(42);
      }
      const strResult = await run(g("hi" as number | string));
      expect(Option.isSome(strResult)).toBe(true);
      if (Option.isSome(strResult)) {
        expect(strResult.value._tag).toBe("str");
        expect(strResult.value.value).toBe("hi");
      }
    });

    it("returns None when no guard matches", async () => {
      const guards = {
        pos: liftPredicate((n: number) => n > 0),
        neg: liftPredicate((n: number) => n < 0),
      };
      const g = any(guards);
      const result = await run(g(0));
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe("catchAll", () => {
    it("recovers from failure with a value", async () => {
      const failing: Guard<number, number, string> = (n) =>
        n > 0 ? Effect.succeed(Option.some(n)) : Effect.fail("negative");
      const g = catchAll(failing, () => Effect.succeed(0));
      const ok = await run(g(5));
      expect(Option.isSome(ok)).toBe(true);
      if (Option.isSome(ok)) expect(ok.value).toBe(5);
      const recovered = await run(g(-1));
      expect(Option.isSome(recovered)).toBe(true);
      if (Option.isSome(recovered)) expect(recovered.value).toBe(0);
    });
  });

  describe("catchTag", () => {
    it("catches tagged errors", async () => {
      type E = { _tag: "Bad"; n: number } | { _tag: "Other" };
      const failing: Guard<number, number, E> = (n) =>
        n >= 0 ? Effect.succeed(Option.some(n)) : Effect.fail({ _tag: "Bad" as const, n });
      const g = catchTag(failing, "Bad", (e) => Effect.succeed(-e.n));
      const ok = await run(g(3));
      expect(Option.isSome(ok)).toBe(true);
      if (Option.isSome(ok)) expect(ok.value).toBe(3);
      const recovered = await run(g(-10));
      expect(Option.isSome(recovered)).toBe(true);
      if (Option.isSome(recovered)) expect(recovered.value).toBe(10);
    });
  });

  describe("fromSchemaDecode / fromSchemaEncode", () => {
    const NumberFromString = Schema.NumberFromString;

    it("fromSchemaDecode passes decoded value as Some", async () => {
      const g = fromSchemaDecode(NumberFromString);
      const result = await run(g("42"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(42);
    });

    it("fromSchemaDecode returns Some(NaN) for non-numeric string (NumberFromString behavior)", async () => {
      const g = fromSchemaDecode(NumberFromString);
      const result = await run(g("not a number"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(Number.isNaN(result.value)).toBe(true);
    });

    it("fromSchemaEncode passes encoded value as Some", async () => {
      const g = fromSchemaEncode(NumberFromString);
      const result = await run(g(42));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe("42");
    });
  });

  describe("decode / encode", () => {
    const NumberFromString = Schema.NumberFromString;

    it("decode pipes guard output through schema decode", async () => {
      const base = liftPredicate((s: string) => s.length > 0);
      const g = decode(base, NumberFromString);
      const result = await run(g("99"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(99);
    });

    it("encode pipes guard output through schema encode", async () => {
      const base = liftPredicate((n: number) => n >= 0);
      const g = encode(base, NumberFromString);
      const result = await run(g(17));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe("17");
    });
  });

  describe("let / addTag", () => {
    it("let attaches a property to the output", async () => {
      const { let: let_ } = await import("./index.js");
      const base = liftPredicate((n: number) => n > 0);
      const g = let_(base, "doubled", 0);
      const result = await run(g(3));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect((result.value as { doubled: number }).doubled).toBe(0);
      }
      const base2 = map(
        liftPredicate((n: number) => n > 0),
        (n) => ({ n }),
      );
      const g2 = let_(base2, "doubled", 2);
      const r2 = await run(g2(3));
      expect(Option.isSome(r2)).toBe(true);
      if (Option.isSome(r2)) {
        expect((r2.value as { n: number; doubled: number }).n).toBe(3);
        expect((r2.value as { n: number; doubled: number }).doubled).toBe(2);
      }
    });

    it("addTag attaches _tag to output", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const g = addTag(base, "Positive");
      const result = await run(g(3));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect((result.value as { _tag: string })._tag).toBe("Positive");
      }
    });
  });

  describe("bindTo / bind", () => {
    it("bindTo names the output under a key", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const g = bindTo(base, "value");
      const result = await run(g(5));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect((result.value as { value: number }).value).toBe(5);
      }
    });

    it("bind chains and merges object", async () => {
      const base = liftPredicate((n: number) => n > 0);
      const withA = bindTo(base, "a");
      const g = bind(withA, "b", (ctx) => liftPredicate((n: number) => n < 10)(ctx.a));
      const result = await run(g(5));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect((result.value as { a: number; b: number }).a).toBe(5);
        expect((result.value as { a: number; b: number }).b).toBe(5);
      }
      const none = await run(g(20));
      expect(Option.isNone(none)).toBe(true);
    });
  });

  describe("provideService", () => {
    it("provides a service so the guard no longer requires it", async () => {
      const Foo = ServiceMap.Service<{ readonly n: number }>("Test/Foo");
      const guardNeedsFoo: Guard<
        number,
        number,
        never,
        ServiceMap.Service.Identifier<typeof Foo>
      > = (i) =>
        Effect.flatMap(Effect.service(Foo), (foo) => Effect.succeed(Option.some(i + foo.n)));
      const g = provideService(guardNeedsFoo, Foo, { n: 10 });
      const result = await run(g(1));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(11);
    });
  });

  describe("Guard namespace types", () => {
    it("Guard.Input/Output infer from guard", () => {
      const g: Guard<string, number> = (s) => Effect.succeed(Option.some(Number(s)));
      type In = GuardNamespace.Input<typeof g>;
      type Out = GuardNamespace.Output<typeof g>;
      const _in: In = "1";
      const _out: Out = 1;
      expect(_in).toBe("1");
      expect(_out).toBe(1);
    });
  });
});
