import { describe, expect, it } from "vitest";
import {
  disposeHmrState,
  getOrCreateHmrState,
  pruneHmrState,
  typedHmrRegistryKey,
  type HmrStateDescriptor,
} from "./hmrRegistry.js";

const descriptor = (overrides: Partial<HmrStateDescriptor> = {}): HmrStateDescriptor => ({
  dependencyFingerprints: ["dep:a"],
  moduleId: "/src/routes/counter.tsx",
  serviceId: "@app/routes/counter/Count",
  shapeFingerprint: "count:number",
  version: "1",
  ...overrides,
});

describe("runtime template HMR registry", () => {
  it("reuses compatible service state from hot data and global registry", () => {
    const hotData: Record<string, unknown> = {};
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = { count: 1 };

    const created = getOrCreateHmrState(descriptor(), () => first, { hotData, globalObject });
    const reused = getOrCreateHmrState(descriptor(), () => ({ count: 2 }), {
      globalObject,
      hotData: {},
    });

    expect(created).toBe(first);
    expect(reused).toBe(first);
    expect(hotData[typedHmrRegistryKey]).toBe(globalObject[typedHmrRegistryKey]);
  });

  it("invalidates state when shape or dependency fingerprints change", () => {
    const globalObject: Record<PropertyKey, unknown> = {};
    const first = getOrCreateHmrState(descriptor(), () => ({ count: 1 }), { globalObject });
    const shapeChanged = getOrCreateHmrState(
      descriptor({ shapeFingerprint: "count:string" }),
      () => ({ count: 2 }),
      { globalObject },
    );
    const dependencyChanged = getOrCreateHmrState(
      descriptor({ dependencyFingerprints: ["dep:b"] }),
      () => ({ count: 3 }),
      { globalObject },
    );

    expect(shapeChanged).not.toBe(first);
    expect(dependencyChanged).not.toBe(shapeChanged);
  });

  it("disposes and prunes registry entries", () => {
    const disposed: string[] = [];
    const globalObject: Record<PropertyKey, unknown> = {};

    getOrCreateHmrState(descriptor(), () => ({ count: 1 }), {
      globalObject,
      onDispose: () => disposed.push("counter"),
    });
    getOrCreateHmrState(
      descriptor({ moduleId: "/src/routes/other.tsx", serviceId: "@app/routes/other/Value" }),
      () => ({ count: 2 }),
      { globalObject, onDispose: () => disposed.push("other") },
    );

    disposeHmrState(descriptor(), { globalObject });
    pruneHmrState((entry) => entry.moduleId === "/src/routes/other.tsx", { globalObject });

    expect(disposed).toEqual(["counter", "other"]);
  });
});
