import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import Stateful from "./fixtures/Stateful.svelte";
import { Html, view } from "../lib/index.js";

describe("Svelte view HTML renderer", () => {
  it("server-renders the first props value and exposes head output", async () => {
    const heads: Array<string> = [];
    const props = Fx.fromIterable([{ label: "first" }, { label: "second" }]);

    const markup = await renderToHtmlString(view(Stateful, props)).pipe(
      Effect.provide(
        Layer.merge(
          HtmlRenderTemplate,
          Html.using({
            onHead: (head) => heads.push(head),
          }),
        ),
      ),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(markup).toContain('<typed-svelte style="display: contents">');
    expect(markup).toContain("first:0");
    expect(markup).not.toContain("second:0");
    expect(heads.join("\n")).toContain("<title>first</title>");
  });
});
