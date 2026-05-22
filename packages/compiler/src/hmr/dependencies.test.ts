import { describe, expect, it } from "vitest";
import { analyzeDependencyHmr } from "./dependencies.js";

describe("analyzeDependencyHmr", () => {
  it("marks imported dependencies with stable service identities as participating", () => {
    const result = analyzeDependencyHmr({
      routeModuleId: "/src/routes/counter.tsx",
      dependencies: [
        {
          moduleId: "/src/routes/counter/state.ts",
          reason: "imported",
          sourceText: `
            import { RefSubject } from "@typed/fx";
            export const Count = RefSubject.Service<number>()("@app/routes/counter/Count");
          `,
        },
      ],
    });

    expect(result.participants).toEqual([
      {
        moduleId: "/src/routes/counter/state.ts",
        reason: "imported",
        serviceIds: ["@app/routes/counter/Count"],
        fingerprint: "/src/routes/counter/state.ts:@app/routes/counter/Count",
      },
    ]);
    expect(result.rejected).toEqual([]);
  });

  it("marks route companion dependencies as participating", () => {
    const result = analyzeDependencyHmr({
      routeModuleId: "/src/routes/counter.tsx",
      dependencies: [
        {
          moduleId: "/src/routes/counter.state.ts",
          reason: "route-companion",
          sourceText: `
            export const Count = RefSubject.Service<number>()("@app/routes/counter/Count");
          `,
        },
      ],
    });

    expect(result.participants[0]?.reason).toBe("route-companion");
  });

  it("rejects anonymous dependency state", () => {
    const result = analyzeDependencyHmr({
      routeModuleId: "/src/routes/counter.tsx",
      dependencies: [
        {
          moduleId: "/src/routes/counter/anonymous.ts",
          reason: "imported",
          sourceText: "export const count = RefSubject.make(0);",
        },
      ],
    });

    expect(result.participants).toEqual([]);
    expect(result.rejected).toEqual([
      {
        moduleId: "/src/routes/counter/anonymous.ts",
        reason: "anonymous-refsubject-state",
      },
    ]);
  });

  it("honors explicit opt-out", () => {
    const result = analyzeDependencyHmr({
      routeModuleId: "/src/routes/counter.tsx",
      dependencies: [
        {
          moduleId: "/src/routes/counter/state.ts",
          optOut: true,
          reason: "imported",
          sourceText: `
            export const Count = RefSubject.Service<number>()("@app/routes/counter/Count");
          `,
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
  });

  it("allows explicit opt-in when inference misses a dependency", () => {
    const result = analyzeDependencyHmr({
      routeModuleId: "/src/routes/counter.tsx",
      dependencies: [
        {
          moduleId: "/src/routes/counter/external-store.ts",
          optIn: true,
          reason: "explicit-opt-in",
          sourceText: "export const store = createExternalStore();",
        },
      ],
    });

    expect(result.participants).toEqual([
      {
        moduleId: "/src/routes/counter/external-store.ts",
        reason: "explicit-opt-in",
        serviceIds: [],
        fingerprint: "/src/routes/counter/external-store.ts:explicit-opt-in",
      },
    ]);
  });
});
