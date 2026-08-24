import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Carousel from "../Carousel.js";

describe("typed/ui/Carousel in browsers", () => {
  it("selects the next registered slide through its native control", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Carousel.makeState({ activeId: "first" });
      const collection = yield* Carousel.makeCollection();
      yield* render(
        Carousel.Root({
          state,
          label: "Slides",
          content: html`${Carousel.Slide({ state, collection, id: "first", label: "1 of 2", content: "First" })}${Carousel.Slide({ state, collection, id: "second", label: "2 of 2", content: "Second" })}${Carousel.Next({ state, collection, content: "Next" })}`,
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("button") as HTMLButtonElement).click();
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "second");
      assert.strictEqual((document.querySelector("#second") as HTMLDivElement).hidden, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
