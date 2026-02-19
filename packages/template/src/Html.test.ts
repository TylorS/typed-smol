import { describe, expect, it } from "vitest";
import type { Scope } from "effect";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import type { RenderEvent, RenderTemplate } from "./index.js";
import {
  html,
  HtmlRenderEvent,
  HtmlRenderTemplate,
  many,
  renderToHtml,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
} from "./index.js";
import { escape } from "./internal/encoding.js";

describe("Html", () => {
  it("static template", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`
            <div>Hello, world!</div>
          `,
        ),
      ).toMatchInlineSnapshot(`"<div>Hello, world!</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dynamic template for text", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div>Hello, ${"Typed"}!</div>`)).toMatchInlineSnapshot(
        `"<div>Hello, Typed!</div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dynamic template for effect", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>Hello, ${Effect.succeed("Typed")}!</div>`),
      ).toMatchInlineSnapshot(`"<div>Hello, Typed!</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dynamic template for fx only takes first value", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div>Hello, ${Fx.mergeAll(Fx.succeed("Typed"), Fx.succeed("Other"))}!</div>`,
        ),
      ).toMatchInlineSnapshot(`"<div>Hello, Typed!</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("streams render events in order", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div>Hello, ${Fx.mergeAll(
            Fx.succeed(HtmlRenderEvent("Typ", false)),
            Fx.succeed(HtmlRenderEvent("ed", true)),
          )}!</div>`,
        ),
      ).toMatchInlineSnapshot(`"<div>Hello, Typed!</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with static attribute", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`
            <div data-foo="Hello, world!"></div>
          `,
        ),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with primitive attribute interpolation", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div data-foo=${"Hello, world!"}></div>`),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with Effect attribute", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div data-foo=${Effect.succeed("Hello, world!")}></div>`),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with reactive Fx attribute", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div data-foo=${Fx.succeed("Hello, world!")}></div>`),
      ).toMatchInlineSnapshot(`"<div data-foo="Hello, world!"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to true", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div ?hidden=${true}></div>`)).toMatchInlineSnapshot(
        `"<div hidden></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to false", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div ?hidden=${false}></div>`)).toMatchInlineSnapshot(
        `"<div></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Effect.succeed(true)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Effect.succeed(true)}></div>`),
      ).toMatchInlineSnapshot(`"<div hidden></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Effect.succeed(false)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Effect.succeed(false)}></div>`),
      ).toMatchInlineSnapshot(`"<div></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Fx.succeed(true)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Fx.succeed(true)}></div>`),
      ).toMatchInlineSnapshot(`"<div hidden></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with ?boolean attribute set to Fx.succeed(false)", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ?hidden=${Fx.succeed(false)}></div>`),
      ).toMatchInlineSnapshot(`"<div></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`
            <div class="foo"></div>
          `,
        ),
      ).toMatchInlineSnapshot(`"<div class="foo"></div>"`);
      expect(yield* getStaticHtml(html`<div class=${"foo"}></div>`)).toMatchInlineSnapshot(
        `"<div class="foo"></div>"`,
      );
      expect(
        yield* getStaticHtml(html`<div class=${Effect.succeed("foo")}></div>`),
      ).toMatchInlineSnapshot(`"<div class="foo"></div>"`);
      expect(
        yield* getStaticHtml(html`<div class=${Fx.succeed("foo")}></div>`),
      ).toMatchInlineSnapshot(`"<div class="foo"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name interpolation", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div class=${"foo bar baz"}></div>`)).toMatchInlineSnapshot(
        `"<div class="foo bar baz"></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name interpolation with holes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div class="${"foo"} ${Effect.succeed("bar")} ${Fx.succeed("baz")}"></div>`,
        ),
      ).toMatchInlineSnapshot(`"<div class="foo bar baz"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with data attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div .data=${{ a: "a", b: Effect.succeed("b"), c: Fx.succeed("c") }} />`,
        ),
      ).toMatchInlineSnapshot(`"<div data-a="a" data-b="b" data-c="c"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`
            <!--Hello, world!-->
          `,
        ),
      ).toMatchInlineSnapshot(`"<!--Hello, world!-->"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments with holes", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<!--${"Hello, world!"}-->`)).toMatchInlineSnapshot(
        `"<!--Hello, world!-->"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments with multiple holes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<!--${"Hello"}, ${Effect.succeed("world")}${Fx.succeed("!")}-->`),
      ).toMatchInlineSnapshot(`"<!--Hello, world!-->"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with property syntax", () =>
    Effect.gen(function* () {
      const x = {};
      expect(
        yield* getStaticHtml(html`<div .foo=${Effect.succeed(x)}></div>`),
      ).toMatchInlineSnapshot(`"<div foo="${escape(JSON.stringify(x))}"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports sparse attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div attr="${"foo"} ${"bar"} ${"baz"}"></div>`),
      ).toMatchInlineSnapshot(`"<div attr="foo bar baz"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<script>console.log("${"Hello, world!"}")</script>`),
      ).toMatchInlineSnapshot(`"<script>console.log("Hello, world!")</script>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements with multiple holes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<script>console.log("${"Hello"}, ${Effect.succeed("world")}${Fx.succeed("!")}")</script>`,
        ),
      ).toMatchInlineSnapshot(`"<script>console.log("Hello, world!")</script>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports spread attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div ...${{ foo: "bar", baz: "qux" }}></div>`),
      ).toMatchInlineSnapshot(`"<div  foo="bar"  baz="qux"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates primitive children", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div>${1}</div>`)).toMatchInlineSnapshot(`"<div>1</div>"`);
      expect(yield* getStaticHtml(html`<div>${"Hello, world!"}</div>`)).toMatchInlineSnapshot(
        `"<div>Hello, world!</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${true}</div>`)).toMatchInlineSnapshot(
        `"<div>true</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${BigInt(1)}</div>`)).toMatchInlineSnapshot(
        `"<div>1</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${Symbol("foo")}</div>`)).toMatchInlineSnapshot(
        `"<div>Symbol(foo)</div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${undefined}</div>`)).toMatchInlineSnapshot(
        `"<div></div>"`,
      );
      expect(yield* getStaticHtml(html`<div>${null}</div>`)).toMatchInlineSnapshot(`"<div></div>"`);
      expect(
        yield* getStaticHtml(html`<div>${[1, " ", "Hello", " ", true]}</div>`),
      ).toMatchInlineSnapshot(`"<div>1 Hello true</div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates html render events", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>${HtmlRenderEvent("<p>Hello, world!</p>", true)}</div>`),
      ).toMatchInlineSnapshot(`"<div><p>Hello, world!</p></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates dom render events", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div>${html`
            <p>Hello, world!</p>
          `}</div>`,
        ),
      ).toMatchInlineSnapshot(`"<div><p>Hello, world!</p></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates array of render events", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div>${[
            html`
              <p>A</p>
            `,
            html`
              <p>B</p>
            `,
          ]}</div>`,
        ),
      ).toMatchInlineSnapshot(`"<div><p>A</p><p>B</p></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders nested templates", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div>${html`<span>${"nested"}</span>`}</div>`),
      ).toMatchInlineSnapshot(`"<div><span>nested</span></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders complex nested structure", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div class="container">${html`<header>${html`<h1>${"Title"}</h1>`}</header>`}${html`<main>${html`<p>${"Content"}</p>`}</main>`}</div>`,
        ),
      ).toMatchInlineSnapshot(
        `"<div class="container"><header><h1>Title</h1></header><main><p>Content</p></main></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with mixed attribute types", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`<div id="test" class=${"dynamic"} ?hidden=${true} data-value=${Effect.succeed("effect")} ...${{
            "aria-label": "accessible",
          }}></div>`,
        ),
      ).toMatchInlineSnapshot(
        `"<div id="test" class="dynamic" hidden data-value="effect"  aria-label="accessible"></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders self-closing tags", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<img src=${"image.jpg"} alt=${"description"} />`),
      ).toMatchInlineSnapshot(`"<img src="image.jpg" alt="description"/>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders void elements", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(
          html`
            <br />
          `,
        ),
      ).toMatchInlineSnapshot(`"<br/>"`);
      expect(
        yield* getStaticHtml(
          html`
            <hr class="separator" />
          `,
        ),
      ).toMatchInlineSnapshot(`"<hr class="separator"/>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with special characters in attributes", () =>
    Effect.gen(function* () {
      expect(
        yield* getStaticHtml(html`<div title=${'Hello & "world" <test>'}></div>`),
      ).toMatchInlineSnapshot(`"<div title="Hello &amp; &quot;world&quot; &lt;test&gt;"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with special characters in text content", () =>
    Effect.gen(function* () {
      expect(yield* getStaticHtml(html`<div>Hello & "world" <test></div>`)).toMatchInlineSnapshot(
        `"<div>Hello & "world" <test></test></div>"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Html Render Events", () => {
  it("renders html render events", () =>
    Effect.gen(function* () {
      const events = yield* getHtmlRenderEvents(
        html`<div>${html`
          <p>Hello, world!</p>
        `}</div>`,
      );

      expect(events).toMatchInlineSnapshot(`
        [
          "<!--t_fqNjm/UcUg8=--><div>",
          "<!--n_0-->",
          "<!--t_ay1Mjj9KxIY=--><p>Hello, world!</p><!--/t_ay1Mjj9KxIY=-->",
          "<!--/n_0-->",
          "</div><!--/t_fqNjm/UcUg8=-->",
        ]
      `);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with many comments", (ctx) =>
    Effect.gen(function* () {
      const para = (n: Fx.Fx<number, never, Scope.Scope>) => html`<p>${n}</p>`;

      const events = yield* getHtmlRenderEvents(para(Fx.succeed(1)));

      ctx.expect(events).toMatchInlineSnapshot(`
        [
          "<!--t_KwZ/fKKViAs=--><p>",
          "<!--n_0-->",
          "1",
          "<!--/n_0-->",
          "</p><!--/t_KwZ/fKKViAs=-->",
        ]
      `);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with array of templates", (ctx) =>
    Effect.gen(function* () {
      const para = (n: Fx.Fx<number, never, Scope.Scope>) => html`<p>${n}</p>`;
      const events = yield* getHtmlRenderEvents(
        html`<div>${[para(Fx.succeed(1)), para(Fx.succeed(2)), para(Fx.succeed(3))]}</div>`,
      );

      ctx.expect(events).toMatchInlineSnapshot(`
          [
            "<!--t_fqNjm/UcUg8=--><div>",
            "<!--n_0-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "1",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "2",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "3",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/n_0-->",
            "</div><!--/t_fqNjm/UcUg8=-->",
          ]
        `);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders with many comments", (ctx) =>
    Effect.gen(function* () {
      const para = (n: Fx.Fx<number, never, Scope.Scope>) => html`<p>${n}</p>`;
      const events = yield* getHtmlRenderEvents(
        html`<div>${many(Fx.succeed([1, 2, 3]), (n) => n, para)}</div>`,
      );

      ctx.expect(events).toMatchInlineSnapshot(`
          [
            "<!--t_fqNjm/UcUg8=--><div>",
            "<!--n_0-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "1",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/m_1-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "2",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/m_2-->",
            "<!--t_KwZ/fKKViAs=--><p>",
            "<!--n_0-->",
            "3",
            "<!--/n_0-->",
            "</p><!--/t_KwZ/fKKViAs=-->",
            "<!--/m_3-->",
            "<!--/n_0-->",
            "</div><!--/t_fqNjm/UcUg8=-->",
          ]
        `);
    }).pipe(Effect.scoped, Effect.runPromise));
});

function getStaticHtml<E, R>(
  renderable: Fx.Fx<RenderEvent, E, R>,
): Effect.Effect<string, E, Exclude<R, RenderTemplate>> {
  return renderToHtmlString(renderable).pipe(Effect.provide(StaticHtmlRenderTemplate));
}

function getHtmlRenderEvents<E, R>(
  renderable: Fx.Fx<RenderEvent, E, R>,
): Effect.Effect<ReadonlyArray<string>, E, Exclude<R, RenderTemplate>> {
  return renderable.pipe(renderToHtml, Fx.collectAll, Effect.provide(HtmlRenderTemplate));
}
