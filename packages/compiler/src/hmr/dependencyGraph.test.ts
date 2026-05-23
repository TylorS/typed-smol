import { describe, expect, it } from "vitest";
import { analyzeDependencyGraphHmr } from "./dependencyGraph.js";

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

  it("rejects anonymous state in transitive dependencies", () => {
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

    expect(result.rejected).toEqual([
      {
        moduleId: "/src/routes/counter/anonymous.ts",
        reason: "anonymous-refsubject-state",
      },
    ]);
  });
});
