import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Tooltip from "./Tooltip.js";

describe("typed/ui/Tooltip", () => {
  it("renders tooltip content as a native hint popover", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const calls: Array<"show" | "hide"> = [];
      const state = yield* Tooltip.makeState({ id: "tip", open: false });
      const [content] = yield* render(
        Tooltip.Content({ state, content: "Help" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      Object.assign(content, {
        showPopover: () => calls.push("show"),
        hidePopover: () => calls.push("hide"),
      });

      assert(content instanceof window.HTMLElement);
      expect(content.getAttribute("popover")).toBe("hint");
      yield* Tooltip.setOpen(state, true);
      yield* Tooltip.setOpen(state, false);

      expect(calls).toEqual(["show", "hide"]);
      expect((yield* state).open).toBe(false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("applies anchor show and hide delays with hover grace", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Tooltip.makeState({ id: "tip", open: false });
      const [anchor] = yield* render(
        Tooltip.Anchor({
          state,
          content: "Help",
          showDelay: 20,
          hideDelay: 30,
          hoverGrace: 30,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      assert(anchor instanceof window.HTMLElement);

      anchor.dispatchEvent(new window.MouseEvent("mouseenter"));
      yield* Effect.sleep(10);
      expect((yield* state).open).toBe(false);
      yield* Effect.sleep(20);
      expect((yield* state).open).toBe(true);

      anchor.dispatchEvent(new window.MouseEvent("mouseleave"));
      yield* Effect.sleep(10);
      anchor.dispatchEvent(new window.MouseEvent("mouseenter"));
      yield* Effect.sleep(35);
      expect((yield* state).open).toBe(true);

      anchor.dispatchEvent(new window.MouseEvent("mouseleave"));
      yield* Effect.sleep(35);
      expect((yield* state).open).toBe(false);
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
