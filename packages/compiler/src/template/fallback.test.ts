import { describe, expect, expectTypeOf, it } from "vitest";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import {
  html,
  HtmlRenderTemplate,
  renderToHtmlString,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import { createTemplateFallback, isTemplateFallback } from "./fallback.js";

const strings = (...values: readonly string[]): TemplateStringsArray =>
  Object.assign([...values], { raw: [...values] }) as unknown as TemplateStringsArray;

const renderHtml = (renderable: Fx.Fx<RenderEvent, never, RenderTemplate | Scope.Scope>) =>
  Effect.runPromise(renderToHtmlString(renderable).pipe(Effect.provide(HtmlRenderTemplate)));

describe("template fallback", () => {
  it("keeps unsupported template sources on the runtime RenderTemplate path", async () => {
    const template = strings("<article>", "</article>");
    const fallback = createTemplateFallback<readonly [string]>({
      moduleId: "/src/routes/home.ts",
      reason: "unsupported expression source: computed tag binding",
      template,
    });

    expect(isTemplateFallback(fallback)).toBe(true);
    await expect(renderHtml(fallback.render("Ada"))).resolves.toBe(
      await renderHtml(html(template, "Ada")),
    );
  });

  it("records a structured diagnostic with module id and reason", () => {
    const fallback = createTemplateFallback({
      moduleId: "/src/routes/admin.ts",
      reason: "unsupported expression source: dynamic spread",
      template: strings("<section></section>"),
    });

    expect(fallback.diagnostics).toEqual([
      {
        kind: "template-compiler-diagnostic",
        code: "typed-template-fallback",
        severity: "warning",
        moduleId: "/src/routes/admin.ts",
        reason: "unsupported expression source: dynamic spread",
        message:
          "Fell back to runtime RenderTemplate for /src/routes/admin.ts: unsupported expression source: dynamic spread",
      },
    ]);
  });

  it("preserves the runtime type handoff for interpolated renderable values", () => {
    const fallback = createTemplateFallback<readonly [string, Effect.Effect<number>]>({
      moduleId: "/src/routes/counter.ts",
      reason: "explicit opt-out",
      template: strings("<p>", ": ", "</p>"),
    });

    expectTypeOf(fallback.render).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(fallback.render).parameter(1).toEqualTypeOf<Effect.Effect<number>>();
    expectTypeOf(fallback.render("Count", Effect.succeed(1))).toExtend<
      Fx.Fx<RenderEvent, never, RenderTemplate | Scope.Scope>
    >();
  });
});
