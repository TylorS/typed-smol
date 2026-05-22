import * as Effect from "effect/Effect";
import { describe, expectTypeOf, it } from "vitest";
import { EventHandler } from "@typed/template";
import type * as Dom from "./Dom.js";

describe("typed/ui/Dom", () => {
  it("maps writable element properties and event handlers", () => {
    expectTypeOf<string>().toExtend<Dom.ElementOptions<HTMLAnchorElement>["href"]>();
    expectTypeOf<EventHandler.EventHandler<PointerEvent, any, any>>().toExtend<
      Dom.ElementOptions<HTMLAnchorElement>["onclick"]
    >();
    expectTypeOf<Effect.Effect<unknown, any, any>>().toExtend<
      Dom.ElementOptions<HTMLAnchorElement>["onclick"]
    >();

    const nullHandler: Dom.ElementOptions<HTMLAnchorElement>["onclick"] = null;
    expectTypeOf(nullHandler).toEqualTypeOf<Dom.ElementOptions<HTMLAnchorElement>["onclick"]>();
  });

  it("keeps readonly element properties out of assignable options", () => {
    expectTypeOf<"a">().toExtend<keyof Dom.OptionsByTagName>();
    expectTypeOf<Dom.OptionsForTag<"button">>().toExtend<Dom.ElementOptions<HTMLButtonElement>>();

    // @ts-expect-error attributes is readonly on Element and should not be an option.
    const readonlyProperty: Dom.ElementProperties<HTMLAnchorElement>["attributes"] = undefined;
    expectTypeOf(readonlyProperty).toBeNever();
  });
});
