import { describe, expect, it } from "vitest";
import { Fx, Sink } from "@typed/fx";
import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import {
  bindDataAttr,
  bindEvent,
  bindNode,
  bindProperties,
  bindSparseAttr,
  bindSparseClass,
  defineDomTemplate,
  defineStaticDomTemplate,
  getCommentAtPath,
  getElementAtPath,
  bootRouteResume,
  provideRouteResumeServices,
  readRouteResumePayload,
  writeRouteResumePayload,
} from "./dom.js";
import * as Context from "effect/Context";
import * as EventHandler from "../EventHandler.js";

describe("compiler-runtime DOM templates", () => {
  it("clones cached static HTML and binds dynamic node parts by path", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const view = defineDomTemplate<[string]>({
      html: "<main><h1>Title</h1><!--n_0--></main>",
      templateHash: "dom-test",
      mount: (instance, values, runtime) => {
        const main = getElementAtPath<HTMLElement>(instance.root, [0]);
        const anchor = getCommentAtPath(main, [1]);

        expect(main.tagName).toBe("MAIN");
        return bindNode(anchor, values[0], "plain", runtime);
      },
    });

    const nodes = await view("Hello").renderInto(root);

    expect(nodes).toHaveLength(1);
    expect(root.innerHTML).toBe("<main><h1>Title</h1>Hello<!--n_0--></main>");
  });

  it("mounts long-lived Fx bindings before renderInto resolves", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const child = Fx.make<Node, never, never>((sink: Sink.Sink<Node>) =>
      Effect.gen(function* () {
        yield* sink.onSuccess(window.document.createTextNode("Live"));
        return yield* Effect.never;
      }),
    );
    const view = defineDomTemplate<[typeof child]>({
      html: "<main><!--n_0--></main>",
      templateHash: "dom-fx-test",
      mount: (instance, values, runtime) =>
        bindNode(
          getCommentAtPath(getElementAtPath(instance.root, [0]), [0]),
          values[0],
          "fx",
          runtime,
        ),
    });

    const nodes = await view(child).renderInto(root);

    expect(nodes).toHaveLength(1);
    expect(root.innerHTML).toBe("<main>Live<!--n_0--></main>");
  });

  it("binds sparse attrs, sparse class, data attrs, and property records", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const view = defineDomTemplate<
      [string, string, Record<string, unknown>, Record<string, unknown>]
    >({
      html: "<button></button>",
      templateHash: "dom-sparse-test",
      mount: (instance, values, runtime) => {
        const button = getElementAtPath<HTMLElement>(instance.root, [0]);
        return Effect.all(
          [
            bindSparseAttr(button, "aria-label", ["Save ", { valueIndex: 0 }], values, runtime),
            bindSparseClass(button, ["primary ", { valueIndex: 1 }], values, runtime),
            bindDataAttr(button, values[2], "plain", runtime),
            bindProperties(button, values[3], "plain", runtime),
          ],
          { concurrency: "unbounded" },
        );
      },
    });

    await view(
      "now",
      "active",
      { userId: 7 },
      { ".value": "Submit", "?disabled": true },
    ).renderInto(root);
    const button = root.querySelector("button") as HTMLButtonElement;

    expect(button.getAttribute("aria-label")).toBe("Save now");
    expect(button.className).toBe("primary active");
    expect(button.dataset.userId).toBe("7");
    expect(button.value).toBe("Submit");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("defines static templates without a mount callback", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const view = defineStaticDomTemplate({
      html: "<main><h1>Static</h1></main>",
      templateHash: "static",
    });

    await view().renderInto(root);

    expect(root.innerHTML).toBe("<main><h1>Static</h1></main>");
  });

  it("writes and reads route resume payloads through data attributes", () => {
    const window = new Window();
    const element = window.document.createElement("div");

    writeRouteResumePayload(element, {
      "typed-route-resume-id": "/src/routes/profile.ts#closure:route",
      "typed-route-resume-fingerprint": "route:v1",
      "typed-route-resume-value-0-name": "\"tylor\"",
    });

    expect(element.outerHTML).toMatchInlineSnapshot(
      `"<div data-typed-route-resume-id="/src/routes/profile.ts#closure:route" data-typed-route-resume-fingerprint="route:v1" data-typed-route-resume-value-0-name="&quot;tylor&quot;"></div>"`,
    );
    expect(readRouteResumePayload(element)).toMatchInlineSnapshot(`
      {
        "typed-route-resume-fingerprint": "route:v1",
        "typed-route-resume-id": "/src/routes/profile.ts#closure:route",
        "typed-route-resume-value-0-name": ""tylor"",
      }
    `);
  });

  it("provides decoded route resume values into generated Context.Service tags", () =>
    Effect.gen(function* () {
      class Name extends Context.Service<Name, string>()("typed:test:name") {}
      const effect = Effect.map(Name, (name) => `hello ${name}`);

      const result = yield* provideRouteResumeServices(effect, ["tylor"], [
        { tag: Name, valueIndex: 0 },
      ]);

      expect(result).toMatchInlineSnapshot(`"hello tylor"`);
    }).pipe(Effect.runPromise));

  it("writes serializable EventHandler.action descriptors onto event targets", async () => {
    const window = new Window();
    const button = window.document.createElement("button");

    await Effect.runPromise(
      bindEvent(
        button,
        "click",
        EventHandler.action("typed/ui/Disclosure:action:toggle", "click", () => Effect.void, {
          component: "typed/ui/Disclosure",
        }),
      ),
    );

    expect(button.outerHTML).toMatchInlineSnapshot(
      `"<button data-typed-action-click-id="typed/ui/Disclosure:action:toggle" data-typed-action-click-event="click" data-typed-action-click-component="typed/ui/Disclosure"></button>"`,
    );
  });

  it("writes compiler-provided EventHandler.action descriptors onto event targets", async () => {
    const window = new Window();
    const button = window.document.createElement("button");

    await Effect.runPromise(
      bindEvent(button, "click", EventHandler.action("toggle", "click", () => Effect.void), {
        component: "cmp:/src/Disclosure.ts#Disclosure",
        event: "click",
        id: "cmp:/src/Disclosure.ts#Disclosure:action:toggle",
      }),
    );

    expect(button.outerHTML).toMatchInlineSnapshot(
      `"<button data-typed-action-click-id="cmp:/src/Disclosure.ts#Disclosure:action:toggle" data-typed-action-click-event="click" data-typed-action-click-component="cmp:/src/Disclosure.ts#Disclosure"></button>"`,
    );
  });

  it("boots load and hover route resume markers from DOM data attributes", async () => {
    const window = new Window();
    const root = window.document.createElement("main");
    root.innerHTML = [
      '<button data-typed-resume="load hover" data-typed-route-resume-id="route"',
      ' data-typed-route-resume-fingerprint="fingerprint"',
      ' data-typed-route-resume-value-0-name="\\"Ada\\""></button>',
    ].join("");
    const events: readonly unknown[] = [];
    const seen: unknown[] = [];

    await Effect.runPromise(
      bootRouteResume(root, {
        resumeRoute: (element, payload, trigger) =>
          Effect.sync(() => seen.push({
            id: payload["typed-route-resume-id"],
            tag: element.tagName,
            trigger,
          })),
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.querySelector("button")?.dispatchEvent(new window.Event("pointerenter"));

    expect(seen).toMatchInlineSnapshot(`
      [
        {
          "id": "route",
          "tag": "BUTTON",
          "trigger": "load",
        },
        {
          "id": "route",
          "tag": "BUTTON",
          "trigger": "hover",
        },
      ]
    `);
    expect(events).toMatchInlineSnapshot(`[]`);
  });
});
