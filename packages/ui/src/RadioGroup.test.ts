import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as RadioGroup from "./RadioGroup.js";

describe("typed/ui/RadioGroup", () => {
  it("renders radiogroup/radio roles, checked state, and data attrs", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window ;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* RadioGroup.makeState<string>({ value: "one", activeId: "one" });

      yield* render(
        RadioGroup.Root({
          state,
          label: "Choices",
          content: html`${RadioGroup.Item({ state, id: "one", value: "one", content: "One" })}
          ${RadioGroup.Item({ state, id: "two", value: "two", content: "Two" })}`,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const one = window.document.getElementById("one");
      const two = window.document.getElementById("two");
      expect(window.document.querySelector("[role=radiogroup]")?.getAttribute("aria-label")).toBe(
        "Choices",
      );
      expect(one?.getAttribute("role")).toBe("radio");
      expect(one?.getAttribute("aria-checked")).toBe("true");
      expect(one?.getAttribute("data-checked")).toBe("true");
      expect(two?.getAttribute("aria-checked")).toBe("false");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("changes value on arrow movement unless nested in a toolbar", () =>
    Effect.gen(function* () {
      const normal = yield* RadioGroup.makeState<string>({ value: "one", activeId: "one" });
      yield* RadioGroup.move(
        normal,
        [
          { id: "one", value: "one" },
          { id: "two", value: "two" },
        ],
        "next",
      );
      expect(yield* normal).toMatchObject({ activeId: "two", value: "two" });

      const toolbar = yield* RadioGroup.makeState<string>({ value: "one", activeId: "one", toolbar: true });
      yield* RadioGroup.move(
        toolbar,
        [
          { id: "one", value: "one" },
          { id: "two", value: "two" },
        ],
        "next",
      );
      expect(yield* toolbar).toMatchObject({ activeId: "two", value: "one" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("changes value from root keyboard events", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* RadioGroup.makeState<string>({ value: "one", activeId: "one" });

      yield* render(
        RadioGroup.Root({
          state,
          items: [
            { id: "one", value: "one" },
            { id: "two", value: "two" },
          ],
          content: "Choices",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=radiogroup]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({ activeId: "two", value: "two" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves value with typeahead text", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* RadioGroup.makeState<string>({ value: "one", activeId: "one" });

      yield* render(
        RadioGroup.Root({
          state,
          items: [
            { id: "one", value: "one", textValue: "One" },
            { id: "two", value: "two", textValue: "Two" },
          ],
          content: "Choices",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=radiogroup]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "t", bubbles: true }));
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({ activeId: "two", value: "two" });
    }).pipe(Effect.scoped, Effect.runPromise));
});
