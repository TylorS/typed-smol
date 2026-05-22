import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import * as Layer from "effect/Layer";
import { Fx, RefSubject } from "@typed/fx";
import { CurrentPath } from "@typed/navigation/Navigation";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import { BrowserRouter, ServerRouter } from "@typed/router/Router";
import { DomRenderTemplate, html, many, render } from "@typed/template";
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

  it("intercepts same-origin clicks when href is reactive", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    const program = Effect.gen(function* () {
      const slug = yield* RefSubject.make("seeded-typed-realworld-1");
      const href = RefSubject.map(slug, (value) => `/article/${value}`);
      const [root] = yield* render(
        Link({ class: "preview-link", href, content: "Article" }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const anchor = root as HTMLAnchorElement;
      assert(anchor.tagName === "A");
      assert(anchor.getAttribute("href") === "/article/seeded-typed-realworld-1");

      anchor.click();
      yield* Effect.sleep(50);
      const pathAfter = yield* CurrentPath;

      assert(pathAfter === "/article/seeded-typed-realworld-1");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);

    return Promise.race([
      program,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Reactive Link did not render or navigate")), 500)
      ),
    ]);
  });

  it("rematches rendered browser routes after internal link clicks", () => {
    const window = new Window({ url: "http://localhost/login" }) as unknown as
      & globalThis.Window
      & typeof globalThis;
    const layer = DomRenderTemplate.using(window.document).pipe(Layer.merge(BrowserRouter(window)));
    const routes = Matcher.empty
      .match(
        Route.Parse("login"),
        Link({ href: "/register", content: "Need an account?" }),
      )
      .match(Route.Parse("register"), html`<h1>Register</h1>`);

    return Effect.gen(function* () {
      const renderValues: string[] = [];
      yield* Fx.observe(render(routes, window.document.body), (rendered) =>
        Effect.sync(() => renderValues.push(rendered.valueOf().textContent ?? "")),
      ).pipe(Effect.forkScoped);
      yield* Effect.sleep(50);

      const link = window.document.querySelector("a");
      assert(link !== null);
      link.click();

      yield* Effect.sleep(50);
      const path = yield* CurrentPath;
      assert.equal(path, "/register");
      assert.equal(window.location.pathname, "/register");
      assert.deepStrictEqual(renderValues, ["Need an account?", "Register"]);
      assert.equal(window.document.querySelector("h1")?.textContent, "Register");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("intercepts nested links rendered from keyed lists", () => {
    const window = new Window({ url: "http://localhost/profile/seed_author" }) as unknown as
      & globalThis.Window
      & typeof globalThis;
    const layer = DomRenderTemplate.using(window.document).pipe(Layer.merge(BrowserRouter(window)));
    return Effect.gen(function* () {
      const articles = yield* RefSubject.make([
        { slug: "seeded-typed-realworld-1", title: "Seeded Typed RealWorld 1" },
      ]);
      const routes = Matcher.empty
        .match(
          Route.Parse("profile/:username"),
          html`${many(
            articles,
            (article) => article.slug,
            (articleRef) => {
              const article = RefSubject.proxy(articleRef);
              const href = RefSubject.map(article.slug, (slug) => `/article/${slug}`);
              return html`<article>
                ${Link({
                  class: "preview-link",
                  href,
                  content: html`<h1>${article.title}</h1><span>Read more...</span>`,
                })}
              </article>`;
            },
          )}`,
        )
        .match(Route.Parse("article/:slug"), html`<h1>Article</h1>`);

      yield* Fx.observe(render(routes, window.document.body), () => Effect.void).pipe(
        Effect.forkScoped,
      );
      yield* Effect.sleep(50);

      const heading = window.document.querySelector(".preview-link h1");
      assert(heading instanceof window.HTMLElement, window.document.body.innerHTML);
      heading.click();

      yield* Effect.sleep(50);
      assert.equal(yield* CurrentPath, "/article/seeded-typed-realworld-1");
      assert.equal(window.document.querySelector("h1")?.textContent, "Article");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
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
