import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createBrowserVirtualModulePlugin } from "@typed/app/BrowserVirtualModulePlugin";
import { createServerVirtualModulePlugin } from "@typed/app/ServerVirtualModulePlugin";

const testDir = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(testDir, "../..");

describe("realworld framework entrypoints", () => {
  it("uses typed:server to compose API, routes, SSR, and the client page", () => {
    const serverSource = readSource("server.ts");
    const moduleId = extractTypedModuleId(serverSource, "server");
    const generated = generatedSource(
      createServerVirtualModulePlugin().build(moduleId, resolve(srcRoot, "server.ts"), {} as never),
    );

    expect(moduleId).toBe(
      "typed:server?routes=./routes&api=./api&html=../index.html&client=./browser.ts",
    );
    expect(generated).toContain('import Routes0 from "typed:router?dir=./routes";');
    expect(generated).not.toContain("route-handlers:");
    expect(generated).not.toContain("RouteHandlers.apply");
    expect(generated).toContain('import * as Api0 from "typed:api?dir=./api";');
    expect(generated).toContain('import * as Html0 from "typed:html?path=../index.html";');
    expect(generated).toContain('import { ssrForHttp } from "@typed/ui";');
    expect(generated).toContain(
      'import { composeWithLayers, Ids, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";',
    );
    expect(generated).toContain("HttpRouter.use(ssrForHttp");
    expect(generated).toContain("Ids.Default");
    expect(generated).toContain("TypedHttpServer.toNodeHandler(AppLayer)");
    expect(generated).not.toContain('from "@typed/app";');
    expect(generated).toContain('client: "./browser.ts"');
    expect(generated).not.toContain("options.run");
    expect(generated).not.toContain("readonly run?");
  });

  it("uses typed:browser to hydrate the generated router with @typed/template", () => {
    const browserSource = readSource("browser.ts");
    const moduleId = extractTypedModuleId(browserSource, "browser");
    const generated = generatedSource(
      createBrowserVirtualModulePlugin().build(moduleId, resolve(srcRoot, "browser.ts"), {} as never),
    );

    expect(moduleId).toBe("typed:browser?routes=./routes");
    expect(generated).toContain('import Routes0 from "typed:router?dir=./routes";');
    expect(generated).not.toContain("route-handlers:");
    expect(generated).toContain(
      'import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";',
    );
    expect(generated).toContain("type BrowserLayer<ROut, E, RIn>");
    expect(generated).toContain("function withErrorHandling<A, E, R>");
    expect(generated).not.toContain("Effect.Effect<void, any");
    expect(generated).not.toContain("Cause.Cause<any>");
    expect(generated).not.toContain("TypedAppRuntime");
    expect(generated).toContain('import { Fx } from "@typed/fx";');
    expect(generated).toContain('import { DomRenderTemplate, render } from "@typed/template";');
    expect(generated).toContain("Fx.drainLayer(render(Routes, root))");
    expect(generated).toContain("TypedRouter.BrowserRouter(win)");
    expect(generated).toContain('root: "#app"');
    expect(generated).toContain('mode: "hydrate"');
    expect(generated).not.toContain("options.run");
    expect(generated).not.toContain("readonly run?");
    expect(browserSource).not.toContain("as Effect.Effect");
  });

  it("keeps server and browser entrypoints on one route directory", () => {
    expect(readSource("server.ts")).toContain("typed:server?routes=./routes");
    expect(readSource("browser.ts")).toContain("typed:browser?routes=./routes");
  });
});

function readSource(path: string): string {
  return readFileSync(resolve(srcRoot, path), "utf8");
}

function extractTypedModuleId(source: string, kind: "browser" | "server"): string {
  const match = source.match(new RegExp(`["'](typed:${kind}\\?[^"']+)["']`));
  if (!match) throw new Error(`missing typed:${kind} import`);
  return match[1];
}

function generatedSource(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "sourceText" in result) {
    const sourceText = result.sourceText;
    if (typeof sourceText === "string") return sourceText;
  }
  throw new Error(JSON.stringify(result));
}
