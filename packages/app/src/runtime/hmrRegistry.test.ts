import { describe, expect, it } from "vitest";
import {
  disposeHmrState,
  getOrCreateHmrState,
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
});
