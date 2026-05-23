import { describe, expect, it } from "vitest";
import { analyzeRouteModule } from "./analyzeRouteModule.js";

describe("analyzeRouteModule", () => {
  it("finds multiline RefSubject services, templates, and route closures", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";
        import { html } from "@typed/template";

        const Count =
          RefSubject
            .Service<number>()
            ("@app/routes/counter/Count");

        export const route = () => {
          const increment = () => Count.onSuccess(1);
          return html\`<button onClick=\${increment}>Count</button>\`;
        };
      `,
    });

    expect(result.services).toEqual([
      {
        kind: "refsubject-service",
        localName: "Count",
        moduleId: "/src/routes/counter.ts",
        serviceId: "@app/routes/counter/Count",
      },
    ]);
    expect(result.templates).toEqual([
      {
        localName: undefined,
        moduleId: "/src/routes/counter.ts",
        tagName: "html",
      },
    ]);
    expect(result.closures.map((closure) => closure.name)).toEqual(["route", "increment"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("diagnoses inline RefSubject state and records the migration candidate", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        export const route = Effect.gen(function* route() {
          const count = yield* RefSubject.make(0);
          return html\`<p>\${count}</p>\`;
        });
      `,
    });

    expect(result.inlineRefSubjects).toEqual([
      {
        initializerSource: "0",
        localName: "count",
        moduleId: "/src/routes/counter.ts",
        serviceId: "/src/routes/counter.ts#count",
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: "anonymous-refsubject-state",
        message:
          "Inline RefSubject.make in /src/routes/counter.ts should migrate count to RefSubject.Service for resumable HMR",
        moduleId: "/src/routes/counter.ts",
      },
    ]);
  });

  it("records Effect service captures used by closures", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `
        import * as Context from "effect/Context";
        import * as Effect from "effect/Effect";

        class ProfileClient extends Context.Service<
          ProfileClient,
          { readonly load: Effect.Effect<string> }
        >()("@app/ProfileClient") {}

        export const route = Effect.gen(function* route() {
          const client = yield* ProfileClient;
          const load = () => client.load;
          return html\`<section>\${yield* load()}</section>\`;
        });
      `,
    });

    expect(result.effectServices).toEqual([
      {
        kind: "effect-service",
        localName: "ProfileClient",
        moduleId: "/src/routes/profile.ts",
        serviceId: "@app/ProfileClient",
      },
    ]);
    expect(result.closures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captures: [
            {
              kind: "effect-service",
              name: "client",
              serviceId: "@app/ProfileClient",
            },
          ],
          name: "load",
        }),
      ]),
    );
  });

  it("classifies template, serializable, and context captures used by route closures", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/dashboard.ts",
      sourceText: `
        import { html } from "@typed/template";

        const title = "Dashboard";
        const options = { pageSize: 20 };
        const row = html\`<li>row</li>\`;

        export const route = () => {
          const renderTitle = () => title;
          const renderOptions = () => options.pageSize;
          const renderRow = () => row;
          return html\`<section>\${renderTitle}\${renderOptions}\${renderRow}</section>\`;
        };
      `,
    });

    expect(result.closures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captures: [
            {
              initializerSource: '"Dashboard"',
              kind: "serializable-value",
              name: "title",
            },
          ],
          name: "renderTitle",
        }),
        expect.objectContaining({
          captures: [
            {
              initializerSource: "{ pageSize: 20 }",
              kind: "context-capture",
              name: "options",
            },
          ],
          name: "renderOptions",
        }),
        expect.objectContaining({
          captures: [
            {
              kind: "template-value",
              name: "row",
            },
          ],
          name: "renderRow",
        }),
      ]),
    );
  });

  it("diagnoses mutable closure captures as unsupported", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/mutable.ts",
      sourceText: `
        let count = 0;
        export const route = () => {
          const increment = () => count++;
          return html\`<button>\${increment}</button>\`;
        };
      `,
    });

    expect(result.closures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captures: [
            {
              kind: "unsupported",
              name: "count",
              reason: "mutable-local",
            },
          ],
          name: "increment",
        }),
      ]),
    );
    expect(result.diagnostics).toEqual([
      {
        code: "unsupported-closure-capture",
        message:
          "Cannot rewrite closure increment in /src/routes/mutable.ts: count is mutable-local",
        moduleId: "/src/routes/mutable.ts",
      },
    ]);
  });
});
