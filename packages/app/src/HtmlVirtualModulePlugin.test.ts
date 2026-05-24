import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { describe, expect, it } from "vitest";
import { createHtmlVirtualModulePlugin } from "./index.js";
import { applySsrOutlet, normalizeClientHtmlPath } from "./internal/emitHtmlSource.js";

const buildHtml = (id: string) =>
  createHtmlVirtualModulePlugin().build(id, "/project/src/entry.server.ts", {} as never);

describe("HtmlVirtualModulePlugin", () => {
  it("resolves valid typed:html ids", () => {
    const plugin = createHtmlVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:html?path=./index.html", "/project/src/entry.ts")).toBe(
      true,
    );
    expect(plugin.shouldResolve("typed:html", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:env", "/project/src/entry.ts")).toBe(false);
  });

  it("uses configured path and outlet defaults for bare typed:html ids", () => {
    const plugin = createHtmlVirtualModulePlugin({
      defaultOutlet: "<!--app-->",
      defaultPath: "./shell.html",
    });

    expect(plugin.shouldResolve("typed:html", "/project/src/entry.ts")).toBe(true);
    expect(plugin.build("typed:html", "/project/src/entry.ts", {} as never)).toMatchInlineSnapshot(`
      "import { readFile } from "node:fs/promises";
      import * as TypedConfigModule from "typed:config";
      interface LoadHtmlOptions {
        readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;
        readonly dev?: boolean;
        readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };
        readonly url?: string;
      }
      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };
      const sourceHtmlPath = "./shell.html";
      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);
      const outlet = "<!--app-->";
      export const html = sourceHtmlPath;
      function joinClientBuildPath(sourcePath: string): string {
        const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? "dist", "client");
        return joinPath(clientOutDir, normalizeClientHtmlPath(sourcePath));
      }
      function normalizeClientHtmlPath(sourcePath: string): string {
        return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");
      }
      function isClientHtmlPathSegment(segment: string): boolean {
        return segment !== "" && segment !== "." && segment !== "..";
      }
      function joinPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      export async function loadHtml(options: LoadHtmlOptions = {}) {
        const read = options.readFile ?? readFile;
        if (options.dev && options.devServer) {
          const source = await read(sourceHtmlPath, "utf8");
          return options.devServer.transformIndexHtml(options.url ?? "/", source);
        }
        return read(builtHtmlPath, "utf8");
      }
      export function renderHtml(template: string, markup: string): string {
        if (template.includes(outlet)) return template.replace(outlet, markup);
        const bodyMatch = /<body\\b[^>]*>/i.exec(template);
        if (!bodyMatch) return \`\${template}\${markup}\`;
        const insertAt = bodyMatch.index + bodyMatch[0].length;
        return \`\${template.slice(0, insertAt)}\${markup}\${template.slice(insertAt)}\`;
      }"
    `);
  });

  it("emits html, loadHtml, and renderHtml exports", () => {
    const source = buildHtml("typed:html?path=./index.html") as string;

    expect(source).toMatchInlineSnapshot(`
      "import { readFile } from "node:fs/promises";
      import * as TypedConfigModule from "typed:config";
      interface LoadHtmlOptions {
        readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;
        readonly dev?: boolean;
        readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };
        readonly url?: string;
      }
      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };
      const sourceHtmlPath = "./index.html";
      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);
      const outlet = "<!--typed-ssr-outlet-->";
      export const html = sourceHtmlPath;
      function joinClientBuildPath(sourcePath: string): string {
        const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? "dist", "client");
        return joinPath(clientOutDir, normalizeClientHtmlPath(sourcePath));
      }
      function normalizeClientHtmlPath(sourcePath: string): string {
        return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");
      }
      function isClientHtmlPathSegment(segment: string): boolean {
        return segment !== "" && segment !== "." && segment !== "..";
      }
      function joinPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      export async function loadHtml(options: LoadHtmlOptions = {}) {
        const read = options.readFile ?? readFile;
        if (options.dev && options.devServer) {
          const source = await read(sourceHtmlPath, "utf8");
          return options.devServer.transformIndexHtml(options.url ?? "/", source);
        }
        return read(builtHtmlPath, "utf8");
      }
      export function renderHtml(template: string, markup: string): string {
        if (template.includes(outlet)) return template.replace(outlet, markup);
        const bodyMatch = /<body\\b[^>]*>/i.exec(template);
        if (!bodyMatch) return \`\${template}\${markup}\`;
        const insertAt = bodyMatch.index + bodyMatch[0].length;
        return \`\${template.slice(0, insertAt)}\${markup}\${template.slice(insertAt)}\`;
      }"
    `);
  });

  it("emits custom outlet metadata", () => {
    const source = buildHtml("typed:html?path=./index.html&outlet=%3C%21--app--%3E") as string;

    expect(source).toMatchInlineSnapshot(`
      "import { readFile } from "node:fs/promises";
      import * as TypedConfigModule from "typed:config";
      interface LoadHtmlOptions {
        readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;
        readonly dev?: boolean;
        readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };
        readonly url?: string;
      }
      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };
      const sourceHtmlPath = "./index.html";
      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);
      const outlet = "<!--app-->";
      export const html = sourceHtmlPath;
      function joinClientBuildPath(sourcePath: string): string {
        const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? "dist", "client");
        return joinPath(clientOutDir, normalizeClientHtmlPath(sourcePath));
      }
      function normalizeClientHtmlPath(sourcePath: string): string {
        return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");
      }
      function isClientHtmlPathSegment(segment: string): boolean {
        return segment !== "" && segment !== "." && segment !== "..";
      }
      function joinPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      export async function loadHtml(options: LoadHtmlOptions = {}) {
        const read = options.readFile ?? readFile;
        if (options.dev && options.devServer) {
          const source = await read(sourceHtmlPath, "utf8");
          return options.devServer.transformIndexHtml(options.url ?? "/", source);
        }
        return read(builtHtmlPath, "utf8");
      }
      export function renderHtml(template: string, markup: string): string {
        if (template.includes(outlet)) return template.replace(outlet, markup);
        const bodyMatch = /<body\\b[^>]*>/i.exec(template);
        if (!bodyMatch) return \`\${template}\${markup}\`;
        const insertAt = bodyMatch.index + bodyMatch[0].length;
        return \`\${template.slice(0, insertAt)}\${markup}\${template.slice(insertAt)}\`;
      }"
    `);
  });

  it("delegates dev html loading to Vite transformIndexHtml", () => {
    const source = buildHtml("typed:html?path=./index.html") as string;

    expect(source).toMatchInlineSnapshot(`
      "import { readFile } from "node:fs/promises";
      import * as TypedConfigModule from "typed:config";
      interface LoadHtmlOptions {
        readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;
        readonly dev?: boolean;
        readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };
        readonly url?: string;
      }
      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };
      const sourceHtmlPath = "./index.html";
      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);
      const outlet = "<!--typed-ssr-outlet-->";
      export const html = sourceHtmlPath;
      function joinClientBuildPath(sourcePath: string): string {
        const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? "dist", "client");
        return joinPath(clientOutDir, normalizeClientHtmlPath(sourcePath));
      }
      function normalizeClientHtmlPath(sourcePath: string): string {
        return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");
      }
      function isClientHtmlPathSegment(segment: string): boolean {
        return segment !== "" && segment !== "." && segment !== "..";
      }
      function joinPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      export async function loadHtml(options: LoadHtmlOptions = {}) {
        const read = options.readFile ?? readFile;
        if (options.dev && options.devServer) {
          const source = await read(sourceHtmlPath, "utf8");
          return options.devServer.transformIndexHtml(options.url ?? "/", source);
        }
        return read(builtHtmlPath, "utf8");
      }
      export function renderHtml(template: string, markup: string): string {
        if (template.includes(outlet)) return template.replace(outlet, markup);
        const bodyMatch = /<body\\b[^>]*>/i.exec(template);
        if (!bodyMatch) return \`\${template}\${markup}\`;
        const insertAt = bodyMatch.index + bodyMatch[0].length;
        return \`\${template.slice(0, insertAt)}\${markup}\${template.slice(insertAt)}\`;
      }"
    `);
  });

  it("references built client html for non-dev loading", () => {
    const source = buildHtml("typed:html?path=./pages/admin.html") as string;

    expect(source).toMatchInlineSnapshot(`
      "import { readFile } from "node:fs/promises";
      import * as TypedConfigModule from "typed:config";
      interface LoadHtmlOptions {
        readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;
        readonly dev?: boolean;
        readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };
        readonly url?: string;
      }
      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };
      const sourceHtmlPath = "./pages/admin.html";
      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);
      const outlet = "<!--typed-ssr-outlet-->";
      export const html = sourceHtmlPath;
      function joinClientBuildPath(sourcePath: string): string {
        const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? "dist", "client");
        return joinPath(clientOutDir, normalizeClientHtmlPath(sourcePath));
      }
      function normalizeClientHtmlPath(sourcePath: string): string {
        return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");
      }
      function isClientHtmlPathSegment(segment: string): boolean {
        return segment !== "" && segment !== "." && segment !== "..";
      }
      function joinPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      export async function loadHtml(options: LoadHtmlOptions = {}) {
        const read = options.readFile ?? readFile;
        if (options.dev && options.devServer) {
          const source = await read(sourceHtmlPath, "utf8");
          return options.devServer.transformIndexHtml(options.url ?? "/", source);
        }
        return read(builtHtmlPath, "utf8");
      }
      export function renderHtml(template: string, markup: string): string {
        if (template.includes(outlet)) return template.replace(outlet, markup);
        const bodyMatch = /<body\\b[^>]*>/i.exec(template);
        if (!bodyMatch) return \`\${template}\${markup}\`;
        const insertAt = bodyMatch.index + bodyMatch[0].length;
        return \`\${template.slice(0, insertAt)}\${markup}\${template.slice(insertAt)}\`;
      }"
    `);
  });

  it("normalizes parent-relative source html paths into client build paths", () => {
    expect(normalizeClientHtmlPath("../index.html")).toBe("index.html");
    expect(normalizeClientHtmlPath("../pages/admin.html")).toBe("pages/admin.html");
    expect(normalizeClientHtmlPath("./pages/admin.html")).toBe("pages/admin.html");
  });

  it("replaces an existing SSR outlet", () => {
    expect(applySsrOutlet("<main><!--typed-ssr-outlet--></main>", "<p>SSR</p>"))
      .toMatchInlineSnapshot(`"<main><p>SSR</p></main>"`);
  });

  it("inserts SSR markup immediately after body when outlet is missing", () => {
    expect(applySsrOutlet("<html><body><main></main></body></html>", "<p>SSR</p>"))
      .toMatchInlineSnapshot(`"<html><body><p>SSR</p><main></main></body></html>"`);
  });

  it("does not infer app roots when the SSR outlet is missing", () => {
    expect(applySsrOutlet('<html><body><div id="app"></div></body></html>', "<p>SSR</p>"))
      .toMatchInlineSnapshot(`"<html><body><p>SSR</p><div id="app"></div></body></html>"`);
  });

  it("appends SSR markup when outlet and body are missing", () => {
    expect(applySsrOutlet("<main></main>", "<p>SSR</p>")).toMatchInlineSnapshot(`"<main></main><p>SSR</p>"`);
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
