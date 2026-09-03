import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidesDirectory = path.join(websiteRoot, "content/guides");

const readGuide = (fileName: string) => {
  const source = fs.readFileSync(path.join(guidesDirectory, fileName), "utf8");
  return { source, guide: parseGuideDocumentation(fileName, source) };
};

describe("application and platform guides", () => {
  it("separates URL contracts, live routing, renderer targets, hydration, and HTTP adaptation", () => {
    const route = readGuide("route-typed-url-inputs.md");
    const router = readGuide("router-navigation-live-selection.md");
    const navigation = readGuide("navigation-as-an-effect-service.md");
    const dom = readGuide("mounting-dom-output.md");
    const html = readGuide("rendering-html-on-the-server.md");
    const hydration = readGuide("hydrating-typed-html.md");
    const http = readGuide("integrating-matcher-with-effect-http.md");

    for (const { guide } of [route, router, navigation, dom, html, hydration, http]) {
      expect(guide.kind).toBe("guide");
    }

    expect(route.source).toContain('from "@typed/router/Route"');
    expect(route.source).toContain("Route.Type");
    expect(route.source).toContain("RouteDecodeError");
    expect(route.source).toContain("Effect's native `unstable/http/FindMyWay` matcher");
    expect(route.source).toContain("`HttpRouter`");
    expect(route.source).not.toContain("## Matching performs the decode");
    const routeCode = extractTypeScriptFences(route.guide.body).join("\n");
    for (const routeApi of [
      "Route.Parse",
      "Route.Slash",
      "Route.Wildcard",
      "Route.Param",
      "Route.ParamWithSchema",
      "Route.Number",
      "Route.Int",
      "Route.Join",
      "Route.make",
      ".pathSchema",
      ".querySchema",
      ".paramsSchema",
    ]) {
      expect(routeCode).toContain(routeApi);
    }

    expect(router.source).toContain("BrowserRouter");
    expect(router.source).toContain("ServerRouter");
    expect(router.source).toContain("TestRouter");
    expect(router.source).toContain("Navigation.currentEntry");
    expect(router.source).toContain("Effect's native `unstable/http/FindMyWay` matcher");
    expect(router.source).toContain("`HttpRouter`");
    expect(router.source).toMatch(/Effect.*Stream.*Fx/s);
    expect(router.source).toContain("Guard");
    expect(router.source).toContain("dependencies");
    expect(router.source).toContain("layout");
    expect(router.source).toContain("catchTag");
    expect(router.source).toContain("prefix");
    expect(router.source).toContain("merge");
    for (const matcherApi of [
      "Matcher.match",
      "Matcher.empty.match",
      "Matcher.merge",
      "Matcher.catch",
      "Matcher.catchTag",
      "Matcher.catchCause",
      "Matcher.redirectTo",
      "CurrentRoute.extend",
      "Fx.provide(CurrentRoute.extend",
      ".provide(",
      ".provideService(",
      ".provideContext(",
      ".layout(",
      "layout:",
    ]) {
      expect(router.source).toContain(matcherApi);
    }
    expect(router.source).toContain("Guard.fromSchemaDecode");

    for (const navigationApi of [
      "Navigation.currentEntry",
      "Navigation.entries",
      "Navigation.transition",
      "Navigation.canGoBack",
      "Navigation.canGoForward",
      "Navigation.navigate",
      "Navigation.back",
      "Navigation.forward",
      "Navigation.traverseTo",
      "Navigation.updateCurrentEntry",
      "Navigation.reload",
      "Navigation.onBeforeNavigation",
      "Navigation.onNavigation",
      "CurrentPath",
      "useBlockNavigation",
    ]) {
      expect(navigation.source).toContain(navigationApi);
    }

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

  it("uses Effect's Vitest integration for Typed application tests", () => {
    const testing = readGuide("testing-typed-systems.md");

    expect(testing.source).toContain('from "@effect/vitest"');
    expect(testing.source).toContain("it.effect(");
    expect(testing.source).toContain("layer(");
    expect(extractTypeScriptFences(testing.guide.body).join("\n")).not.toContain(
      "Effect.runPromise",
    );
  });

  it("keeps the Route and Router examples independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".routing-guides-check-"));

    try {
      const files = [
        "route-typed-url-inputs.md",
        "router-navigation-live-selection.md",
        "navigation-as-an-effect-service.md",
      ].flatMap((fileName) =>
        extractTypeScriptFences(readGuide(fileName).guide.body).map((code, index) => {
          const file = path.join(staging, `${fileName}-${index}.ts`);
          fs.writeFileSync(file, code);
          return file;
        }),
      );
      const program = ts.createProgram(files, {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);

      expect(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => websiteRoot,
          getNewLine: () => "\n",
        }),
      ).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
});
