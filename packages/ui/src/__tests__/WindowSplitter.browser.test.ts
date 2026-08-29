import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as WindowSplitter from "../WindowSplitter.js";

describe("typed/ui/WindowSplitter in browsers", () => {
  it("adjusts, collapses, and restores the primary pane with APG keys", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40, step: 10 });
      yield* render(
        WindowSplitter.WindowSplitter({
          state,
          primaryPaneId: "contents",
          label: "Table of contents",
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 50);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 0);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 50);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 0);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 100);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("does not mutate while aria-disabled", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40, step: 10 });
      yield* render(
        WindowSplitter.WindowSplitter({
          state,
          primaryPaneId: "contents",
          label: "Table of contents",
          disabled: true,
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 40);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
