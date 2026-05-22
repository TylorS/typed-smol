import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import * as Collection from "./Collection.js";

describe("typed/ui/Collection", () => {
  it("registers items, cleans them up, and filters enabled items", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState();
      const cleanupA = yield* Collection.register(collection, { id: "a" });
      yield* Collection.register(collection, { id: "b", disabled: true });

      expect(Collection.enabledItems(yield* collection).map((item) => item.id)).toEqual(["a"]);

      yield* cleanupA;
      expect((yield* collection).map((item) => item.id)).toEqual(["b"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sorts registered items by DOM order", () =>
    Effect.gen(function* () {
      const window = new Window();
      const root = window.document.createElement("div");
      const first = window.document.createElement("button");
      const second = window.document.createElement("button");
      root.append(second, first);

      const collection = yield* Collection.makeState();
      yield* Collection.register(collection, { id: "first", element: first });
      yield* Collection.register(collection, { id: "second", element: second });

      expect(Collection.byDomOrder(yield* collection).map((item) => item.id)).toEqual([
        "second",
        "first",
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
