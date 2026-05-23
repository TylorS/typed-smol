import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import {
  getOrCreateHmrMemoEffect,
  getOrCreateHmrMemoValue,
  typedHmrMemoMapKey,
} from "./hmrMemoMap.js";

describe("hmrMemoMap", () => {
  it("preserves generated service values through hot data", () => {
    const hotData: Record<string, unknown> = {};
    const first = getOrCreateHmrMemoValue("route#count", () => ({ count: 0 }), { hotData });
    first.count = 1;

    const second = getOrCreateHmrMemoValue("route#count", () => ({ count: 0 }), { hotData });

    expect(second).toBe(first);
    expect(second.count).toBe(1);
    expect(hotData[typedHmrMemoMapKey]).toBeDefined();
  });

  it("preserves effect-created generated service values through hot data", async () => {
    const hotData: Record<string, unknown> = {};
    const first = await Effect.runPromise(
      getOrCreateHmrMemoEffect("route#count", () => Effect.succeed({ count: 0 }), { hotData }),
    );
    first.count = 1;

    const second = await Effect.runPromise(
      getOrCreateHmrMemoEffect("route#count", () => Effect.succeed({ count: 0 }), { hotData }),
    );

    expect(second).toBe(first);
    expect(second.count).toBe(1);
  });
});
