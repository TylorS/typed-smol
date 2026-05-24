import { assert, describe, expectTypeOf, it } from "vitest";
import * as Context from "effect/Context";
import type { Effect } from "effect";
import * as EffectRuntime from "effect/Effect";
import type * as Scope from "effect/Scope";
import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EventHandler,
  HtmlRenderEvent,
  HtmlRenderTemplate,
  type Renderable,
  type RenderTemplate,
} from "@typed/template";
import { Fx } from "@typed/fx";
import type * as Dom from "./Dom.js";
import * as DomRuntime from "./Dom.js";
import * as Button from "./Button.js";

describe("typed/ui/Dom", () => {
  it("maps writable DOM properties to renderable property options", () => {
    expectTypeOf<Dom.ElementProperties<HTMLAnchorElement>>().toMatchTypeOf<{
      readonly href?: Renderable<string | undefined, any, any>;
      readonly target?: Renderable<string | undefined, any, any>;
    }>();

    expectTypeOf<Dom.ElementProperties<HTMLButtonElement>>().toMatchTypeOf<{
      readonly disabled?: Renderable<boolean | undefined, any, any>;
      readonly type?: Renderable<string | undefined, any, any>;
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
      readonly href?: Renderable<string | undefined, any, any>;
    }>();

    expectTypeOf<Dom.OptionsForTag<"button">>().toMatchTypeOf<{
      readonly disabled?: Renderable<boolean | undefined, any, any>;
    }>();
  });

  it("derives host props from the concrete element or tag name", () => {
    const buttonProps: Dom.HostPropsForTag<"button"> = {
      type: "button",
      disabled: false,
      "aria-expanded": "false",
      "data-state": "closed",
      "?hidden": false,
      ".data": { open: "false" },
      ref: () => undefined,
    };
    const anchorProps: Dom.HostPropsForTag<"a"> = {
      href: "/settings",
      target: "_blank",
      rel: "noreferrer",
    };

    expectTypeOf(buttonProps).toExtend<Dom.HostProps<HTMLButtonElement>>();
    expectTypeOf(anchorProps).toExtend<Dom.HostProps<HTMLAnchorElement>>();

    void buttonProps;
    void anchorProps;
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
    }).pipe(EffectRuntime.scoped, EffectRuntime.runPromise));

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

      assert(ref !== undefined);
      yield* ref(element);

      assert.deepStrictEqual(calls, ["user", "internal"]);
    }).pipe(EffectRuntime.scoped, EffectRuntime.runPromise));

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

  it("preserves host renderer service types at the option boundary", () => {
    const host = () => EffectRuntime.flatMap(HostService, () => EffectRuntime.succeed("hosted"));
    const options = {
      content: "Save",
      host,
    };
    const button = Button.Button(options);

    expectTypeOf<EffectRuntime.Services<ReturnType<typeof host>>>().toExtend<HostService>();
    expectTypeOf<Fx.Error<typeof button>>().toEqualTypeOf<never>();
    expectTypeOf<Fx.Services<typeof button>>().toExtend<
      HostService | RenderTemplate | Scope.Scope
    >();
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
              void content;
              assert(EventHandler.isEventHandler(props.onclick));
              yield* props.onclick.handler(new Event("click"));
              return HtmlRenderEvent("hosted", true);
            }),
        },
        {
          onclick: EventHandler.make(() => {
            calls.push("internal");
          }),
        },
        "hosted",
        () => EffectRuntime.succeed("fallback"),
      ).pipe(Fx.provide(HtmlRenderTemplate), Fx.take(1), Fx.collectAll);

      assert.deepStrictEqual(rendered.map(String), ["hosted"]);
      assert.deepStrictEqual(calls, ["user", "internal"]);
    }).pipe(EffectRuntime.scoped, EffectRuntime.runPromise));

  it("renders div host fallbacks with explicit ref propagation", () => {
    const calls: string[] = [];
    const rendered = DomRuntime.renderDivHost(
      {
        role: "tooltip",
        ref: () => {
          calls.push("ref");
        },
      },
      "content",
    );

    expectTypeOf<Fx.Error<typeof rendered>>().toEqualTypeOf<never>();
    expectTypeOf<Fx.Services<typeof rendered>>().toExtend<RenderTemplate | Scope.Scope>();
    assert.deepStrictEqual(calls, []);
  });

  it("keeps primitive host rendering behind Dom.renderHost", () => {
    const sourceDir = dirname(fileURLToPath(import.meta.url));
    const directHostCalls = readdirSync(sourceDir)
      .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
      .filter((fileName) => fileName !== "Dom.ts")
      .flatMap((fileName) =>
        readFileSync(join(sourceDir, fileName), "utf8")
          .split("\n")
          .flatMap((line, index) =>
            line.includes("options.host(")
              ? [`${basename(fileName)}:${index + 1}:${line.trim()}`]
              : [],
          ),
      );

    assert.deepStrictEqual(directHostCalls, []);
  });

  it("keeps overloaded primitive implementations from erasing argument and return types", () => {
    const sourceDir = dirname(fileURLToPath(import.meta.url));
    const erasingImplementations = readdirSync(sourceDir)
      .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
      .flatMap((fileName) =>
        readFileSync(join(sourceDir, fileName), "utf8")
          .split("\n")
          .flatMap((line, index) =>
            line.includes("ReadonlyArray<any>): any") || line.includes("const options: any")
              ? [`${basename(fileName)}:${index + 1}:${line.trim()}`]
              : [],
          ),
      );

    assert.deepStrictEqual(erasingImplementations, []);
  });

  it("keeps host helper casts isolated from the public Dom rendering boundary", () => {
    const sourceDir = dirname(fileURLToPath(import.meta.url));
    const renderingBoundaryCasts = readdirSync(sourceDir)
      .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
      .flatMap((fileName) => {
        let inComponentBoundary = false;
        return readFileSync(join(sourceDir, fileName), "utf8")
          .split("\n")
          .flatMap((line, index) => {
            if (fileName === "Dom.ts" && line.startsWith("function componentBoundary")) {
              inComponentBoundary = true;
            }
            if (fileName === "Dom.ts" && line.startsWith("function toEventHandler")) {
              inComponentBoundary = false;
            }
            return line.includes("as HostProps") ||
              (line.includes("as Component") && !inComponentBoundary)
              ? [`${basename(fileName)}:${index + 1}:${line.trim()}`]
              : [];
          });
      });

    assert.deepStrictEqual(renderingBoundaryCasts, []);
  });
});

class HostService extends Context.Service<HostService, {}>()("typed/ui/test/HostService") {}

// @ts-expect-error readonly DOM properties are intentionally not accepted as property options
const readonlyProperty: Dom.ElementProperties<HTMLAnchorElement> = { attributes: null };

// @ts-expect-error event handler properties are separated from writable property options
const eventAsProperty: Dom.ElementProperties<HTMLAnchorElement> = { onclick: null };

// @ts-expect-error button host props should not accept anchor-only properties
const buttonHref: Dom.HostPropsForTag<"button"> = { href: "/nope" };

// @ts-expect-error anchor host props should not accept button-only properties
const anchorDisabled: Dom.HostPropsForTag<"a"> = { disabled: true };

void readonlyProperty;
void eventAsProperty;
void buttonHref;
void anchorDisabled;
