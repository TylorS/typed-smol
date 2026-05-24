import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import * as EventHandler from "../EventHandler.js";
import { HtmlRenderEvent } from "../RenderEvent.js";
import {
  defineServerTemplate,
  defineStaticServerTemplate,
  routeResumeAttrs,
  routeResumeChunk,
  renderOrderedServerChunks,
  renderServerChunks,
} from "./server.js";

describe("compiler-runtime server templates", () => {
  it("renders static and dynamic chunks in source order", async () => {
    const view = defineServerTemplate<[string]>({
      chunks: [
        { kind: "text", text: "<main>" },
        { kind: "slot", valueIndex: 0, valueKind: "plain" },
        { kind: "text", text: "</main>" },
      ],
      templateHash: "server-test",
      render: (values, runtime) => renderServerChunks(values, runtime, [
        { kind: "text", text: "<main>" },
        { kind: "slot", valueIndex: 0, valueKind: "plain" },
        { kind: "text", text: "</main>" },
      ]),
    });

    await expect(view("Hello").renderToString()).resolves.toBe("<main>Hello</main>");
  });

  it("runs dynamic chunks concurrently while preserving output order", async () => {
    const events: string[] = [];
    const slow = Fx.fromEffect(
      Effect.gen(function* () {
        events.push("slow:start");
        yield* Effect.sleep("10 millis");
        events.push("slow:end");
        return "A";
      }),
    );
    const fast = Fx.fromEffect(
      Effect.sync(() => {
        events.push("fast");
        return "B";
      }),
    );

    const html = await Effect.runPromise(
      Effect.map(
        Fx.collectAll(
          renderServerChunks([slow, fast], {}, [
            { kind: "slot", valueIndex: 0, valueKind: "fx" },
            { kind: "slot", valueIndex: 1, valueKind: "fx" },
          ]),
        ),
        (chunks) => chunks.map((event) => event.html).join(""),
      ),
    );

    expect(html).toBe("AB");
    expect(events).toEqual(["slow:start", "fast", "slow:end"]);
  });

  it("forwards nested HtmlRenderEvent slots", async () => {
    const nested = Fx.make<HtmlRenderEvent>((sink) =>
      Effect.gen(function* () {
        yield* sink.onSuccess(HtmlRenderEvent("<span>", false));
        yield* sink.onSuccess(HtmlRenderEvent("nested", false));
        yield* sink.onSuccess(HtmlRenderEvent("</span>", true));
      }),
    );

    await expect(
      defineServerTemplate<[typeof nested]>({
        chunks: [{ kind: "slot", valueIndex: 0, valueKind: "fx" }],
        templateHash: "nested-test",
        render: (values, runtime) => renderServerChunks(values, runtime, [
          { kind: "slot", valueIndex: 0, valueKind: "fx" },
        ]),
      })(nested).renderToString(),
    ).resolves.toBe("<span>nested</span>");
  });

  it("exposes ordered rendering under the explicit ordered helper name", async () => {
    const html = await Effect.runPromise(
      Effect.map(
        Fx.collectAll(renderOrderedServerChunks(["A"], {}, [
          { kind: "text", text: "<main>" },
          { kind: "slot", valueIndex: 0, valueKind: "plain" },
          { kind: "text", text: "</main>" },
        ])),
        (events) => events.map((event) => event.html).join(""),
      ),
    );

    expect(html).toBe("<main>A</main>");
  });

  it("defines static server templates without dynamic scheduling", async () => {
    await expect(
      defineStaticServerTemplate({
        html: "<main>Static</main>",
        templateHash: "static-server",
      })().renderToString(),
    ).resolves.toBe("<main>Static</main>");
  });

  it("serializes route resume payloads as escaped data attributes", () => {
    expect(
      routeResumeAttrs({
        "typed-route-resume-id": "/src/routes/profile.ts#closure:route",
        "typed-route-resume-fingerprint": "route:v1",
        "typed-route-resume-value-0-name": "\"tylor\"",
      }),
    ).toMatchInlineSnapshot(
      `" data-typed-route-resume-fingerprint="route:v1" data-typed-route-resume-id="/src/routes/profile.ts#closure:route" data-typed-route-resume-value-0-name="&quot;tylor&quot;""`,
    );
  });

  it("exposes route resume payloads as static server chunks", async () => {
    const html = await Effect.runPromise(
      Effect.map(
        Fx.collectAll(renderServerChunks([], {}, [
          { kind: "text", text: "<div" },
          routeResumeChunk({
            "typed-route-resume-id": "route",
            "typed-route-resume-fingerprint": "fingerprint",
          }),
          { kind: "text", text: "></div>" },
        ])),
        (events) => events.map((event) => event.html).join(""),
      ),
    );

    expect(html).toMatchInlineSnapshot(
      `"<div data-typed-route-resume-fingerprint="fingerprint" data-typed-route-resume-id="route"></div>"`,
    );
  });

  it("renders serializable EventHandler.action descriptors for event chunks", async () => {
    const events = await Effect.runPromise(
      Fx.collectAll(
        renderServerChunks(
          [
            EventHandler.action("typed/ui/Disclosure:action:toggle", "click", () => Effect.void, {
              component: "typed/ui/Disclosure",
            }),
          ],
          {},
          [{ kind: "slot", valueIndex: 0, valueKind: "unknown", mode: "event", name: "click" }],
        ),
      ),
    );

    expect(events.map((event) => event.html).join("")).toMatchInlineSnapshot(
      `" data-typed-action-click-id="typed/ui/Disclosure:action:toggle" data-typed-action-click-event="click" data-typed-action-click-component="typed/ui/Disclosure""`,
    );
  });

  it("renders compiler-provided EventHandler.action descriptors for event chunks", async () => {
    const events = await Effect.runPromise(
      Fx.collectAll(
        renderServerChunks(
          [EventHandler.action("toggle", "click", () => Effect.void)],
          {},
          [{
            action: {
              component: "cmp:/src/Disclosure.ts#Disclosure",
              event: "click",
              id: "cmp:/src/Disclosure.ts#Disclosure:action:toggle",
            },
            kind: "slot",
            mode: "event",
            name: "click",
            valueIndex: 0,
            valueKind: "unknown",
          }],
        ),
      ),
    );

    expect(events.map((event) => event.html).join("")).toMatchInlineSnapshot(
      `" data-typed-action-click-id="cmp:/src/Disclosure.ts#Disclosure:action:toggle" data-typed-action-click-event="click" data-typed-action-click-component="cmp:/src/Disclosure.ts#Disclosure""`,
    );
  });
});
