import { Effect, Schema } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Form from "../Form.js";

describe("typed/ui/Form in Chromium", () => {
  it("decodes native input into its hydrated field state", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Form.makeState({ values: { quantity: 1 } });
      yield* render(
        html`${Form.Form({
          state,
          content: Form.NumberInput({ state, name: "quantity" }),
        })}`,
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement;
      input.value = "3";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).values.quantity, 3);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("decodes submit FormData through the form codec", async () => {
    document.body.replaceChildren();
    let submitted = 0;
    await Effect.gen(function* () {
      const state = yield* Form.makeState(
        { values: { quantity: 1 } },
        Schema.Struct({ quantity: Schema.FiniteFromString }),
      );
      yield* render(
        html`${Form.Form({
          state,
          content: Form.NumberInput({ state, name: "quantity" }),
          onValidSubmit: (values) => Effect.sync(() => { submitted = values.quantity; }),
        })}`,
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const form = document.querySelector("form")!;
      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement;
      input.value = "7";
      const event = new SubmitEvent("submit", { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      yield* Effect.sleep(0);

      assert.strictEqual(event.defaultPrevented, true);
      assert.strictEqual((yield* state).values.quantity, 7);
      assert.strictEqual(submitted, 7);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("decodes a masked input into its named slot object", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const phone = Form.mask(
        "(",
        Form.slot("area", Schema.FiniteFromString, { length: 3 }),
        ") ",
        Form.slot("line", Schema.FiniteFromString, { length: 4 }),
      );
      const state = yield* Form.makeState({ values: { phone: { area: 555, line: 1234 } } });
      yield* render(
        html`${Form.Form({
          state,
          content: Form.MaskedInput({ state, name: "phone", mask: phone }),
        })}`,
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const input = document.querySelector('input[name="phone"]') as HTMLInputElement;
      input.value = "(212) 8675";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.deepStrictEqual((yield* state).values.phone, { area: 212, line: 8675 });

      input.value = "not a phone";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);

      assert.deepStrictEqual((yield* state).values.phone, { area: 212, line: 8675 });
      assert.notStrictEqual((yield* state).errors.phone, undefined);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
