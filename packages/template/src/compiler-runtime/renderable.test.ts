import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "../RenderEvent.js";
import { runServerSlot } from "./renderable.js";

const collectHtml = (fx: Fx.Fx<HtmlRenderEvent, Error, never>) =>
  Effect.runPromise(Effect.map(Fx.collectAll(fx), (events) => events.map((event) => event.html)));

describe("compiler-runtime renderable helpers", () => {
  it("renders native Stream values on the server through the same initial-only policy as Fx", async () => {
    const html = await collectHtml(runServerSlot("stream", Stream.make("one", "two"), {}));

    expect(html).toEqual(["one"]);
  });

  it("keeps forwarding nested HtmlRenderEvent streams until their last event", async () => {
    const html = await collectHtml(
      runServerSlot(
        "fx",
        Fx.make<HtmlRenderEvent>((sink) =>
          Effect.gen(function* () {
            yield* sink.onSuccess(HtmlRenderEvent("<span>", false));
            yield* sink.onSuccess(HtmlRenderEvent("nested", false));
            yield* sink.onSuccess(HtmlRenderEvent("</span>", true));
          }),
        ),
        {},
      ),
    );

    expect(html).toEqual(["<span>", "nested", "</span>"]);
  });
});
