import { describe, expect, it } from "vitest";
import { planRouteCpsCompilation } from "../cps/planCpsCompilation.js";
import { analyzeComponentHmr } from "./analyzeComponentHmr.js";
import { analyzeDependencyHmr } from "./dependencies.js";
import { analyzeRouteModule } from "../route/analyzeRouteModule.js";
import {
  emitViteHmrRuntime,
  emitViteRouteHmrGlue,
  planViteHmrBoundary,
  type ViteHmrServicePlan,
} from "./viteHmr.js";

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
      "/src/routes/counter.ts#count",
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

  it("includes route continuation fingerprints in service compatibility", () => {
    const routeFacts = analyzeRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        const Count = RefSubject.Service<number>()("@app/Count");
        export const route = () => {
          const increment = () => Count.onSuccess(1);
          return html\`<button onClick=\${increment}>Count</button>\`;
        };
      `,
    });
    const cps = planRouteCpsCompilation(routeFacts, { version: "test" });
    const route = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "/src/routes/counter.ts",
      sourceText: routeFacts.moduleId,
    });
    const boundary = planViteHmrBoundary({
      continuations: cps.continuations,
      route: {
        ...route,
        eligible: true,
        services: [
          {
            kind: "refsubject-service",
            localName: "Count",
            serviceId: "@app/Count",
          },
        ],
      },
      version: "test",
    });

    expect(boundary.services[0]?.continuationFingerprints).toEqual(
      cps.continuations.map((continuation) => continuation.compatibilityFingerprint).sort(),
    );
    expect(boundary.services[0]?.compatibilityFingerprint).toMatchInlineSnapshot(`"{"continuationFingerprints":["{\\"captureFingerprint\\":\\"captures:refsubject-service:Count:@app/Count\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/counter.ts#closure:increment\\",\\"templateHashes\\":[],\\"version\\":\\"test\\"}","{\\"captureFingerprint\\":\\"captures:refsubject-service:Count:@app/Count\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/counter.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"test\\"}"],"dependencyFingerprints":[],"shapeFingerprint":"refsubject-service:Count:@app/Count","version":"test"}"`);
  });

  it("emits Vite hot accept and dispose hooks backed by the app HMR registry", () => {
    const boundary = planCounterBoundary({});
    const source = emitViteHmrRuntime(boundary);

    expect(source).toMatchInlineSnapshot(`
      "import { getOrCreateHmrState, getOrCreateHmrStateEffect, pruneHmrState, typedHmrRegistryKey, type HmrRegistryEntry } from "@typed/app/runtime/hmrRegistry";
      type __TypedHot = {
        readonly data: Record<string, unknown>;
        readonly accept: () => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
      };
      const __typedHmrDescriptors = [{"continuationFingerprints":[],"dependencyFingerprints":["/src/routes/counter/state.ts:@app/routes/counter/Count"],"moduleId":"/src/routes/counter.ts","serviceId":"/src/routes/counter.ts#count","shapeFingerprint":"inline-refsubject:count:0","version":"1","compatibilityFingerprint":"{\\"continuationFingerprints\\":[],\\"dependencyFingerprints\\":[\\"/src/routes/counter/state.ts:@app/routes/counter/Count\\"],\\"shapeFingerprint\\":\\"inline-refsubject:count:0\\",\\"version\\":\\"1\\"}"},{"continuationFingerprints":[],"dependencyFingerprints":[],"moduleId":"/src/routes/counter/state.ts","serviceId":"@app/routes/counter/Count","shapeFingerprint":"/src/routes/counter/state.ts:@app/routes/counter/Count","version":"1","compatibilityFingerprint":"{\\"continuationFingerprints\\":[],\\"dependencyFingerprints\\":[],\\"shapeFingerprint\\":\\"/src/routes/counter/state.ts:@app/routes/counter/Count\\",\\"version\\":\\"1\\"}"}];
      const __typedHmrModules = new Set(__typedHmrDescriptors.map((item) => item.moduleId));
      const __typedHot = (import.meta as ImportMeta & { readonly hot?: __TypedHot }).hot;
      function __typedHasDescriptor(entry: HmrRegistryEntry): boolean {
        return __typedHmrDescriptors.some((item) => item.moduleId === entry.moduleId && item.serviceId === entry.serviceId);
      }
      export function __typedGetHmrState<A>(serviceId: string, create: () => A): A {
        const descriptor = __typedHmrDescriptors.find((item) => item.serviceId === serviceId);
        return descriptor ? getOrCreateHmrState(descriptor, create, { hotData: __typedHot?.data }) : create();
      }
      export function __typedGetHmrStateEffect<A, E, R>(serviceId: string, create: () => import("effect/Effect").Effect<A, E, R>): import("effect/Effect").Effect<A, E, R> {
        const descriptor = __typedHmrDescriptors.find((item) => item.serviceId === serviceId);
        return descriptor ? getOrCreateHmrStateEffect(descriptor, create, { hotData: __typedHot?.data }) : create();
      }
      if (__typedHot) {
        __typedHot.accept();
        __typedHot.dispose((data) => {
          data[typedHmrRegistryKey] = (globalThis as Record<string, unknown>)[typedHmrRegistryKey];
          pruneHmrState((entry) => __typedHmrModules.has(entry.moduleId) && !__typedHasDescriptor(entry));
        });
      }"
    `);
  });

  it("emits guarded route HMR glue that self-accepts compatible fingerprints", () => {
    const source = emitViteRouteHmrGlue({
      moduleId: "/src/routes/counter.ts",
      compatibilityFingerprint: "route:capture-v1",
    });

    expect(source).toMatchInlineSnapshot(`
      "type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "route:capture-v1";
      const __typedRouteHmrKey = "__typed_route_hmr:/src/routes/counter.ts";
      const __typedRouteHot = (import.meta as ImportMeta & { readonly hot?: __TypedRouteHot }).hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot) {
        __typedRouteHot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/counter.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/counter.ts");
        }
      }"
    `);
  });

  it("keeps generated route HMR glue behind the guarded hot binding", () => {
    const source = emitViteRouteHmrGlue({
      moduleId: "/src/routes/counter.ts",
      compatibilityFingerprint: "route:capture-v1",
    });

    expect(source.match(/import\.meta\.hot/g)).toBeNull();
    expect(source.match(/__typedHot\./g)).toMatchInlineSnapshot(`null`);
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
    moduleId: "/src/routes/counter.ts",
    sourceText: `
      export const Counter = Fx.gen(function*() {
        const count = yield* RefSubject.make(0);
        return html\`<button>${options.routeText ?? "Count: ${count}"}</button>\`;
      });
    `,
  });
  const dependencies = analyzeDependencyHmr({
    routeModuleId: "/src/routes/counter.ts",
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
