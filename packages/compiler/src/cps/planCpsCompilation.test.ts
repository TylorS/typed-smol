import { describe, expect, it } from "vitest";
import { planCpsCompilation } from "./planCpsCompilation.js";

describe("planCpsCompilation", () => {
  it("lowers optimized template capabilities into DOM and server continuations", () => {
    const plan = planCpsCompilation({
      moduleId: "/src/components/Button.ts",
      boundary: "template",
      templates: [
        { templateHash: "button", targets: ["dom", "server"], strategy: "optimized-html" },
      ],
      hmr: { eligible: false, services: [], dependencies: [], rejected: [] },
    });

    expect(plan.continuations).toEqual([
      {
        id: "/src/components/Button.ts#template:button:dom",
        kind: "template-output",
        moduleId: "/src/components/Button.ts",
        templateHash: "button",
        target: "dom",
        strategy: "optimized-html",
      },
      {
        id: "/src/components/Button.ts#template:button:server",
        kind: "template-output",
        moduleId: "/src/components/Button.ts",
        templateHash: "button",
        target: "server",
        strategy: "optimized-html",
      },
    ]);
  });

  it("lowers HMR state services after template continuations", () => {
    const plan = planCpsCompilation({
      moduleId: "/src/routes/counter.tsx",
      boundary: "route-component",
      templates: [
        { templateHash: "counter", targets: ["dom", "server"], strategy: "optimized-html" },
      ],
      hmr: {
        eligible: true,
        dependencies: [
          {
            moduleId: "/src/routes/counter/state.ts",
            reason: "imported",
            serviceIds: ["@app/Count"],
            fingerprint: "/src/routes/counter/state.ts:@app/Count",
          },
        ],
        rejected: [],
        services: [
          {
            moduleId: "/src/routes/counter.tsx",
            serviceId: "/src/routes/counter.tsx#count",
            shapeFingerprint: "inline-refsubject:count:0",
            dependencyFingerprints: ["/src/routes/counter/state.ts:@app/Count"],
            compatibilityFingerprint: "route",
            version: "1",
          },
          {
            moduleId: "/src/routes/counter/state.ts",
            serviceId: "@app/Count",
            shapeFingerprint: "/src/routes/counter/state.ts:@app/Count",
            dependencyFingerprints: [],
            compatibilityFingerprint: "dependency",
            version: "1",
          },
        ],
      },
    });

    expect(plan.continuations.map((continuation) => continuation.kind)).toEqual([
      "template-output",
      "template-output",
      "hmr-state",
      "hmr-state",
    ]);
    expect(plan.continuations.slice(2)).toEqual([
      {
        id: "/src/routes/counter.tsx#hmr:/src/routes/counter.tsx#count",
        kind: "hmr-state",
        moduleId: "/src/routes/counter.tsx",
        serviceId: "/src/routes/counter.tsx#count",
        shapeFingerprint: "inline-refsubject:count:0",
        dependencyFingerprints: ["/src/routes/counter/state.ts:@app/Count"],
        compatibilityFingerprint: "route",
        version: "1",
      },
      {
        id: "/src/routes/counter/state.ts#hmr:@app/Count",
        kind: "hmr-state",
        moduleId: "/src/routes/counter/state.ts",
        serviceId: "@app/Count",
        shapeFingerprint: "/src/routes/counter/state.ts:@app/Count",
        dependencyFingerprints: [],
        compatibilityFingerprint: "dependency",
        version: "1",
      },
    ]);
  });

  it("keeps HMR diagnostics without creating state continuations", () => {
    const plan = planCpsCompilation({
      moduleId: "/src/routes/counter.tsx",
      boundary: "route-component",
      templates: [],
      hmr: {
        eligible: false,
        services: [],
        dependencies: [],
        rejected: [{ moduleId: "/src/routes/counter.tsx", reason: "explicit-opt-out" }],
      },
    });

    expect(plan.continuations).toEqual([]);
    expect(plan.diagnostics).toEqual([
      {
        code: "hmr-rejected",
        moduleId: "/src/routes/counter.tsx",
        reason: "explicit-opt-out",
      },
    ]);
  });
});
