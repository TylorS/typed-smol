import { transformRouteModule } from "@typed/compiler";
import { describe, expect, it } from "vitest";
import { getOrCreateHmrState, type HmrStateDescriptor } from "./hmrRegistry.js";

describe("resumable route HMR fixture", () => {
  it("preserves service state for compatible route continuations and refreshes on capture changes", () => {
    const first = routeStateDescriptor(routeSource('"Count"'));
    const compatible = routeStateDescriptor(routeSource('"Count"'));
    const changed = routeStateDescriptor(routeSource('"Total"'));
    const globalObject: Record<PropertyKey, unknown> = {};

    const state = getOrCreateHmrState(first, () => ({ count: 1 }), { globalObject });
    const reloaded = getOrCreateHmrState(compatible, () => ({ count: 2 }), { globalObject });
    const refreshed = getOrCreateHmrState(changed, () => ({ count: 3 }), { globalObject });

    expect(reloaded).toBe(state);
    expect(refreshed).not.toBe(state);
    expect(refreshed.count).toBe(3);
  });
});

function routeSource(titleInitializer: string): string {
  return `
    const title = ${titleInitializer};
    export const route = () => {
      const renderTitle = () => title;
      return html\`<button>\${renderTitle}</button>\`;
    };
  `;
}

function routeStateDescriptor(sourceText: string): HmrStateDescriptor {
  const result = transformRouteModule({
    moduleId: "/src/routes/counter.ts",
    sourceText,
    version: "test",
  });
  const continuation = result.continuations[0];
  if (!continuation) throw new Error("Expected route continuation.");
  return {
    continuationFingerprints: [continuation.compatibilityFingerprint],
    moduleId: continuation.moduleId,
    serviceId: "@app/routes/counter/Count",
    shapeFingerprint: "refsubject-service:Count:@app/routes/counter/Count",
    version: continuation.version,
  };
}
