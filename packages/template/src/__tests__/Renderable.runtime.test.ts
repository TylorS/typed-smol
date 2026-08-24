import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { html, renderToHtmlString, type Renderable, StaticHtmlRenderTemplate } from "../index.js";

describe("Renderable runtime", () => {
  it("keeps plain functions out of server-rendered node content", () => {
    const unsupported: Renderable.Any = () => "not lazy";

    return Effect.gen(function* () {
      const output = yield* renderToHtmlString(html`<div>${unsupported}</div>`).pipe(
        Effect.provide(StaticHtmlRenderTemplate),
      );
      expect(output).toBe("<div></div>");
    }).pipe(Effect.runPromise);
  });
});
