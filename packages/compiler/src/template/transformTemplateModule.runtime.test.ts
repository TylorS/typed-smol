import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  DomRenderTemplate,
  HtmlRenderTemplate,
  html,
  render,
  renderToHtmlString,
} from "@typed/template";
import { Fx } from "@typed/fx";
import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import { afterEach, describe, expect, it } from "vitest";
import { transformTemplateModule } from "./transformTemplateModule.js";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("transformTemplateModule runtime output", () => {
  it("executes transformed DOM templates with Effect values like DomRenderTemplate", async () => {
    const mod = await importTransformed(
      [
        'import * as Effect from "effect/Effect";',
        'import { html } from "@typed/template";',
        'const name = Effect.succeed("Ada");',
        "export const view = html`<main>Hello ${name}</main>`;",
      ].join("\n"),
      "dom",
    );
    const expected = await runtimeDomText(Effect.succeed("Ada"));
    const window = new Window();
    const root = window.document.createElement("div");

    await mod.view.renderInto(root);

    expect(root.textContent).toBe(expected);
  });

  it("executes transformed server templates with Effect values like HtmlRenderTemplate", async () => {
    const mod = await importTransformed(
      [
        'import * as Effect from "effect/Effect";',
        'import { html } from "@typed/template";',
        'const name = Effect.succeed("Ada");',
        "export const view = html`<main>Hello ${name}</main>`;",
      ].join("\n"),
      "server",
    );
    const expected = await runtimeHtml(Effect.succeed("Ada"));

    await expect(mod.view.renderToString()).resolves.toBe(stripTemplateBoundaries(expected));
  });
});

async function importTransformed(sourceText: string, target: "dom" | "server") {
  const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText, target });
  expect(result.diagnostics).toEqual([]);
  expect(result.transformed).toBe(true);
  const dir = mkdirTempDir();
  const file = join(dir, `view-${target}.mjs`);
  writeFileSync(file, result.sourceText);
  return import(`${pathToFileURL(file).href}?t=${Date.now()}`);
}

function mkdirTempDir(): string {
  const root = fileURLToPath(new URL("../../.tmp-transform-runtime", import.meta.url));
  const dir = join(root, `${process.pid}-${tempDirs.length}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

function runtimeDomText(value: unknown): Promise<string | null> {
  const window = new Window();
  return Effect.runPromise(
    Effect.gen(function* () {
      yield* render(html`<main>Hello ${value}</main>`, window.document.body).pipe(
        Fx.provide(DomRenderTemplate.using(window.document)),
        Fx.take(1),
        Fx.collectAll,
      );
      return window.document.body.textContent;
    }).pipe(Effect.scoped),
  );
}

function runtimeHtml(value: unknown): Promise<string> {
  return Effect.runPromise(
    renderToHtmlString(html`<main>Hello ${value}</main>`).pipe(Effect.provide(HtmlRenderTemplate)),
  );
}

function stripTemplateBoundaries(value: string): string {
  return value.replace(/^<!--t_[^-]+-->/, "").replace(/<!--\/t_[^-]+-->$/, "");
}
