import { assert, describe, expectTypeOf, it } from "vitest";
import * as Context from "effect/Context";
import type { Effect } from "effect";
import * as EffectRuntime from "effect/Effect";
import { EventHandler, type Renderable } from "@typed/template";
import { Fx } from "@typed/fx";
import type * as Dom from "./Dom.js";
import * as DomRuntime from "./Dom.js";
import * as Button from "./Button.js";

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
    const absentClickHandler: Dom.ElementOptions<HTMLAnchorElement>["onclick"] = null;

    expectTypeOf<EventHandler.EventHandler<MouseEvent, any, any>>().toExtend<
      Button.ButtonOptions["onclick"]
    >();
    expectTypeOf<EventHandler.EventHandler<PointerEvent, any, any>>().toExtend<
      Dom.ElementOptions<HTMLAnchorElement>["onclick"]
    >();
    expectTypeOf<Effect.Effect<unknown, any, any>>().toExtend<
      Dom.ElementOptions<HTMLAnchorElement>["onclick"]
    >();
    expectTypeOf(absentClickHandler).toExtend<Dom.ElementOptions<HTMLAnchorElement>["onclick"]>();
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

  it("chains event handlers with user-first default-prevented semantics", () =>
    EffectRuntime.gen(function* () {
      const calls: string[] = [];
      const user = EventHandler.make((event: Event) => {
        calls.push("user");
        event.preventDefault();
      });
      const internal = EventHandler.make(() => {
        calls.push("internal");
      });
      const event = new Event("click", { cancelable: true });

      yield* DomRuntime.chainEvent(user, internal)!.handler(event);

      assert.deepStrictEqual(calls, ["user"]);
    }).pipe(EffectRuntime.runPromise));

  it("composes refs with user ref before internal ref", () =>
    EffectRuntime.gen(function* () {
      const calls: string[] = [];
      const element = {} as HTMLButtonElement;
      const ref = DomRuntime.composeRefs<HTMLButtonElement>(
        () => {
          calls.push("user");
        },
        () => {
          calls.push("internal");
        },
      );

      yield* ref(element);

      assert.deepStrictEqual(calls, ["user", "internal"]);
    }).pipe(EffectRuntime.runPromise));

  it("splits refs from host props for explicit template ref attributes", () => {
    const ref = () => undefined;
    const split = DomRuntime.splitRef<HTMLButtonElement>({ type: "button", ref });

    assert.strictEqual(split.ref, ref);
    assert.deepStrictEqual(split.props, { type: "button" });
  });

  it("adds host renderer options to element options", () => {
    expectTypeOf<DomRuntime.HostOptions<HTMLButtonElement>>().toMatchTypeOf<{
      readonly host?: unknown;
    }>();
  });

  it("includes host renderer services in component options", () => {
    const button = Button.Button({
      content: "Save",
      host: () => EffectRuntime.flatMap(HostService, () => EffectRuntime.succeed("hosted")),
    });

    expectTypeOf<Fx.Services<typeof button>>().toExtend<HostService>();
  });

  it("centralizes host rendering with merged props", () =>
    EffectRuntime.gen(function* () {
      const calls: string[] = [];
      const rendered = yield* DomRuntime.renderHost(
        {
          props: {
            onclick: EventHandler.make(() => {
              calls.push("user");
            }),
          },
          host: (props, content) =>
            EffectRuntime.gen(function* () {
              yield* props.onclick!.handler(new Event("click"));
              return content;
            }),
        },
        {
          onclick: EventHandler.make(() => {
            calls.push("internal");
          }),
        },
        "hosted",
        () => EffectRuntime.succeed("fallback"),
      );

      assert.strictEqual(rendered, "hosted");
      assert.deepStrictEqual(calls, ["user", "internal"]);
    }).pipe(EffectRuntime.runPromise));
});

class HostService extends Context.Service<HostService, {}>()("typed/ui/test/HostService", {}) {}

// @ts-expect-error readonly DOM properties are intentionally not accepted as property options
const readonlyProperty: Dom.ElementProperties<HTMLAnchorElement> = { attributes: null };

// @ts-expect-error event handler properties are separated from writable property options
const eventAsProperty: Dom.ElementProperties<HTMLAnchorElement> = { onclick: null };

void readonlyProperty;
void eventAsProperty;
