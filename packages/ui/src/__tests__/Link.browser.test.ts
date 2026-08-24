import { assert, describe, it } from "vitest";
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { CurrentPath } from "@typed/navigation";
import { ServerRouter } from "@typed/router/Router";
import { DomRenderTemplate, render } from "@typed/template";
import { Link } from "../Link.js";

declare global {
  var __typedUiExecutableUrlRan: boolean | undefined;
}

describe("typed/ui/Link in Chromium", () => {
  it("does not expose or execute a javascript URL", async () => {
    document.body.replaceChildren();
    globalThis.__typedUiExecutableUrlRan = false;

    await Effect.gen(function* () {
      const [root] = yield* render(
        Link({
          href: "javascript:globalThis.__typedUiExecutableUrlRan = true",
          content: "Unsafe",
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;

      assert.strictEqual(anchor.getAttribute("href"), "about:blank");
      anchor.click();
      yield* Effect.sleep(0);

      assert.strictEqual(globalThis.__typedUiExecutableUrlRan, false);
      assert.strictEqual(location.href.startsWith("about:blank"), false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("runs a benign custom handler and performs exactly one SPA navigation", async () => {
    document.body.replaceChildren();
    let clicks = 0;
    const layer = DomRenderTemplate.using(document).pipe(
      Layer.merge(ServerRouter({ url: location.href })),
    );

    await Effect.gen(function* () {
      const [root] = yield* render(
        Link({
          href: "/browser-navigation",
          content: "Navigate",
          onclick: Effect.sync(() => clicks++),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (root as HTMLAnchorElement).click();
      yield* Effect.sleep(10);

      assert.strictEqual(clicks, 1);
      assert.strictEqual(yield* CurrentPath, "/browser-navigation");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("leaves native-intent activations unclaimed", async () => {
    document.body.replaceChildren();
    const layer = DomRenderTemplate.using(document).pipe(
      Layer.merge(ServerRouter({ url: location.href })),
    );

    await Effect.gen(function* () {
      const cases = [
        ["meta", { href: location.href }, { metaKey: true }],
        ["alt", { href: location.href }, { altKey: true }],
        ["control", { href: location.href }, { ctrlKey: true }],
        ["shift", { href: location.href }, { shiftKey: true }],
        ["middle", { href: location.href }, { button: 1 }],
        ["target", { href: location.href, target: "_blank" }, {}],
        ["download", { href: location.href, download: "page.html" }, {}],
        ["external", { href: "https://example.com/" }, {}],
      ] as const;

      for (const [label, options, eventInit] of cases) {
        const [root] = yield* render(Link({ ...options, content: label }), document.body).pipe(
          Fx.take(1),
          Fx.collectAll,
        );
        const anchor = root as HTMLAnchorElement;
        const event = new MouseEvent("click", {
          ...eventInit,
          bubbles: true,
          cancelable: true,
        });
        let preventedByLink: boolean | undefined;
        document.addEventListener(
          "click",
          (nativeEvent) => {
            preventedByLink = nativeEvent.defaultPrevented;
            nativeEvent.preventDefault();
          },
          { once: true },
        );

        anchor.dispatchEvent(event);

        assert.strictEqual(preventedByLink, false, label);
      }
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });
});
