import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "svelte/compiler";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const loadSvelte2Tsx = () => {
  const Module = require("node:module") as { _load: (...args: Array<any>) => unknown };
  const load = Module._load;
  Module._load = (request, parent, ...args) =>
    request === "typescript" && parent?.filename?.includes("svelte2tsx")
      ? require("typescript-compiler")
      : load(request, parent, ...args);
  try {
    return require("svelte2tsx").svelte2tsx as (
      source: string,
      options: { readonly filename: string },
    ) => {
      readonly code: string;
    };
  } finally {
    Module._load = load;
  }
};

const svelte2tsx = loadSvelte2Tsx();

const recipe = (name: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../content/recipes/${name}.md`, import.meta.url)),
    "utf8",
  );

const svelteFences = (markdown: string): ReadonlyArray<string> =>
  Array.from(markdown.matchAll(/^```svelte\s*\r?\n([\s\S]*?)^```\s*$/gmu), ([, source]) => source!);

interface TypeScriptFence {
  readonly language: "ts" | "tsx";
  readonly source: string;
}

const typeScriptFences = (markdown: string): ReadonlyArray<TypeScriptFence> =>
  Array.from(
    markdown.matchAll(/^```(ts|tsx|typescript|typescriptreact)\s*\r?\n([\s\S]*?)^```\s*$/gmu),
    ([, language, source]) => ({
      language: language === "tsx" || language === "typescriptreact" ? "tsx" : "ts",
      source: source!,
    }),
  );

const compileTypeScriptFences = (documents: ReadonlyArray<readonly [string, string]>): void => {
  const staging = mkdtempSync(
    path.join(fileURLToPath(new URL("../../../", import.meta.url)), ".recipe-test-"),
  );
  try {
    const files = documents.flatMap(([slug, markdown]) =>
      typeScriptFences(markdown).map(({ language, source }, index) => {
        const file = path.join(staging, `${slug}-${index}.${language}`);
        writeFileSync(file, source);
        return file;
      }),
    );
    const program = ts.createProgram(files, {
      allowJs: false,
      esModuleInterop: true,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      jsx: ts.JsxEmit.ReactJSX,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(
      diagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      ),
    ).toEqual([]);
  } finally {
    rmSync(staging, { force: true, recursive: true });
  }
};

describe("bidirectional integration recipes", () => {
  const react = recipe("react");
  const vue = recipe("vue");
  const svelte = recipe("svelte");
  const webComponent = recipe("web-component");

  it("teaches both ownership directions", () => {
    for (const page of [react, vue, svelte, webComponent]) {
      expect(page).toContain("output inside Typed");
      expect(page).toContain("## Typed output inside");
      expect(page).toContain("Scope");
    }
    for (const page of [vue, svelte]) {
      expect(page).toContain("liftRenderableToFx");
    }
  });

  it("keeps framework-owned and Typed-owned DOM boundaries distinct", () => {
    expect(react).toContain("renderToReadableStream");
    expect(react).toContain("useEffect");
    expect(vue).toContain("createApp");
    expect(vue).toContain("onBeforeUnmount");
    expect(svelte).toContain("Bridge.svelte");
    expect(svelte).toContain("$effect");
    expect(webComponent).toContain("connectedCallback");
    expect(webComponent).toContain("customElements.define");
  });

  it("uses UI components for template-facing setup", () => {
    for (const page of [react, vue, svelte]) {
      expect(page).toContain('from "@typed/ui/Component"');
      expect(page).toContain("component(function*");
      expect(page).not.toMatch(/Fx\.(?:gen|genScoped|fn)\b/u);
    }
  });

  it("runs Typed output through an application-owned ManagedRuntime", () => {
    for (const page of [react, vue, svelte, webComponent]) {
      expect(page).toContain("ManagedRuntime.make");
      expect(page).toContain("runtime.runFork");
      expect(page).not.toContain("Effect.runFork");
    }
  });

  it("covers framework HTML output and Typed HTML output", () => {
    for (const page of [vue, svelte, webComponent]) {
      expect(page).toContain("HtmlRenderEvent");
      expect(page).toContain("HtmlRenderTemplate");
      expect(page).toContain("renderToHtmlString");
    }
    expect(react).toContain("HtmlRenderEvent");
    expect(react).toContain("renderToReadableStream");
    expect(react).toContain('from "react-dom/server"');
    expect(svelte).toContain('from "svelte/server"');
    expect(vue).toContain('from "vue/server-renderer"');
  });

  it("keeps React's streaming SSR adapter separate from its browser hydration entry", () => {
    const fences = typeScriptFences(react).map(({ source }) => source);
    const server = fences.find((source) => source.includes('from "react-dom/server"'));
    const browser = fences.find((source) => source.includes("hydrateRoot"));

    expect(server).toContain("renderToReadableStream");
    expect(server).toContain("Stream.fromReadableStream");
    expect(server).toContain("Stream.decodeText");
    expect(server).toContain("Fx.fromStream");
    expect(server).toContain('HtmlRenderEvent("", true)');
    expect(server).not.toContain("renderToString");
    expect(server).not.toContain("document");
    expect(browser).toContain("hydrateRoot");
    expect(browser).toContain("document.getElementById");
  });

  it("shows React components as TSX instead of createElement calls", () => {
    expect(typeScriptFences(react).some(({ language }) => language === "tsx")).toBe(true);
    expect(react).not.toMatch(/import\s*\{[^}]*\bcreateElement\b[^}]*\}\s*from\s*["']react["']/u);
    expect(react).not.toContain("React.createElement(");
  });

  it("type-checks every TypeScript fence against the installed public packages", () => {
    compileTypeScriptFences([
      ["react", react],
      ["vue", vue],
      ["svelte", svelte],
      ["web-component", webComponent],
    ]);
  });

  it("compiles every Svelte fence with the installed Svelte compiler", () => {
    const fences = svelteFences(svelte);
    expect(fences.length).toBeGreaterThan(1);
    for (const source of fences) {
      expect(compile(source, { generate: "client" }).js.code).toContain("function");
    }
  });

  it("keeps the generated Svelte bridge generic for concrete component props", () => {
    const [bridge] = svelteFences(svelte);
    const check = (source: string) =>
      compileTypeScriptFences([
        [
          "svelte-bridge-generated",
          `\`\`\`ts
/// <reference path="../node_modules/svelte2tsx/svelte-shims-v4.d.ts" />
declare function $props<T>(): T;
declare function $state<T>(): T;
declare function $effect(effect: () => void | (() => void)): void;
${svelte2tsx(source, { filename: "Bridge.svelte" }).code.replace(
  /\/\*Ωignore_startΩ\*\/type Bridge__SvelteComponent_[\s\S]*?\/\*Ωignore_endΩ\*\//u,
  "",
)}

type PriceProps = { readonly symbol: string; readonly last: number };
declare const Price: Component<PriceProps>;
declare const props: Readable<PriceProps | undefined>;
Bridge__SvelteComponent_(undefined as never, { component: Price, props });
\`\`\``,
        ],
      ]);
    check(bridge);

    const regressed = bridge.replace(
      "$props<BridgeProps<Props>>()",
      "$props<BridgeProps<Record<string, unknown>>>()",
    );
    expect(() => check(regressed)).toThrow();
  });
});
