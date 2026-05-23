import { describe, expect, it } from "vitest";
import { analyzeComponentHmr } from "./analyzeComponentHmr.js";

describe("analyzeComponentHmr", () => {
  it("finds inline RefSubject.make calls in route components", () => {
    const result = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";
        import { html } from "@typed/template";

        export const route = () => Effect.gen(function* () {
          const count = yield* RefSubject.make(0);
          return html\`<button>\${count}</button>\`;
        });
      `,
    });

    expect(result).toEqual({
      boundary: "route-component",
      eligible: true,
      moduleId: "/src/routes/counter.ts",
      services: [
        {
          kind: "inline-refsubject",
          localName: "count",
          serviceId: "/src/routes/counter.ts#count",
          initializerSource: "0",
        },
      ],
    });
  });

  it("does not mark plain optimized html templates as stateful HMR boundaries", () => {
    const result = analyzeComponentHmr({
      boundary: "template",
      moduleId: "/src/components/button.ts",
      sourceText: `
        import { html } from "@typed/template";
        export const button = html\`<button>Save</button>\`;
      `,
    });

    expect(result).toEqual({
      boundary: "template",
      eligible: false,
      moduleId: "/src/components/button.ts",
      services: [],
    });
  });

  it("recognizes existing RefSubject.Service identities", () => {
    const result = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";
        const Count = RefSubject.Service<number>()("@app/routes/counter/Count");

        export const route = () => html\`<button>\${Count}</button>\`;
      `,
    });

    expect(result.services).toEqual([
      {
        kind: "refsubject-service",
        localName: "Count",
        serviceId: "@app/routes/counter/Count",
      },
    ]);
  });

  it("recognizes multiline RefSubject.Service identities through route analysis", () => {
    const result = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";

        const Count =
          RefSubject
            .Service<number>()
            ("@app/routes/counter/Count");

        export const route = () => html\`<button>\${Count}</button>\`;
      `,
    });

    expect(result.services).toEqual([
      {
        kind: "refsubject-service",
        localName: "Count",
        serviceId: "@app/routes/counter/Count",
      },
    ]);
  });
});
