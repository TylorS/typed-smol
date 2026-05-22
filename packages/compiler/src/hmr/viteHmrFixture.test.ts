import { describe, expect, it } from "vitest";
import { analyzeComponentHmr } from "./analyzeComponentHmr.js";
import { analyzeDependencyHmr } from "./dependencies.js";
import { emitViteHmrRuntime, planViteHmrBoundary, type ViteHmrServicePlan } from "./viteHmr.js";

describe("Vite HMR fixture", () => {
  it("keeps route and dependency service state across compatible reloads", () => {
    const first = planCounterBoundary({ routeText: "Count: ${count}" });
    const next = planCounterBoundary({ routeText: "Total: ${count}" });
    const store = new Map<string, StoreEntry>();

    const routeState = getFixtureState(first.services[0], () => ({ count: 1 }), store);
    const depState = getFixtureState(first.services[1], () => ({ value: 1 }), store);
    const routeReloaded = getFixtureState(next.services[0], () => ({ count: 2 }), store);
    const depReloaded = getFixtureState(next.services[1], () => ({ value: 2 }), store);

    expect(routeReloaded).toBe(routeState);
    expect(depReloaded).toBe(depState);
  });

  it("does not preserve dependency state when the dependency opts out", () => {
    const boundary = planCounterBoundary({ optOutDependency: true });

    expect(boundary.services.map((service) => service.serviceId)).toEqual([
      "/src/routes/counter.tsx#count",
    ]);
    expect(boundary.rejected).toEqual([
      { moduleId: "/src/routes/counter/state.ts", reason: "explicit-opt-out" },
    ]);
  });

  it("initializes fresh state when dependency fingerprints change", () => {
    const first = planCounterBoundary({ dependencyServiceId: "@app/routes/counter/Count" });
    const next = planCounterBoundary({ dependencyServiceId: "@app/routes/counter/CountV2" });
    const store = new Map<string, StoreEntry>();

    const state = getFixtureState(first.services[0], () => ({ count: 1 }), store);
    const reloaded = getFixtureState(next.services[0], () => ({ count: 2 }), store);

    expect(reloaded).not.toBe(state);
    expect(reloaded.count).toBe(2);
  });

  it("emits Vite hot accept and dispose hooks backed by the app HMR registry", () => {
    const boundary = planCounterBoundary({});
    const source = emitViteHmrRuntime(boundary);

    expect(source).toContain('from "@typed/app"');
    expect(source).toContain("import.meta");
    expect(source).toContain("__typedHot.accept()");
    expect(source).toContain("__typedHot.dispose");
    expect(source).toContain("getOrCreateHmrState");
    expect(source).toContain("pruneHmrState");
  });
});

interface CounterBoundaryOptions {
  readonly routeText?: string;
  readonly dependencyServiceId?: string;
  readonly optOutDependency?: boolean;
}

interface StoreEntry {
  readonly fingerprint: string;
  readonly value: { readonly count?: number; readonly value?: number };
}

function planCounterBoundary(options: CounterBoundaryOptions) {
  const dependencyServiceId = options.dependencyServiceId ?? "@app/routes/counter/Count";
  const route = analyzeComponentHmr({
    boundary: "route-component",
    moduleId: "/src/routes/counter.tsx",
    sourceText: `
      export const Counter = Fx.gen(function*() {
        const count = yield* RefSubject.make(0);
        return html\`<button>${options.routeText ?? "Count: ${count}"}</button>\`;
      });
    `,
  });
  const dependencies = analyzeDependencyHmr({
    routeModuleId: "/src/routes/counter.tsx",
    dependencies: [
      {
        moduleId: "/src/routes/counter/state.ts",
        optOut: options.optOutDependency,
        reason: "imported",
        sourceText: `
          export const Count = RefSubject.Service<number>()("${dependencyServiceId}");
        `,
      },
    ],
  });

  return planViteHmrBoundary({ dependencies, route });
}

function getFixtureState(
  service: ViteHmrServicePlan,
  create: () => StoreEntry["value"],
  store: Map<string, StoreEntry>,
) {
  const key = `${service.moduleId}:${service.serviceId}`;
  const entry = store.get(key);
  if (entry?.fingerprint === service.compatibilityFingerprint) return entry.value;
  const value = create();
  store.set(key, { fingerprint: service.compatibilityFingerprint, value });
  return value;
}
