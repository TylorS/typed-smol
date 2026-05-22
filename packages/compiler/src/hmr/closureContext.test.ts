import { describe, expect, it } from "vitest";
import { planClosureContext } from "./closureContext.js";

describe("planClosureContext", () => {
  it("represents eligible closure captures as generated context fields", () => {
    const result = planClosureContext({
      closureName: "increment",
      moduleId: "/src/routes/counter.ts",
      captures: [
        { name: "count", type: "RefSubject.RefSubject<number>" },
        { name: "step", type: "number" },
      ],
    });

    expect(result).toEqual({
      closureName: "increment",
      contextName: "__typed_increment_context",
      eligible: true,
      fields: [
        { name: "count", type: "RefSubject.RefSubject<number>" },
        { name: "step", type: "number" },
      ],
      diagnostics: [],
      typeParameters: { error: "never", services: "never" },
    });
  });

  it("preserves Fx.fn error and service type metadata", () => {
    const result = planClosureContext({
      closureName: "load",
      moduleId: "/src/routes/profile.ts",
      captures: [{ name: "client", type: "ApiClient" }],
      typeParameters: {
        error: "ApiError",
        services: "ApiClient | Scope.Scope",
      },
    });

    expect(result.typeParameters).toEqual({
      error: "ApiError",
      services: "ApiClient | Scope.Scope",
    });
  });

  it("rejects unsupported captures with diagnostics", () => {
    const result = planClosureContext({
      closureName: "unstable",
      moduleId: "/src/routes/counter.ts",
      captures: [{ mutable: true, name: "local", type: "unknown" }],
    });

    expect(result.eligible).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "unsupported-closure-capture",
        message: "Cannot rewrite closure unstable in /src/routes/counter.ts: local is mutable",
        moduleId: "/src/routes/counter.ts",
      },
    ]);
  });
});
