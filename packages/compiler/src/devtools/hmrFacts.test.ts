import {
  HmrStatusFactSchema,
  decodeDevtoolsPayload,
  makeHmrBoundaryId,
  makeTemplateHash,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { planCompileCapabilities } from "../capabilities/compileCapabilities.js";
import { analyzeComponentHmr } from "../hmr/analyzeComponentHmr.js";
import { analyzeDependencyHmr } from "../hmr/dependencies.js";
import { createTemplatePlan } from "../template/TemplatePlan.js";
import { createHmrStatusFacts, type CompilerHmrStatusFact } from "./hmrFacts.js";

describe("compiler HMR devtools facts", () => {
  it("keeps template optimization separate from stateful HMR eligibility", () => {
    const component = analyzeComponentHmr({
      boundary: "template",
      moduleId: "src/components/Button.ts",
      sourceText: "const count = yield* RefSubject.make(0);",
    });
    const plan = planCompileCapabilities({
      boundary: "template",
      component,
      moduleId: "src/components/Button.ts",
      templates: [template("button")],
    });

    expect(createHmrStatusFacts(plan, { timestamp: 10 })).toEqual([
      {
        _tag: "HmrStatus",
        boundaryId: makeHmrBoundaryId("src/components/Button.ts#template#button"),
        moduleId: "src/components/Button.ts",
        stateful: {
          _tag: "Rejected",
          reasons: ["incompatible-boundary"],
        },
        template: {
          optimized: true,
          templateHash: makeTemplateHash("button"),
        },
        timestamp: 10,
      },
    ]);
  });

  it("emits stateful eligibility and service ids for route components", () => {
    const component = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "src/routes/counter.ts",
      sourceText: "const count = yield* RefSubject.make(0);",
    });
    const dependencies = analyzeDependencyHmr({
      routeModuleId: "src/routes/counter.ts",
      dependencies: [
        {
          moduleId: "src/routes/counter/state.ts",
          reason: "imported",
          sourceText: 'export const Count = RefSubject.Service<number>()("@app/Count");',
        },
      ],
    });
    const plan = planCompileCapabilities({
      boundary: "route-component",
      component,
      dependencies,
      moduleId: "src/routes/counter.ts",
      templates: [template("counter")],
    });

    const facts = createHmrStatusFacts(plan, { timestamp: 20 });

    expect(facts).toEqual([
      {
        _tag: "HmrStatus",
        boundaryId: makeHmrBoundaryId("src/routes/counter.ts#route-component#counter"),
        moduleId: "src/routes/counter.ts",
        stateful: {
          _tag: "Eligible",
          serviceIds: ["src/routes/counter.ts#count", "@app/Count"],
        },
        template: {
          optimized: true,
          templateHash: makeTemplateHash("counter"),
        },
        timestamp: 20,
      },
    ]);
    expect(decodeDevtoolsPayload(HmrStatusFactSchema, facts[0])).toEqual(facts[0]);
  });

  it("maps explicit compiler opt-out into protocol HMR reasons", () => {
    const component = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "src/routes/counter.ts",
      sourceText: "const count = yield* RefSubject.make(0);",
    });
    const plan = planCompileCapabilities({
      boundary: "route-component",
      component,
      hmr: { enabled: false },
      moduleId: "src/routes/counter.ts",
      templates: [],
    });

    expect(createHmrStatusFacts(plan, { timestamp: 30 })).toEqual([
      {
        _tag: "HmrStatus",
        boundaryId: makeHmrBoundaryId("src/routes/counter.ts#route-component"),
        moduleId: "src/routes/counter.ts",
        stateful: {
          _tag: "Rejected",
          reasons: ["explicit-opt-out"],
        },
        template: {
          optimized: false,
        },
        timestamp: 30,
      },
    ]);
  });

  it("maps dependency rejection reasons into protocol HMR reasons", () => {
    const component = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "src/routes/counter.ts",
      sourceText: "const count = yield* RefSubject.make(0);",
    });
    const dependencies = analyzeDependencyHmr({
      routeModuleId: "src/routes/counter.ts",
      dependencies: [
        {
          moduleId: "src/routes/counter/state.ts",
          optOut: true,
          reason: "imported",
          sourceText: "",
        },
      ],
    });
    const plan = planCompileCapabilities({
      boundary: "route-component",
      component,
      dependencies,
      moduleId: "src/routes/counter.ts",
      templates: [],
    });

    expect(createHmrStatusFacts(plan, { timestamp: 35 })).toEqual([
      {
        _tag: "HmrStatus",
        boundaryId: makeHmrBoundaryId("src/routes/counter.ts#route-component"),
        moduleId: "src/routes/counter.ts",
        stateful: {
          _tag: "Rejected",
          reasons: ["explicit-opt-out"],
        },
        template: {
          optimized: false,
        },
        timestamp: 35,
      },
    ]);
  });

  it("reports unknown stateful status for route components without inferred services", () => {
    const component = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "src/routes/static.ts",
      sourceText: "export const route = () => html`<p>Static</p>`;",
    });
    const plan = planCompileCapabilities({
      boundary: "route-component",
      component,
      moduleId: "src/routes/static.ts",
      templates: [],
    });

    expect(createHmrStatusFacts(plan, { timestamp: 36 })).toEqual([
      {
        _tag: "HmrStatus",
        boundaryId: makeHmrBoundaryId("src/routes/static.ts#route-component"),
        moduleId: "src/routes/static.ts",
        stateful: {
          _tag: "Unknown",
          reason: "No stateful HMR services were inferred.",
        },
        template: {
          optimized: false,
        },
        timestamp: 36,
      },
    ]);
  });

  it("preserves protocol inference for generated HMR facts", () => {
    const [fact] = createHmrStatusFacts(
      planCompileCapabilities({
        boundary: "dependency",
        moduleId: "src/dependency.ts",
      }),
      { timestamp: 40 },
    );

    expectTypeOf(fact).toExtend<CompilerHmrStatusFact>();
    expectTypeOf(fact!.boundaryId).toEqualTypeOf<ReturnType<typeof makeHmrBoundaryId>>();
  });
});

function template(templateHash: string) {
  return createTemplatePlan({ nodes: [], parts: [], templateHash });
}
