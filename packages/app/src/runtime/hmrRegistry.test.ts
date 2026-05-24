import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import {
  disposeHmrState,
  getOrCreateHmrState,
  getOrCreateHmrStateEffect,
  getOrCreateRefSubjectHmrService,
  pruneHmrState,
  typedHmrRegistryKey,
  type HmrStateDescriptor,
} from "./hmrRegistry.js";

const descriptor = (overrides: Partial<HmrStateDescriptor> = {}): HmrStateDescriptor => ({
  moduleId: "/src/routes/counter.ts",
  serviceId: "@app/routes/counter/Count",
  shapeFingerprint: "count:number",
  dependencyFingerprints: ["dep:a"],
  version: "1",
  ...overrides,
});

describe("hmrRegistry", () => {
  it("reuses compatible service state from hot data and global registry", () => {
    const hotData: Record<string, unknown> = {};
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = { count: 1 };

    const created = getOrCreateHmrState(descriptor(), () => first, { hotData, globalObject });
    const reused = getOrCreateHmrState(descriptor(), () => ({ count: 2 }), {
      hotData: {},
      globalObject,
    });

    expect(created).toBe(first);
    expect(reused).toBe(first);
    expect(hotData[typedHmrRegistryKey]).toBe(globalObject[typedHmrRegistryKey]);
  });

  it("creates fresh state when the shape fingerprint changes", () => {
    const disposed: string[] = [];
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = getOrCreateHmrState(descriptor(), () => ({ count: 1 }), {
      globalObject,
      onDispose: () => disposed.push("old"),
    });

    const next = getOrCreateHmrState(
      descriptor({ shapeFingerprint: "count:string" }),
      () => ({ count: 2 }),
      { globalObject },
    );

    expect(next).not.toBe(first);
    expect(next.count).toBe(2);
    expect(disposed).toEqual(["old"]);
  });

  it("invalidates state when dependency fingerprints change", () => {
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = getOrCreateHmrState(descriptor(), () => ({ count: 1 }), { globalObject });
    const next = getOrCreateHmrState(
      descriptor({ dependencyFingerprints: ["dep:b"] }),
      () => ({ count: 2 }),
      { globalObject },
    );

    expect(next).not.toBe(first);
  });

  it("separates compatible service state by generated symbol identity", () => {
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = getOrCreateHmrState(
      descriptor({
        captureFingerprint: "capture:a",
        symbolId: "/src/routes/counter.ts#closure:increment",
      }),
      () => ({ count: 1 }),
      { globalObject },
    );
    const second = getOrCreateHmrState(
      descriptor({
        captureFingerprint: "capture:a",
        symbolId: "/src/routes/counter.ts#closure:decrement",
      }),
      () => ({ count: 2 }),
      { globalObject },
    );

    expect(second).not.toBe(first);
    expect(second.count).toBe(2);
  });

  it("disposes and prunes registry entries", () => {
    const disposed: string[] = [];
    const globalObject: Record<PropertyKey, unknown> = {};

    getOrCreateHmrState(descriptor(), () => ({ count: 1 }), {
      globalObject,
      onDispose: () => disposed.push("counter"),
    });
    getOrCreateHmrState(
      descriptor({ moduleId: "/src/routes/other.ts", serviceId: "@app/routes/other/Value" }),
      () => ({ count: 2 }),
      { globalObject, onDispose: () => disposed.push("other") },
    );

    disposeHmrState(descriptor(), { globalObject });
    pruneHmrState((entry) => entry.moduleId === "/src/routes/other.ts", { globalObject });

    expect(disposed).toEqual(["counter", "other"]);
    expect(getOrCreateHmrState(descriptor(), () => ({ count: 3 }), { globalObject }).count).toBe(3);
  });

  it("returns fresh state and avoids globals when disabled", () => {
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = getOrCreateHmrState(descriptor(), () => ({ count: 1 }), {
      enabled: false,
      globalObject,
    });
    const second = getOrCreateHmrState(descriptor(), () => ({ count: 2 }), {
      enabled: false,
      globalObject,
    });

    expect(second).not.toBe(first);
    expect(globalObject[typedHmrRegistryKey]).toBeUndefined();
  });

  it("reuses compatible effect-created state after the first creation", async () => {
    const globalObject: Record<PropertyKey, unknown> = {};
    const created: number[] = [];

    const first = await Effect.runPromise(
      getOrCreateHmrStateEffect(
        descriptor({ serviceId: "/src/routes/ui.ts#select" }),
        () =>
          Effect.sync(() => {
            created.push(1);
            return { value: "apple" };
          }),
        { globalObject },
      ),
    );
    const second = await Effect.runPromise(
      getOrCreateHmrStateEffect(
        descriptor({ serviceId: "/src/routes/ui.ts#select" }),
        () =>
          Effect.sync(() => {
            created.push(2);
            return { value: "banana" };
          }),
        { globalObject },
      ),
    );

    expect(second).toBe(first);
    expect(created).toEqual([1]);
  });

  it("reuses compatible RefSubject service state through the dedicated helper", () => {
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = { current: 1 };
    const created = getOrCreateRefSubjectHmrService(descriptor(), () => first, { globalObject });
    const reused = getOrCreateRefSubjectHmrService(descriptor(), () => ({ current: 2 }), {
      globalObject,
    });

    expect(created).toBe(first);
    expect(reused).toBe(first);
  });

  it("disposes incompatible RefSubject service state through the dedicated helper", () => {
    const disposed: string[] = [];
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = getOrCreateRefSubjectHmrService(descriptor(), () => ({ current: 1 }), {
      globalObject,
      onDispose: () => disposed.push("count"),
    });
    const next = getOrCreateRefSubjectHmrService(
      descriptor({ contextFingerprint: "context:changed" }),
      () => ({ current: 2 }),
      { globalObject },
    );

    expect(next).not.toBe(first);
    expect(disposed).toEqual(["count"]);
  });
});
