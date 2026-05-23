import { describe, expect, it } from "vitest";
import { planCpsCompilation } from "./planCpsCompilation.js";
import { analyzeRouteModule } from "../route/analyzeRouteModule.js";
import { planRouteCpsCompilation } from "./planCpsCompilation.js";

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
      moduleId: "/src/routes/counter.ts",
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
            moduleId: "/src/routes/counter.ts",
            serviceId: "/src/routes/counter.ts#count",
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
        id: "/src/routes/counter.ts#hmr:/src/routes/counter.ts#count",
        kind: "hmr-state",
        moduleId: "/src/routes/counter.ts",
        serviceId: "/src/routes/counter.ts#count",
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
      moduleId: "/src/routes/counter.ts",
      boundary: "route-component",
      templates: [],
      hmr: {
        eligible: false,
        services: [],
        dependencies: [],
        rejected: [{ moduleId: "/src/routes/counter.ts", reason: "explicit-opt-out" }],
      },
    });

    expect(plan.continuations).toEqual([]);
    expect(plan.diagnostics).toEqual([
      {
        code: "hmr-rejected",
        moduleId: "/src/routes/counter.ts",
        reason: "explicit-opt-out",
      },
    ]);
  });

  it("lowers route closures with RefSubject.Service captures into continuations", () => {
    const route = analyzeRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        const Count = RefSubject.Service<number>()("@app/Count");
        export const route = () => {
          const increment = () => Count.onSuccess(1);
          return html\`<button onClick=\${increment}>Count</button>\`;
        };
      `,
    });

    const plan = planRouteCpsCompilation(route, { version: "test" });

    expect(plan.continuations).toEqual(
      expect.arrayContaining([
        {
          captures: [
            {
              kind: "refsubject-service",
              name: "Count",
              serviceId: "@app/Count",
            },
          ],
          closureName: "increment",
          compatibilityFingerprint: JSON.stringify({
            captures: ["refsubject-service:Count:@app/Count"],
            dependencyFingerprints: [],
            parameters: [],
            symbolId: "/src/routes/counter.ts#closure:increment",
            version: "test",
          }),
          dependencyFingerprints: [],
          id: "/src/routes/counter.ts#closure:increment",
          kind: "route-closure",
          moduleId: "/src/routes/counter.ts",
          parameters: [],
          serviceIds: ["@app/Count"],
          symbolId: "/src/routes/counter.ts#closure:increment",
          templateHashes: [],
          version: "test",
        },
      ]),
    );
  });

  it("lowers route closures with Effect service captures into continuations", () => {
    const route = analyzeRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `
        class ProfileClient extends Context.Service<
          ProfileClient,
          { readonly load: Effect.Effect<string> }
        >()("@app/ProfileClient") {}

        export const route = Effect.gen(function* route() {
          const client = yield* ProfileClient;
          const load = () => client.load;
          return html\`<section>\${yield* load()}</section>\`;
        });
      `,
    });

    const plan = planRouteCpsCompilation(route, { version: "test" });

    expect(plan.continuations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captures: [
            {
              kind: "effect-service",
              name: "client",
              serviceId: "@app/ProfileClient",
            },
          ],
          closureName: "load",
          kind: "route-closure",
          serviceIds: ["@app/ProfileClient"],
        }),
      ]),
    );
  });
});
