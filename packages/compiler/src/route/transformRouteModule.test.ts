import { describe, expect, it } from "vitest";
import { transformRouteModule } from "./transformRouteModule.js";

describe("transformRouteModule", () => {
  it("rewrites eligible route closures through generated continuation symbols", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        const Count = RefSubject.Service<number>()("@app/Count");
        export const route = () => {
          const increment = () => Count.onSuccess(1);
          return html\`<button onClick=\${increment}>Count</button>\`;
        };
      `,
    });

    expect(result.transformed).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.sourceText).toContain(
      "const __typed_route_increment_continuation = () => Count.onSuccess(1);",
    );
    expect(result.sourceText).toContain(
      "const increment = __typed_route_increment_continuation;",
    );
    expect(result.sourceText).toContain("export const __typedRouteContinuations =");
    expect(result.sourceText).toContain('"closureName": "increment"');
    expect(result.sourceText).toContain('"symbolName": "__typed_route_increment_continuation"');
  });

  it("leaves unsupported route modules unchanged with fail-closed diagnostics", () => {
    const sourceText = `
      let count = 0;
      export const route = () => {
        const increment = () => count++;
        return html\`<button>\${increment}</button>\`;
      };
    `;
    const result = transformRouteModule({
      moduleId: "/src/routes/mutable.ts",
      sourceText,
    });

    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
    expect(result.diagnostics).toEqual([
      {
        code: "unsupported-closure-capture",
        fileName: "/src/routes/mutable.ts",
        message:
          "Cannot rewrite closure increment in /src/routes/mutable.ts: count is mutable-local",
        severity: "error",
        source: "compiler",
      },
    ]);
  });
});
