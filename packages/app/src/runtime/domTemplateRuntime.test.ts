import { makeDomRegistry } from "@typed/devtools-runtime";
import { describe, expect, it } from "vitest";
import {
  createActionResumeRegistry,
  createAppDomTemplateRuntime,
  createRouteResumeRegistry,
} from "../runtime/index.js";

describe("createAppDomTemplateRuntime", () => {
  it("composes route resume, action resume, and devtools observer", () => {
    const domRegistry = makeDomRegistry();
    const runtime = createAppDomTemplateRuntime({
      routeRegistry: createRouteResumeRegistry(),
      actionRegistry: createActionResumeRegistry(),
      devtools: { enabled: true, domRegistry },
    });

    expect(runtime.resumeRoute).toEqual(expect.any(Function));
    expect(runtime.resumeAction).toEqual(expect.any(Function));
    expect(runtime.devtools).toBe(domRegistry.observer);
  });

  it("omits devtools observer when disabled", () => {
    const runtime = createAppDomTemplateRuntime({
      routeRegistry: createRouteResumeRegistry(),
      actionRegistry: createActionResumeRegistry(),
      devtools: { enabled: false },
    });

    expect(runtime.resumeRoute).toEqual(expect.any(Function));
    expect(runtime.resumeAction).toEqual(expect.any(Function));
    expect(runtime.devtools).toBeUndefined();
  });
});
