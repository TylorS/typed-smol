import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Tabs from "./Tabs.js";

describe("typed/ui/Tabs", () => {
  it("renders APG tab roles, selected state, panels, and data attrs", () =>
    Effect.gen(function* () {
      const window = new Window();
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* Tabs.makeState({ selectedId: "tab-a" });

      yield* render(
        html`<section>
          ${Tabs.List({
            state,
            label: "Sections",
            content: html`${Tabs.Tab({ state, id: "tab-a", panelId: "panel-a", content: "A" })}
              ${Tabs.Tab({ state, id: "tab-b", panelId: "panel-b", content: "B" })}`,
          })}
          ${Tabs.Panel({ state, id: "panel-a", tabId: "tab-a", content: "Panel A" })}
          ${Tabs.Panel({ state, id: "panel-b", tabId: "tab-b", content: "Panel B" })}
        </section>`,
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const tabA = window.document.getElementById("tab-a");
      const panelA = window.document.getElementById("panel-a");
      const panelB = window.document.getElementById("panel-b");

      expect(window.document.querySelector("[role=tablist]")?.getAttribute("aria-label")).toBe(
        "Sections",
      );
      expect(tabA?.getAttribute("role")).toBe("tab");
      expect(tabA?.getAttribute("aria-controls")).toBe("panel-a");
      expect(tabA?.getAttribute("aria-selected")).toBe("true");
      expect(tabA?.getAttribute("data-selected")).toBe("true");
      expect(panelA?.getAttribute("role")).toBe("tabpanel");
      expect(panelA?.hasAttribute("hidden")).toBe(false);
      expect(panelB?.hasAttribute("hidden")).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports manual selection helpers", () =>
    Effect.gen(function* () {
      const state = yield* Tabs.makeState({ selectedId: "tab-a", activationMode: "manual" });
      yield* Tabs.select(state, "tab-b");
      expect((yield* state).selectedId).toBe("tab-b");
    }).pipe(Effect.scoped, Effect.runPromise));
});
