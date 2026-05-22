import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { html, HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { analyzeTemplate } from "./analyzeTemplate.js";
import { emitServerTemplate } from "./emitServerTemplate.js";

const strings = (...values: readonly string[]): TemplateStringsArray =>
  Object.assign([...values], { raw: [...values] }) as unknown as TemplateStringsArray;

const runtimeHtml = (template: TemplateStringsArray, ...values: readonly unknown[]) =>
  Effect.runPromise(
    renderToHtmlString(html(template, ...values)).pipe(Effect.provide(HtmlRenderTemplate)),
  );

describe("emitServerTemplate", () => {
  it("renders static element structure like HtmlRenderTemplate", async () => {
    const template = strings("<main><h1>Hello</h1><input disabled /></main>");
    const compiled = emitServerTemplate(analyzeTemplate(template));

    await expect(compiled.renderToString()).resolves.toBe(await runtimeHtml(template));
  });

  it("renders dynamic text and sparse class attributes like HtmlRenderTemplate", async () => {
    const template = strings('<button class="count-', '">Count: ', "</button>");
    const compiled = emitServerTemplate(analyzeTemplate(template));

    await expect(compiled.renderToString(["active", 7])).resolves.toBe(
      await runtimeHtml(template, "active", 7),
    );
  });

  it("omits event and ref parts from server output while preserving children", async () => {
    const template = strings("<button @click=", " ref=", ">Save</button>");
    const compiled = emitServerTemplate(analyzeTemplate(template));

    await expect(compiled.renderToString([() => undefined, () => undefined])).resolves.toBe(
      await runtimeHtml(
        template,
        () => undefined,
        () => undefined,
      ),
    );
  });

  it("renders comments, doctypes, text-only elements, data, and properties like HtmlRenderTemplate", async () => {
    const template = strings(
      "<!doctype html><!--",
      '--><script type="module">',
      "</script><section .data=",
      " .props=",
      "></section>",
    );
    const compiled = emitServerTemplate(analyzeTemplate(template));
    const values = ["comment", "console.log(1)", "ignored", "ignored"] as const;

    await expect(compiled.renderToString(values)).resolves.toBe(
      await runtimeHtml(template, ...values),
    );
  });
});
