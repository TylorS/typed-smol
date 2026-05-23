import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";

describe("typed/ui/Composite", () => {
  it("moves through enabled items with loop boundaries", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState([
        { id: "a" },
        { id: "b", disabled: true },
        { id: "c" },
      ]);
      const state = yield* Composite.makeState({ activeId: "a", loop: true });

      expect((yield* Composite.move({ state, collection }, "next")).activeId).toBe("c");
      expect((yield* Composite.move({ state, collection }, "next")).activeId).toBe("a");
      expect((yield* Composite.move({ state, collection }, "previous")).activeId).toBe("c");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves to first and last items without wrapping when loop is false", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState([{ id: "a" }, { id: "b" }]);
      const state = yield* Composite.makeState({ activeId: "a", loop: false });

      expect((yield* Composite.move({ state, collection }, "previous")).activeId).toBe("a");
      expect((yield* Composite.move({ state, collection }, "last")).activeId).toBe("b");
      expect((yield* Composite.move({ state, collection }, "next")).activeId).toBe("b");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("derives roving tabindex and virtual active descendant", () =>
    Effect.gen(function* () {
      const state = yield* Composite.makeState({ activeId: "a", virtualFocus: false });
      expect(yield* Composite.tabIndex(state, "a")).toBe(0);
      expect(yield* Composite.tabIndex(state, "b")).toBe(-1);
      expect(yield* Composite.activeDescendant(state)).toBeUndefined();

      yield* RefSubject.update(state, (current) => ({ ...current, virtualFocus: true }));
      expect(yield* Composite.tabIndex(state, "a")).toBe(-1);
      expect(yield* Composite.activeDescendant(state)).toBe("a");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("maps keyboard input by orientation and rtl", () => {
    expect(Composite.keyMove({ key: "ArrowRight" }, { orientation: "horizontal" })).toBe("next");
    expect(Composite.keyMove({ key: "ArrowRight" }, { orientation: "horizontal", rtl: true })).toBe(
      "previous",
    );
    expect(Composite.keyMove({ key: "ArrowDown" }, { orientation: "vertical" })).toBe("next");
    expect(Composite.keyMove({ key: "Home" }, {})).toBe("first");
    expect(Composite.keyMove({ key: "End" }, {})).toBe("last");
  });

  it("moves with keyboard events and prevents native scrolling only for handled keys", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState([{ id: "a" }, { id: "b" }]);
      const state = yield* Composite.makeState({ activeId: "a", orientation: "vertical" });
      let prevented = 0;

      const handled = yield* Composite.moveByKey(
        {
          key: "ArrowDown",
          preventDefault: () => {
            prevented += 1;
          },
        },
        { state, collection },
      );
      const ignored = yield* Composite.moveByKey({ key: "ArrowRight" }, { state, collection });

      expect(handled).toBe(true);
      expect(ignored).toBe(false);
      expect(prevented).toBe(1);
      expect((yield* state).activeId).toBe("b");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("finds enabled items with typeahead text", () => {
    const items = [
      { id: "a", text: "Archive" },
      { id: "b", text: "Rename", disabled: true },
      { id: "c", text: "Remove" },
    ];

    expect(Composite.typeahead(items, "re", (item) => item.text)).toBe("c");
    expect(Composite.typeahead(items, "x", (item) => item.text)).toBeNull();
  });
});
