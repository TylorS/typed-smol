import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Tabs from "./Tabs.js";

describe("typed/ui/Tabs", () => {
  it("renders APG tab roles, selected state, panels, and data attrs", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
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

  it("selects the next tab from list keyboard events in automatic mode", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* Tabs.makeState({ selectedId: "tab-a" });

      yield* render(
        Tabs.List({
          state,
          items: [{ id: "tab-a" }, { id: "tab-b" }],
          content: "Tabs",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=tablist]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(10);

      expect((yield* state).selectedId).toBe("tab-b");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("selects a tab with typeahead text in automatic mode", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* Tabs.makeState({ selectedId: "tab-a" });

      yield* render(
        Tabs.List({
          state,
          items: [
            { id: "tab-a", textValue: "Account" },
            { id: "tab-b", textValue: "Billing" },
          ],
          content: "Tabs",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=tablist]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "b", bubbles: true }));
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({ activeId: "tab-b", selectedId: "tab-b" });
    }).pipe(Effect.scoped, Effect.runPromise));
});
