import { describe, expect, it } from "vitest";
import { createRouteModuleMatcher } from "./routeModuleMatcher.js";

describe("createRouteModuleMatcher", () => {
  it("matches default route directories by path segment", () => {
    const isRouteModule = createRouteModuleMatcher();

    expect(isRouteModule("/project/src/routes/profile.ts")).toBe(true);
    expect(isRouteModule("/project/src/not-routes/profile.ts")).toBe(false);
  });

  it("matches configured route directories instead of hard-coded routes", () => {
    const isRouteModule = createRouteModuleMatcher({ routeDirectories: ["pages"] });

    expect(isRouteModule("/project/src/pages/profile.ts")).toBe(true);
    expect(isRouteModule("/project/src/routes/profile.ts")).toBe(false);
  });

  it("matches relative route directories against a project root", () => {
    const isRouteModule = createRouteModuleMatcher({
      projectRoot: "/project",
      routeDirectories: ["src/pages"],
    });

    expect(isRouteModule("/project/src/pages/profile.ts")).toBe(true);
    expect(isRouteModule("/other/src/pages/profile.ts")).toBe(false);
  });
});
