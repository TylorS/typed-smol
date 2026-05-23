import { describe, expect, it } from "vitest";
import {
  analyzeDependencyGraphHmr,
  discoverRouteDependencyGraphHmr,
} from "./dependencyGraph.js";

describe("analyzeDependencyGraphHmr", () => {
  it("includes transitive dependency services in stable traversal order", () => {
    const result = analyzeDependencyGraphHmr({
      routeModuleId: "/src/routes/counter.ts",
      entryModuleIds: ["/src/routes/counter/state.ts"],
      dependencies: [
        {
          imports: ["/src/routes/counter/helpers.ts"],
          moduleId: "/src/routes/counter/state.ts",
          reason: "imported",
          sourceText: `export const Count = RefSubject.Service<number>()("@app/Count");`,
        },
        {
          imports: [],
          moduleId: "/src/routes/counter/helpers.ts",
          reason: "imported",
          sourceText: `export const Step = RefSubject.Service<number>()("@app/Step");`,
        },
      ],
    });

    expect(result.participants.map((item) => item.moduleId)).toEqual([
      "/src/routes/counter/state.ts",
      "/src/routes/counter/helpers.ts",
    ]);
    expect(result.participants.flatMap((item) => item.serviceIds)).toEqual([
      "@app/Count",
      "@app/Step",
    ]);
  });

  it("terminates cycles deterministically", () => {
    const result = analyzeDependencyGraphHmr({
      routeModuleId: "/src/routes/counter.ts",
      entryModuleIds: ["/src/routes/counter/a.ts"],
      dependencies: [
        {
          imports: ["/src/routes/counter/b.ts"],
          moduleId: "/src/routes/counter/a.ts",
          reason: "imported",
          sourceText: `export const A = RefSubject.Service<number>()("@app/A");`,
        },
        {
          imports: ["/src/routes/counter/a.ts"],
          moduleId: "/src/routes/counter/b.ts",
          reason: "imported",
          sourceText: `export const B = RefSubject.Service<number>()("@app/B");`,
        },
      ],
    });

    expect(result.participants.map((item) => item.moduleId)).toEqual([
      "/src/routes/counter/a.ts",
      "/src/routes/counter/b.ts",
    ]);
    expect(result.cycles).toEqual([
      {
        fromModuleId: "/src/routes/counter/b.ts",
        toModuleId: "/src/routes/counter/a.ts",
      },
    ]);
  });

  it("stops traversal at explicit opt-out boundaries", () => {
    const result = analyzeDependencyGraphHmr({
      routeModuleId: "/src/routes/counter.ts",
      entryModuleIds: ["/src/routes/counter/state.ts"],
      dependencies: [
        {
          imports: ["/src/routes/counter/secret.ts"],
          moduleId: "/src/routes/counter/state.ts",
          optOut: true,
          reason: "imported",
          sourceText: `export const Count = RefSubject.Service<number>()("@app/Count");`,
        },
        {
          imports: [],
          moduleId: "/src/routes/counter/secret.ts",
          reason: "imported",
          sourceText: `export const Secret = RefSubject.Service<number>()("@app/Secret");`,
        },
      ],
    });

    expect(result.participants).toEqual([]);
    expect(result.rejected).toEqual([
      {
        moduleId: "/src/routes/counter/state.ts",
        reason: "explicit-opt-out",
      },
    ]);
    expect(result.boundaries).toEqual([
      {
        moduleId: "/src/routes/counter/state.ts",
        reason: "explicit-opt-out",
        skippedImports: ["/src/routes/counter/secret.ts"],
      },
    ]);
  });

  it("promotes inline RefSubject state in transitive dependencies", () => {
    const result = analyzeDependencyGraphHmr({
      routeModuleId: "/src/routes/counter.ts",
      entryModuleIds: ["/src/routes/counter/state.ts"],
      dependencies: [
        {
          imports: ["/src/routes/counter/anonymous.ts"],
          moduleId: "/src/routes/counter/state.ts",
          reason: "imported",
          sourceText: `export const Count = RefSubject.Service<number>()("@app/Count");`,
        },
        {
          imports: [],
          moduleId: "/src/routes/counter/anonymous.ts",
          reason: "imported",
          sourceText: "export const count = RefSubject.make(0);",
        },
      ],
    });

    expect(result.participants).toEqual(
      expect.arrayContaining([
        {
          fingerprint: "/src/routes/counter/anonymous.ts:/src/routes/counter/anonymous.ts#count",
          moduleId: "/src/routes/counter/anonymous.ts",
          reason: "imported",
          serviceIds: ["/src/routes/counter/anonymous.ts#count"],
        },
      ]),
    );
    expect(result.rejected).toEqual([]);
  });
});

