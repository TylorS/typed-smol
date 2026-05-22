import * as Effect from "effect/Effect";
import { TestClock } from "effect/testing";
import { describe, expect, it } from "vitest";
import { DateTimes } from "./DateTimes.js";

describe("DateTimes", () => {
  it("Fixed returns the same instant after test clock movement", async () => {
    const result = await Effect.gen(function* () {
      const before = yield* DateTimes.now;
      yield* TestClock.adjust(250);
      const after = yield* DateTimes.now;
      return [before, after] as const;
    }).pipe(
      Effect.provide([DateTimes.Fixed(1000), TestClock.layer()]),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(result).toEqual([1000, 1000]);
  });

  it("Offset returns the base instant plus elapsed test clock movement", async () => {
    const result = await Effect.gen(function* () {
      const before = yield* DateTimes.now;
      yield* TestClock.adjust(250);
      const after = yield* DateTimes.now;
      return [before, after] as const;
    }).pipe(
      Effect.provide(DateTimes.Offset(1000)),
      Effect.provide(TestClock.layer()),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(result).toEqual([1000, 1250]);
  });
});
