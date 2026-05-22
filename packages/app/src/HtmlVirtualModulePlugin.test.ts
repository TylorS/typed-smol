import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { describe, expect, it } from "vitest";
import { createHtmlVirtualModulePlugin } from "./index.js";
import { applySsrOutlet, normalizeClientHtmlPath } from "./internal/emitHtmlSource.js";

const buildHtml = (id: string) =>
  createHtmlVirtualModulePlugin().build(id, "/project/src/entry.server.ts", {} as never);

describe("HtmlVirtualModulePlugin", () => {
  it("resolves valid typed:html ids", () => {
    const plugin = createHtmlVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:html?path=./index.html", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:html", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:env", "/project/src/entry.ts")).toBe(false);
  });

  it("emits html, loadHtml, and renderHtml exports", () => {
    const source = buildHtml("typed:html?path=./index.html") as string;

    expect(source).toContain('import * as TypedConfigModule from "typed:config";');
    expect(source).not.toContain("@ts-nocheck");
    expect(source).toContain('const sourceHtmlPath = "./index.html";');
    expect(source).toContain("const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);");
    expect(source).not.toContain('"dist/client');
    expect(source).toContain("export const html =");
    expect(source).toContain("export async function loadHtml");
    expect(source).toContain("export function renderHtml");
  });

  it("emits custom outlet metadata", () => {
    const source = buildHtml("typed:html?path=./index.html&outlet=%3C%21--app--%3E") as string;

    expect(source).toContain('const outlet = "<!--app-->";');
  });

  it("delegates dev html loading to Vite transformIndexHtml", () => {
    const source = buildHtml("typed:html?path=./index.html") as string;

    expect(source).toContain("devServer.transformIndexHtml");
    expect(source).not.toContain("devServer.middlewares");
  });

  it("references built client html for non-dev loading", () => {
    const source = buildHtml("typed:html?path=./pages/admin.html") as string;

    expect(source).toContain("typedBuildConfig.clientOutDir");
    expect(source).toContain("typedBuildConfig.outDir");
    expect(source).not.toContain('"dist/client/pages/admin.html"');
  });

  it("normalizes parent-relative source html paths into client build paths", () => {
    expect(normalizeClientHtmlPath("../index.html")).toBe("index.html");
    expect(normalizeClientHtmlPath("../pages/admin.html")).toBe("pages/admin.html");
    expect(normalizeClientHtmlPath("./pages/admin.html")).toBe("pages/admin.html");
  });

  it("replaces an existing SSR outlet", () => {
    expect(applySsrOutlet("<main><!--typed-ssr-outlet--></main>", "<p>SSR</p>")).toBe(
      "<main><p>SSR</p></main>",
    );
  });

  it("inserts SSR markup immediately after body when outlet is missing", () => {
    expect(applySsrOutlet("<html><body><main></main></body></html>", "<p>SSR</p>")).toBe(
      "<html><body><p>SSR</p><main></main></body></html>",
    );
  });

  it("does not infer app roots when the SSR outlet is missing", () => {
    expect(applySsrOutlet('<html><body><div id="app"></div></body></html>', "<p>SSR</p>")).toBe(
      '<html><body><p>SSR</p><div id="app"></div></body></html>',
    );
  });

  it("appends SSR markup when outlet and body are missing", () => {
    expect(applySsrOutlet("<main></main>", "<p>SSR</p>")).toBe("<main></main><p>SSR</p>");
  });

  it("returns parser diagnostics from invalid ids", () => {
    const result = buildHtml("typed:html?path=./index.txt") as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-HTML-003",
        message: 'typed:html path must end with ".html"',
        pluginName: "typed-html-virtual-module",
      },
    ]);
  });
});
