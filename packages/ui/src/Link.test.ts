import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import * as Layer from "effect/Layer";
import { Fx } from "@typed/fx";
import { CurrentPath } from "@typed/navigation";
import { ServerRouter } from "@typed/router/Router";
import { DomRenderTemplate, render } from "@typed/template";
import { Link } from "./Link.js";
import { Window } from "happy-dom";

describe("typed/ui/Link", () => {
  it("renders <a> with href and content", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();

      const [root] = yield* render(
        Link({ href: "/about", content: "Go to about" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const anchor = root as HTMLAnchorElement;
      assert(anchor.tagName === "A");
      assert(anchor.getAttribute("href") === "/about");
      assert(anchor.textContent === "Go to about");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("intercepts same-origin click and navigates", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/about", content: "Go" }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const anchor = root as HTMLAnchorElement;
      assert(anchor.tagName === "A");

      const pathBefore = yield* CurrentPath;
      anchor.click();
      yield* Effect.sleep(50);
      const pathAfter = yield* CurrentPath;

      assert(pathBefore === "/" || pathBefore === "");
      assert(pathAfter === "/about");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("does not intercept when modifier key is pressed", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/other", content: "Go" }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const anchor = root as HTMLAnchorElement;
      assert(anchor.tagName === "A");

      const ev = new window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
      });
      anchor.dispatchEvent(ev);
      yield* Effect.sleep(50);
      const pathAfter = yield* CurrentPath;

      assert(pathAfter === "/" || pathAfter === "");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("keeps an ordinary href available without a router or JavaScript", () => {
    const [window] = createHappyDomLayer();
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/download/report.csv", content: "Download report" }),
        window.document.body,
      ).pipe(Fx.provide(DomRenderTemplate.using(window.document)), Fx.take(1), Fx.collectAll);

      const anchor = root as HTMLAnchorElement;
      assert.strictEqual(anchor.tagName, "A");
      assert.strictEqual(anchor.getAttribute("href"), "/download/report.csv");
      assert.strictEqual(anchor.textContent, "Download report");
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("leaves external and targeted links to the browser", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      for (const [options, intercepted] of [
        [{ href: "https://example.com", target: "_blank" }, false],
        [{ href: "/other", target: "_blank" }, false],
        [{ href: "https://example.com", target: "_self" }, false],
      ] as const) {
        const [root] = yield* render(
          Link({ ...options, content: "Open" }),
          window.document.body,
        ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
        const anchor = root as HTMLAnchorElement;
        const event = new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        });
        anchor.dispatchEvent(event);
        yield* Effect.sleep(10);
        assert.strictEqual(event.defaultPrevented, intercepted);
      }
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("does not intercept native downloads", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/report.csv", content: "Download", download: "report.csv" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;
      const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);
      yield* Effect.sleep(10);
      assert.strictEqual(event.defaultPrevented, false);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("keeps keyboard activation as an anchor affordance", () => {
    const [window] = createHappyDomLayer();
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/keyboard", content: "Keyboard destination" }),
        window.document.body,
      ).pipe(Fx.provide(DomRenderTemplate.using(window.document)), Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;
      anchor.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      assert.strictEqual(anchor.getAttribute("href"), "/keyboard");
    }).pipe(Effect.scoped, Effect.runPromise);
  });
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const domLayer = DomRenderTemplate.using(window.document);
  const opts = params[0] as { url?: string } | undefined;
  const url = opts?.url ?? "http://localhost/";
  const routerLayer = ServerRouter({ url });
  const layer = domLayer.pipe(Layer.merge(routerLayer));
  return [window, layer] as const;
}
