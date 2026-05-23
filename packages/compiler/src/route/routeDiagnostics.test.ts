import { describe, expect, it } from "vitest";
import { invalidRouteDiagnosticCode, invalidRouteModuleSource } from "./routeFixtures.js";
import { getRouteDiagnostics } from "./routeDiagnostics.js";

describe("getRouteDiagnostics", () => {
  it("returns shared route resumability diagnostics as TypeScript diagnostics", () => {
    const diagnostics = getRouteDiagnostics({
      moduleId: "/src/routes/mutable.ts",
      sourceText: invalidRouteModuleSource,
    });

    expect(diagnostics).toHaveLength(1);
    expect(String(diagnostics[0]?.messageText)).toContain(invalidRouteDiagnosticCode);
  });
});
