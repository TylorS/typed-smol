import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { RefSubject, Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Menubar from "./Menubar.js";

describe("typed/ui/Menubar", () => {
  it("moves active item from root keyboard events", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* Menubar.makeState({ activeId: "file" });

      yield* render(
        Menubar.Root({
          state,
          items: [{ id: "file" }, { id: "edit" }],
          content: "Items",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=menubar]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(10);

      expect((yield* state).activeId).toBe("edit");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses resolved reactive item ids for active state and focus updates", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const id = yield* RefSubject.make("file");
      const state = yield* Menubar.makeState({ activeId: "file" });
      const [item] = yield* render(
        Menubar.Item({ state, id, content: "File" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      expect(item.getAttribute("id")).toBe("file");
      expect(item.getAttribute("tabindex")).toBe("0");

      yield* RefSubject.set(id, "edit");
      item.dispatchEvent(new window.FocusEvent("focus"));
      yield* Effect.sleep(10);

      expect((yield* state).activeId).toBe("edit");
      expect(item.getAttribute("id")).toBe("edit");
      expect(item.getAttribute("tabindex")).toBe("0");
    }).pipe(Effect.scoped, Effect.runPromise));
});
