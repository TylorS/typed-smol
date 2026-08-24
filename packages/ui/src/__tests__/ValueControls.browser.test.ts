import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Slider from "../Slider.js";
import * as SpinButton from "../SpinButton.js";
import * as Switch from "../Switch.js";

describe("typed/ui value controls in browsers", () => {
  it("keeps switch state synchronized with its native button activation", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Switch.makeState();
      yield* render(Switch.Switch({ state, content: "Notifications" }), document.body).pipe(
        Fx.take(1),
        Fx.collectAll,
      );

      const control = document.querySelector('[role="switch"]') as HTMLButtonElement;
      control.click();
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).checked, true);
      assert.strictEqual(control.getAttribute("aria-checked"), "true");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("synchronizes native range and number input changes", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const slider = yield* Slider.makeState({ value: 1 });
      const spinButton = yield* SpinButton.makeState({ value: 1 });
      yield* render(
        html`${Slider.Slider({ state: slider, min: 0, max: 10 })}${SpinButton.SpinButton({ state: spinButton, min: 0, max: 10 })}`,
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const [range, number] = document.querySelectorAll("input");
      (range as HTMLInputElement).value = "7";
      range.dispatchEvent(new Event("input", { bubbles: true }));
      (number as HTMLInputElement).value = "4";
      number.dispatchEvent(new Event("change", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* slider).value, 7);
      assert.strictEqual((yield* spinButton).value, 4);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
