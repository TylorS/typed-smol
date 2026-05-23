import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Hovercard from "./Hovercard.js";

describe("typed/ui/Hovercard", () => {
  it("renders hovercard content as a native popover and dismisses it natively", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      let hideCount = 0;
      const state = yield* Hovercard.makeState({ id: "profile-card", open: true });
      const [content] = yield* render(
        Hovercard.Content({ state, content: "Profile" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [dismiss] = yield* render(
        Hovercard.Dismiss({ state, content: "Close" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      Object.assign(content, { hidePopover: () => (hideCount += 1) });

      assert(content instanceof window.HTMLElement);
      expect(content.getAttribute("popover")).toBe("auto");
      expect(content.id).toBe("profile-card");
      assert(dismiss instanceof window.HTMLButtonElement);
      dismiss.click();
      yield* Effect.sleep(10);

      expect(hideCount).toBe(1);
      expect((yield* state).open).toBe(false);
      expect(dismiss.getAttribute("popovertarget")).toBe("profile-card");
      expect(dismiss.getAttribute("popovertargetaction")).toBe("hide");
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}

