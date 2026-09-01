import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { ReferencePackage } from "../Model.js";
import { PackagePage } from "../../pages/Reference.js";
import { SymbolPage } from "../../pages/Symbol.js";

const render = (pkg: ReferencePackage) =>
  Effect.runPromise(
    Effect.scoped(renderToHtmlString(PackagePage(pkg)).pipe(Effect.provide(HtmlRenderTemplate))),
  );

describe("package reference", () => {
  it("renders Fx through the standard import-surface layout", async () => {
    const output = await render({
      packageName: "@typed/fx",
      packageVersion: "2.0.0-beta.4",
      moduleSpecifiers: ["@typed/fx/Fx", "@typed/fx/RefSubject"],
      exposureIds: ["@typed/fx/Fx#sync", "@typed/fx/RefSubject#make"],
      uniqueExportCount: 2,
      moduleGroups: [
        {
          id: "@typed/fx/Fx",
          title: "@typed/fx/Fx",
          modules: [
            {
              consumerSpecifier: "@typed/fx/Fx",
              exposureIds: ["@typed/fx/Fx#sync"],
            },
          ],
        },
        {
          id: "@typed/fx/RefSubject",
          title: "@typed/fx/RefSubject",
          modules: [
            {
              consumerSpecifier: "@typed/fx/RefSubject",
              exposureIds: ["@typed/fx/RefSubject#make"],
            },
          ],
        },
      ],
    });

    expect(output).toContain("Import surfaces");
    expect(output).toMatch(/<dt>Unique exports<\/dt><dd>[\s\S]*?2[\s\S]*?<\/dd>/u);
    expect(output).not.toContain("Public exposures");
    expect(output).toContain('class="reference-module-row"');
    expect(output).toContain(
      `/reference/${encodeURIComponent("@typed/fx/Fx#sync")}`,
    );
    expect(output).toContain(
      `/reference/${encodeURIComponent("@typed/fx/RefSubject#make")}`,
    );
    expect(output).not.toContain("Choose an API area");
    expect(output).not.toContain("Browse import paths");
  });

  it("renders a unique-symbol exposure to completion", async () => {
    const output = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(
          SymbolPage({
            id: "@typed/template#HtmlRenderTransportBrand",
            packageName: "@typed/template",
            moduleName: ".",
            exportName: "HtmlRenderTransportBrand",
            kind: "constant",
            signatures: ["export declare const HtmlRenderTransportBrand: unique symbol;"],
            summary: "The published advanced brand identifying renderer-owned HTML transport.",
            sections: {
              Why: "The separate brand prevents arbitrary `toString` objects from crossing the\ntrusted SSR boundary as raw markup.",
              "Ownership and lifetime":
                "The symbol is global metadata; it does not validate, sanitize, or retain HTML.",
            },
            examples: [
              {
                language: "ts",
                code: 'import { HtmlRenderEvent, HtmlRenderTransportBrand } from "@typed/template/RenderEvent"\n\nconst event = HtmlRenderEvent("<p>trusted renderer output</p>", true)\nevent[HtmlRenderTransportBrand] // true',
              },
            ],
            relations: [],
            source: { file: "packages/template/src/RenderEvent.ts", line: 142 },
            since: "1.0.0",
            category: "advanced",
          }),
        ).pipe(Effect.provide(HtmlRenderTemplate)),
      ),
    );

    expect(output).toContain("HtmlRenderTransportBrand");
  }, 1_000);
});
