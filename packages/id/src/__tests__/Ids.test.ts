import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TestClock } from "effect/testing";
import { describe, expect, it, vi } from "vitest";
import { DateTimes } from "../DateTimes.js";
import { Ids, type TestOptions } from "../Ids.js";
import { uuid7, Uuid7State } from "../Uuid7.js";
import { seededRandomValues } from "./helpers.js";

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const decodeUlidTime = (ulid: string): number => {
  let time = 0n;
  for (const character of ulid.slice(0, 10)) {
    time = time * 32n + BigInt(ULID_ALPHABET.indexOf(character));
  }
  return Number(time);
};

const decodeUuid7Time = (uuid: string): number =>
  Number(BigInt(`0x${uuid.slice(0, 8)}${uuid.slice(9, 13)}`));

const vector = Effect.gen(function* () {
  const cuid = yield* Ids.cuid;
  const ksuid = yield* Ids.ksuid;
  const nanoId = yield* Ids.nanoId;
  const ulid = yield* Ids.ulid;
  const uuid4 = yield* Ids.uuid4;
  const uuid7 = yield* Ids.uuid7;
  return [cuid, ksuid, nanoId, ulid, uuid4, uuid7] as const;
});

const runVector = (options: TestOptions) =>
  Effect.runPromise(Effect.provide(vector, Ids.Test(options)));

const uuid7OnlyTestLayer = (currentTime: number) => {
  const services = Layer.mergeAll(
    DateTimes.Fixed(currentTime),
    seededRandomValues("@typed/id/Ids.Test"),
  ).pipe(Layer.provideMerge(TestClock.layer({})));

  return Layer.effect(Uuid7State, Uuid7State.make).pipe(
    Layer.provide(services),
    Layer.provideMerge(services),
  );
};

describe("Ids.Test", () => {
  it("shares its fixed DateTimes service with facade time-based generators", async () => {
    const currentTime = 1_700_000_000_123;
    const program = Effect.gen(function* () {
      const now = yield* DateTimes.now;
      const ulid = yield* Ids.ulid;
      const uuid7 = yield* Ids.uuid7;
      return { now, ulid, uuid7 };
    });

    const result = await Effect.runPromise(Effect.provide(program, Ids.Test({ currentTime })));

    expect(result.now).toBe(currentTime);
    expect(decodeUlidTime(result.ulid)).toBe(currentTime);
    expect(decodeUuid7Time(result.uuid7)).toBe(currentTime);
  });

  it("reproduces the sequential random-format vector with its internal seed", async () => {
    const options = { currentTime: 1_700_000_000_123 } as const;
    const first = await runVector(options);
    const second = await runVector(options);

    expect(second).toEqual(first);
  });

  it("does not initialize Cuid state for a UUID7-only consumer", async () => {
    const currentTime = 1_700_000_000_123;
    const facade = await Effect.runPromise(Effect.provide(Ids.uuid7, Ids.Test({ currentTime })));
    const direct = await Effect.runPromise(Effect.provide(uuid7, uuid7OnlyTestLayer(currentTime)));

    expect(facade).toBe(direct);
  });

  it("does not initialize Cuid state under Ids.Default for a UUID7-only consumer", async () => {
    const getRandomValues = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementation((view) => view);

    try {
      await Effect.runPromise(Effect.provide(Ids.uuid7, Ids.Default));
      expect(getRandomValues.mock.calls.map(([view]) => view.byteLength)).toEqual([16]);
    } finally {
      getRandomValues.mockRestore();
    }
  });
});
