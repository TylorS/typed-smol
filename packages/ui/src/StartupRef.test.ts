import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { Window } from "happy-dom";
import * as DataAttr from "./DataAttr.js";
import * as StartupRef from "./StartupRef.js";

describe("typed/ui/StartupRef", () => {
  it("hydrates a RefSubject from composed public data attrs", () =>
    Effect.gen(function* () {
      const state = yield* RefSubject.make({ open: false, mode: "auto", selected: "one" });
      const openData = DataAttr.schema({
        open: Schema.Boolean,
        mode: Schema.Union([Schema.Literal("auto"), Schema.Literal("manual")]),
      });
      const selectedData = DataAttr.schema({ selected: Schema.String });
      const window = new Window();
      const element = window.document.createElement("div");
      element.dataset.open = "true";
      element.dataset.mode = "manual";
      element.dataset.selected = "two";

      const ref = StartupRef.compose(
        StartupRef.fromData(state, openData),
        StartupRef.fromData(state, selectedData),
      );

      const result = ref(element);
      if (Effect.isEffect(result)) yield* result;

      expect(yield* state).toEqual({ open: true, mode: "manual", selected: "two" });
    }).pipe(Effect.scoped, Effect.runPromise));
});
