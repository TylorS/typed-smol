import { Effect, Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Form from "../Form.js";

describe("typed/ui/Form", () => {
  it("owns hydration on a native form host", () => Effect.gen(function* () {
    const state = yield* Form.makeState({ values: { email: "" } });
    const markup = yield* renderToHtmlString(Form.Form({ state, content: "Fields" }));
    assert.match(markup, /<form data-typed-refsubject=/);
  }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders a text input for a string form field", () => Effect.gen(function* () {
    const state = yield* Form.makeState({ values: { email: "" } });
    const markup = yield* renderToHtmlString(Form.TextInput({ state, name: "email" }));
    assert.strictEqual(markup.includes('type="text"'), true);
    assert.strictEqual(markup.includes('name="email"'), true);
  }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders a number input for a numeric form field", () => Effect.gen(function* () {
    const state = yield* Form.makeState({ values: { quantity: 0 } });
    const markup = yield* renderToHtmlString(Form.NumberInput({ state, name: "quantity" }));
    assert.strictEqual(markup.includes('type="number"'), true);
  }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders a native label", () => Effect.gen(function* () {
    const markup = yield* renderToHtmlString(Form.Label({ for: "email", content: "Email" }));
    assert.strictEqual(markup.includes('<label for="email">'), true);
  }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("decodes native FormData through a form schema", () => Effect.gen(function* () {
    const data = new FormData();
    data.set("email", "hello@example.com");
    data.set("quantity", "2");
    const values = yield* Form.decodeFormData(
      Schema.Struct({ email: Schema.String, quantity: Schema.FiniteFromString }),
      data,
    );
    assert.deepStrictEqual(values, { email: "hello@example.com", quantity: 2 });
  }).pipe(Effect.runPromise));

  it("round-trips a named-slot mask", () => Effect.gen(function* () {
    const phone = Form.mask(
      "(",
      Form.slot("area", Schema.FiniteFromString, { length: 3 }),
      ") ",
      Form.slot("prefix", Schema.FiniteFromString, { length: 3 }),
      "-",
      Form.slot("line", Schema.FiniteFromString, { length: 4 }),
    );
    const value = { area: 555, prefix: 123, line: 4567 };
    const encoded = yield* Schema.encodeUnknownEffect(phone)(value);
    const decoded = yield* Schema.decodeEffect(phone)(encoded);
    assert.strictEqual(encoded, "(555) 123-4567");
    assert.deepStrictEqual(decoded, value);
  }).pipe(Effect.runPromise));

  it("hydrates the serializable form snapshot", () => Effect.gen(function* () {
    const state = yield* Form.makeState({ values: { email: "" } });
    assert.strictEqual(RefSubject.isHydrationRef(state), true);
    assert.deepStrictEqual((yield* state).values, { email: "" });
  }).pipe(Effect.provideService(RefSubject.CurrentComputedBehavior, "one"), Effect.scoped, Effect.runPromise));
});
