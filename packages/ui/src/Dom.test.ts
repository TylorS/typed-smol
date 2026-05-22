import { describe, expectTypeOf, it } from "vitest";
import type { Effect } from "effect";
import type { EventHandler, Renderable } from "@typed/template";
import type * as Dom from "./Dom.js";

describe("typed/ui/Dom", () => {
  it("maps writable DOM properties to renderable property options", () => {
    expectTypeOf<Dom.ElementProperties<HTMLAnchorElement>>().toMatchTypeOf<{
      readonly href?: Renderable<string, any, any>;
      readonly target?: Renderable<string, any, any>;
    }>();

    expectTypeOf<Dom.ElementProperties<HTMLButtonElement>>().toMatchTypeOf<{
      readonly disabled?: Renderable<boolean, any, any>;
      readonly type?: Renderable<string, any, any>;
    }>();
  });

  it("maps event handlers and refs from the concrete element type", () => {
    const clickHandler: Dom.ElementOptions<HTMLAnchorElement>["onclick"] =
      null as unknown as EventHandler.EventHandler<MouseEvent, any, any>;
    const clickEffect: Dom.ElementOptions<HTMLAnchorElement>["onclick"] =
      null as unknown as Effect.Effect<unknown, any, any>;

    expectTypeOf(clickHandler).toExtend<Dom.ElementOptions<HTMLAnchorElement>["onclick"]>();
    expectTypeOf(clickEffect).toExtend<Dom.ElementOptions<HTMLAnchorElement>["onclick"]>();
    expectTypeOf<Dom.ElementOptions<HTMLAnchorElement>["ref"]>().toExtend<
      ((element: HTMLAnchorElement) => unknown) | undefined
    >();
  });

  it("maps options by tag name", () => {
    expectTypeOf<Dom.OptionsForTag<"a">>().toMatchTypeOf<{
      readonly href?: Renderable<string, any, any>;
    }>();

    expectTypeOf<Dom.OptionsForTag<"button">>().toMatchTypeOf<{
      readonly disabled?: Renderable<boolean, any, any>;
    }>();
  });
});

// @ts-expect-error readonly DOM properties are intentionally not accepted as property options
const readonlyProperty: Dom.ElementProperties<HTMLAnchorElement> = { attributes: null };

// @ts-expect-error event handler properties are separated from writable property options
const eventAsProperty: Dom.ElementProperties<HTMLAnchorElement> = { onclick: null };

void readonlyProperty;
void eventAsProperty;