describe("discoverRouteDependencyGraphHmr", () => {
  it("discovers recursive route dependencies from TypeScript-resolved imports", () => {
    const result = discoverRouteDependencyGraphHmr(
      inMemoryRouteGraph("/src/routes/counter.ts", {
        "/src/routes/counter.ts": `
          import { Count } from "./counter/state";
          export const route = () => Count;
        `,
        "/src/routes/counter/state.ts": `
          import { Step } from "./helpers";
          export const Count = RefSubject.Service<number>()("@app/Count");
        `,
        "/src/routes/counter/helpers.ts": `
          export { Step } from "./nested/step";
        `,
        "/src/routes/counter/nested/step.ts": `
          export const Step = RefSubject.Service<number>()("@app/Step");
        `,
      }),
    );

    expect(result.participants.map((item) => item.moduleId)).toEqual([
      "/src/routes/counter/state.ts",
      "/src/routes/counter/nested/step.ts",
    ]);
    expect(result.participants.flatMap((item) => item.serviceIds)).toEqual([
      "@app/Count",
      "@app/Step",
    ]);
  });

  it("records cycles discovered through real imports without revisiting forever", () => {
    const result = discoverRouteDependencyGraphHmr(
      inMemoryRouteGraph("/src/routes/cycle.ts", {
        "/src/routes/cycle.ts": `import "./a";`,
        "/src/routes/a.ts": `
          import "./b";
          export const A = RefSubject.Service<number>()("@app/A");
        `,
        "/src/routes/b.ts": `
          import "./a";
          export const B = RefSubject.Service<number>()("@app/B");
        `,
      }),
    );

    expect(result.participants.map((item) => item.moduleId)).toEqual([
      "/src/routes/a.ts",
      "/src/routes/b.ts",
    ]);
    expect(result.cycles).toEqual([
      { fromModuleId: "/src/routes/b.ts", toModuleId: "/src/routes/a.ts" },
    ]);
  });

  it("allows compiler hosts to classify discovered dependency opt-out boundaries", () => {
    const result = discoverRouteDependencyGraphHmr({
      ...inMemoryRouteGraph("/src/routes/page.ts", {
        "/src/routes/page.ts": `import "./state";`,
        "/src/routes/state.ts": `
          import "./secret";
          export const Count = RefSubject.Service<number>()("@app/Count");
        `,
        "/src/routes/secret.ts": `
          export const Secret = RefSubject.Service<number>()("@app/Secret");
        `,
      }),
      classifyDependency: (moduleId) => ({ optOut: moduleId.endsWith("/state.ts") }),
    });

    expect(result.participants).toEqual([]);
    expect(result.rejected).toEqual([
      { moduleId: "/src/routes/state.ts", reason: "explicit-opt-out" },
    ]);
    expect(result.boundaries).toEqual([
      {
        moduleId: "/src/routes/state.ts",
        reason: "explicit-opt-out",
        skippedImports: ["/src/routes/secret.ts"],
      },
    ]);
  });
});

function inMemoryRouteGraph(routeModuleId: string, files: Record<string, string>) {
  return {
    routeModuleId,
    readFile: (moduleId: string) => files[moduleId],
    fileExists: (moduleId: string) => Object.hasOwn(files, moduleId),
  };
}
