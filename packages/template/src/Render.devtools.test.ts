import { Fx } from "@typed/fx";
import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import type { DomTemplateDevtoolsObserver } from "./compiler-runtime/devtools.js";
import { DomRenderTemplate, html, render } from "./index.js";

describe("DOM RenderTemplate devtools hooks", () => {
  it("emits mounted events for runtime html templates when a devtools observer is provided", async () => {
    const window = new Window();
    const root = window.document.createElement("main");
    const mounted: Array<{ readonly nodeCount: number; readonly rootTag: string }> = [];
    const devtools: DomTemplateDevtoolsObserver = {
      onTemplateMounted: (event) => {
        mounted.push({ nodeCount: event.nodes.length, rootTag: event.root.tagName });
      },
    };

    await Effect.runPromise(
      render(html`<section class="probe">Hello</section>`, root).pipe(
        Fx.take(1),
        Fx.collectAll,
        Effect.provide(DomRenderTemplate.using(window.document, { devtools })),
        Effect.scoped,
      ),
    );

    expect(mounted).toEqual([{ nodeCount: 1, rootTag: "SECTION" }]);
  });
});
