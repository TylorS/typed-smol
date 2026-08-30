import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Popover from "../Popover.js";

describe("typed/ui/Popover in Chromium", () => {
  it("opens an initially hydrated popover after its host is attached", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState({ open: true });
      yield* render(Popover.Content({ state, content: "Actions" }), document.body).pipe(
        Fx.take(1),
        Fx.collectAll,
      );
      yield* Effect.sleep(0);

      assert.strictEqual(document.querySelector("[popover]")?.matches(":popover-open"), true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("synchronizes native popover toggles", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState();
      yield* render(
        [
          Popover.Trigger({ state, controls: "actions", content: "Open" }),
          Popover.Content({
            state,
            content: "Actions",
            props: { id: "actions" },
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("button")!;
      const content = document.querySelector<HTMLElement>("[popover]")!;
      trigger.click();
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), true);
      assert.strictEqual((yield* state).open, true);

      content.hidePopover();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("closes an open manual popover with Escape from its trigger", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState();
      yield* render(
        [
          Popover.Trigger({ state, content: "Open" }),
          Popover.Content({
            state,
            content: "Actions",
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector<HTMLButtonElement>("button")!;
      const content = document.querySelector<HTMLElement>("[popover]")!;
      trigger.click();
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), true);

      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), false);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
