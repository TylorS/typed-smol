import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Toolbar from "../Toolbar.js";

describe("typed/ui/Toolbar in browsers", () => {
  it("focuses its first enabled item when the toolbar receives focus", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Toolbar.makeState();
      const collection = yield* Toolbar.makeCollection();
      yield* render(
        Toolbar.Root({
          state,
          collection,
          content: html`${Toolbar.Item({ state, collection, id: "first", content: "First" })}${Toolbar.Item({ state, collection, id: "second", content: "Second" })}`,
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector('[role="toolbar"]') as HTMLDivElement).focus();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "first");
      assert.strictEqual(document.activeElement?.id, "first");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("moves focus in DOM order, skipping disabled controls", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Toolbar.makeState({ activeId: "first" });
      const collection = yield* Toolbar.makeCollection();
      yield* render(
        Toolbar.Root({
          state,
          collection,
          content: html`${Toolbar.Item({ state, collection, id: "first", content: "First" })}${Toolbar.Item({ state, collection, id: "skip", disabled: true, content: "Skip" })}${Toolbar.Item({ state, collection, id: "last", content: "Last" })}`,
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const first = document.querySelector("#first") as HTMLDivElement;
      const last = document.querySelector("#last") as HTMLDivElement;
      first.focus();
      first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "last");
      assert.strictEqual(document.activeElement, last);

      last.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "first");
      assert.strictEqual(document.activeElement, first);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
