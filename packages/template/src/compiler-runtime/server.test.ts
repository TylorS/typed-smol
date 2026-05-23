import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "../RenderEvent.js";
import { defineServerTemplate, renderServerChunks } from "./server.js";

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
});
