import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { get } from "svelte/store";
import { toReadable, toWritable } from "../lib/index.js";

describe("Svelte stores", () => {
  it("exposes a non-failing Fx as a scoped readable store", async () => {
    await Effect.gen(function* () {
      const source = yield* RefSubject.make(0);
      const store = yield* toReadable(source, -1);

      expect(get(store)).toBe(-1);

      yield* Effect.sleep("10 millis");
      expect(get(store)).toBe(0);

      yield* RefSubject.set(source, 1);
      yield* Effect.sleep("10 millis");

      expect(get(store)).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("keeps a RefSubject and writable store synchronized", async () => {
    await Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const store = yield* toWritable(ref);

      store.set(1);
      expect(get(store)).toBe(1);

      yield* Effect.sleep("10 millis");
      expect(yield* ref).toBe(1);

      yield* RefSubject.set(ref, 2);
      yield* Effect.sleep("10 millis");

      expect(get(store)).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise);
  });
});
