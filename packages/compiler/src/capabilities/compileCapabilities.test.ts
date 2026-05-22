import { describe, expect, it } from "vitest";
import { analyzeComponentHmr } from "../hmr/analyzeComponentHmr.js";
import { analyzeDependencyHmr } from "../hmr/dependencies.js";
import { createTemplatePlan } from "../template/TemplatePlan.js";
import { planCompileCapabilities } from "./compileCapabilities.js";

describe("planCompileCapabilities", () => {
  it("plans optimized DOM and server output for every html template", () => {
    const plan = planCompileCapabilities({
      moduleId: "/src/components/Button.ts",
      boundary: "template",
      templates: [template("button"), template("label")],
    });

    expect(plan.templates).toEqual([
      { templateHash: "button", targets: ["dom", "server"], strategy: "optimized-html" },
      { templateHash: "label", targets: ["dom", "server"], strategy: "optimized-html" },
    ]);
    expect(plan.hmr.eligible).toBe(false);
  });

  it("keeps plain templates optimized only even when they contain RefSubject code", () => {
    const component = analyzeComponentHmr({
      moduleId: "/src/components/Button.ts",
      boundary: "template",
      sourceText: "const count = yield* RefSubject.make(0);",
    });

    const plan = planCompileCapabilities({
      moduleId: "/src/components/Button.ts",
      boundary: "template",
      templates: [template("button")],
      component,
    });

    expect(plan.templates[0]?.strategy).toBe("optimized-html");
    expect(plan.hmr).toEqual({
      eligible: false,
      services: [],
      dependencies: [],
      rejected: [],
    });
  });

  it("plans HMR services for route components and compatible route dependencies", () => {
    const component = analyzeComponentHmr({
      moduleId: "/src/routes/counter.ts",
      boundary: "route-component",
      sourceText: "const count = yield* RefSubject.make(0);",
    });
    const dependencies = analyzeDependencyHmr({
      routeModuleId: "/src/routes/counter.ts",
      dependencies: [
        {
          moduleId: "/src/routes/counter/state.ts",
          reason: "imported",
          sourceText: 'export const Count = RefSubject.Service<number>()("@app/Count");',
        },
      ],
    });

    const plan = planCompileCapabilities({
      moduleId: "/src/routes/counter.ts",
      boundary: "route-component",
      templates: [template("counter")],
      component,
      dependencies,
      hmrVersion: "test",
    });

    expect(plan.hmr.eligible).toBe(true);
    expect(plan.hmr.services.map((service) => service.serviceId)).toEqual([
      "/src/routes/counter.ts#count",
      "@app/Count",
    ]);
    expect(plan.hmr.dependencies).toEqual([
      {
        moduleId: "/src/routes/counter/state.ts",
        reason: "imported",
        serviceIds: ["@app/Count"],
        fingerprint: "/src/routes/counter/state.ts:@app/Count",
      },
    ]);
  });

  it("honors explicit HMR opt-out while preserving template optimization", () => {
    const component = analyzeComponentHmr({
      moduleId: "/src/routes/counter.ts",
      boundary: "route-component",
      sourceText: "const count = yield* RefSubject.make(0);",
    });

    const plan = planCompileCapabilities({
      moduleId: "/src/routes/counter.ts",
      boundary: "route-component",
      templates: [template("counter")],
      component,
      hmr: { enabled: false },
    });

    expect(plan.templates).toHaveLength(1);
    expect(plan.hmr).toEqual({
      eligible: false,
      services: [],
      dependencies: [],
      rejected: [{ moduleId: "/src/routes/counter.ts", reason: "explicit-opt-out" }],
    });
  });
});

function template(templateHash: string) {
  return createTemplatePlan({ templateHash, nodes: [], parts: [] });
}
