import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseGuideDocumentation } from "../Frontmatter.js";

const guidesDirectory = path.resolve(import.meta.dirname, "../../../content/guides");

const readGuide = (fileName: string) => {
  const source = fs.readFileSync(path.join(guidesDirectory, fileName), "utf8");
  return { source, guide: parseGuideDocumentation(fileName, source) };
};

describe("application and platform guides", () => {
  it("separates URL contracts, live routing, renderer targets, hydration, and HTTP adaptation", () => {
    const route = readGuide("route-typed-url-inputs.md");
    const router = readGuide("router-navigation-live-selection.md");
    const dom = readGuide("mounting-dom-output.md");
    const html = readGuide("rendering-html-on-the-server.md");
    const hydration = readGuide("hydrating-typed-html.md");
    const http = readGuide("integrating-matcher-with-effect-http.md");

    for (const { guide } of [route, router, dom, html, hydration, http]) {
      expect(guide.kind).toBe("guide");
    }

    expect(route.source).toContain('from "@typed/router/Route"');
    expect(route.source).toContain("Route.Type");
    expect(route.source).toContain("RouteDecodeError");

    expect(router.source).toContain("BrowserRouter");
    expect(router.source).toContain("ServerRouter");
    expect(router.source).toContain("TestRouter");
    expect(router.source).toContain("Navigation.currentEntry");

    expect(dom.source).toContain("DomRenderTemplate");
    expect(dom.source).toContain("render(page, document.body)");
    expect(dom.source).not.toContain("ssrForHttp");

    expect(html.source).toContain("renderToHtml");
    expect(html.source).toContain("renderToHtmlString");
    expect(html.source).toContain("StaticHtmlRenderTemplate");
    expect(html.source).not.toContain("HttpRouter");

    expect(hydration.source).toContain("makeHydrateContext");
    expect(hydration.source).toContain("compatible");

    expect(http.source).toContain("ssrForHttp");
    expect(http.source).toContain("streamingSsrForHttp");
    expect(http.source).toContain("handleHttpServerError");
    expect(http.source).toContain("ssrToHttp");
    expect(http.source).toMatch(/no public.*ssrToHttp/is);
    expect(http.guide.order).toBe(10.2);
  });
});
