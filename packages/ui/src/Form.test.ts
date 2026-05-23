import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Form from "./Form.js";

describe("typed/ui/Form", () => {
  it("validates values with a schema and exposes errors", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState({
        values: { email: "" },
        schema: Schema.Struct({ email: Schema.String.check(Schema.isMinLength(1)) }),
      });

      const exit = yield* Form.validate(state).pipe(Effect.exit);

      assert.strictEqual(exit._tag, "Failure");
      expect((yield* state).errors.email).toBeTruthy();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("pushes and removes array field values", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState({ values: { tags: ["one"] as string[] } });

      yield* Form.pushValue(state, "tags", "two");
      expect((yield* state).values.tags).toEqual(["one", "two"]);

      yield* Form.removeValue(state, "tags", 0);
      expect((yield* state).values.tags).toEqual(["two"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders Push and Remove buttons for array fields", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Form.makeState({ values: { tags: ["one"] as string[] } });
      const [push] = yield* render(
        Form.Push({ state, name: "tags", value: "two", content: "Add" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [remove] = yield* render(
        Form.Remove({ state, name: "tags", index: 0, content: "Remove" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      push.click();
      yield* Effect.sleep(10);
      expect((yield* state).values.tags).toEqual(["one", "two"]);

      remove.click();
      yield* Effect.sleep(10);
      expect((yield* state).values.tags).toEqual(["two"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("tracks field metadata and resets defaults from native reset events", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Form.makeState({ values: { email: "a@example.com" } });
      yield* render(
        Form.Form({
          state,
          content: html`${Form.Input({ state, name: "email" })}${Form.Reset({ content: "Reset" })}`,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const input = window.document.querySelector("input");
      const form = window.document.querySelector("form");
      assert(input instanceof window.HTMLInputElement);
      assert(form instanceof window.HTMLFormElement);

      input.value = "b@example.com";
      input.dispatchEvent(new window.InputEvent("input", { bubbles: true }));
      yield* Effect.sleep(10);
      expect(Form.fieldMeta(yield* state, "email")).toMatchObject({ dirty: true, touched: true });

      form.dispatchEvent(new window.Event("reset", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(10);
      expect((yield* state).values.email).toBe("a@example.com");
      expect(Form.fieldMeta(yield* state, "email")).toMatchObject({ dirty: false, touched: false });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("decodes and encodes DOM values with field schema codecs", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Form.makeState({ values: { age: 1 } });
      yield* render(
        Form.Input({ state, name: "age", codec: Schema.NumberFromString }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const input = window.document.querySelector("input");
      assert(input instanceof window.HTMLInputElement);
      expect(input.value).toBe("1");

      input.value = "42";
      input.dispatchEvent(new window.InputEvent("input", { bubbles: true }));
      yield* Effect.sleep(10);
      expect((yield* state).values.age).toBe(42);
      expect(Form.fieldMeta(yield* state, "age")).toMatchObject({ dirty: true, touched: true });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("validates and submits decoded values through lifecycle handlers", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const submitted: string[] = [];
      const state = yield* Form.makeState({
        values: { email: "typed@example.com" },
        schema: Schema.Struct({ email: Schema.String.check(Schema.isMinLength(1)) }),
      });
      yield* render(
        Form.Form({
          state,
          content: Form.Submit({ content: "Send" }),
          onValidSubmit: (values) =>
            Effect.sync(() => {
              submitted.push(values.email);
            }),
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const form = window.document.querySelector("form");
      assert(form instanceof window.HTMLFormElement);
      form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(10);

      expect(submitted).toEqual(["typed@example.com"]);
      expect((yield* state).submitting).toBe(false);
      expect((yield* state).errors).toEqual({});
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
