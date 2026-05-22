import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createRouteHandlersVirtualModulePlugin } from "./RouteHandlersVirtualModulePlugin.js";
import type { TypeInfoApi, TypeInfoFileSnapshot } from "@typed/virtual-modules";

describe("RouteHandlersVirtualModulePlugin", () => {
  it("emits a RouteHandlers collection from sibling .handler.ts modules", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-route-handlers-"));
    const routes = join(root, "src/routes");
    mkdirSync(routes, { recursive: true });
    const routePath = join(routes, "article.ts");
    const handlerPath = join(routes, "article.handler.ts");
    writeFileSync(routePath, "export const route = {};");
    writeFileSync(handlerPath, "export const handler = () => 'server';");

    const plugin = createRouteHandlersVirtualModulePlugin();
    const source = plugin.build(
      "route-handlers:./routes",
      join(root, "src/server.ts"),
      apiWithFiles([routePath, handlerPath]),
    );

    expect(source).toContain('import * as RouteHandlers from "@typed/app/RouteHandlers";');
    expect(source).toContain('import * as Article from "./routes/article.js";');
    expect(source).toContain('import * as Articlehandler from "./routes/article.handler.js";');
    expect(source).toContain(
      "const handlers = RouteHandlers.empty.match(Article.route, Articlehandler.handler);",
    );
    expect(source).toContain("export default handlers;");
  });

  it("emits an empty collection when a route directory has no handlers", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-route-handlers-empty-"));
    const routes = join(root, "src/routes");
    mkdirSync(routes, { recursive: true });
    const routePath = join(routes, "index.ts");
    writeFileSync(routePath, "export const route = {};");

    const plugin = createRouteHandlersVirtualModulePlugin();
    const source = plugin.build(
      "route-handlers:./routes",
      join(root, "src/server.ts"),
      apiWithFiles([routePath]),
    );

    expect(source).toContain("const handlers = RouteHandlers.empty;");
    expect(source).toContain("export default handlers;");
  });

  it("emits handler dependency layers without importing them through router modules", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-route-handlers-deps-"));
    const routes = join(root, "src/routes");
    mkdirSync(routes, { recursive: true });
    const routePath = join(routes, "article.ts");
    const handlerPath = join(routes, "article.handler.ts");
    const dependenciesPath = join(routes, "_handlers.dependencies.ts");
    writeFileSync(routePath, "export const route = {};");
    writeFileSync(handlerPath, "export const handler = () => 'server';");
    writeFileSync(dependenciesPath, "export default null;");

    const plugin = createRouteHandlersVirtualModulePlugin();
    const source = plugin.build(
      "route-handlers:./routes",
      join(root, "src/server.ts"),
      apiWithFiles([routePath, handlerPath, dependenciesPath]),
    );

    expect(source).toContain(
      'import * as Handlersdependencies from "./routes/_handlers.dependencies.js";',
    );
    expect(source).toContain(
      ".provide(RouteHandlers.normalizeDependencyInput(Handlersdependencies.default));",
    );
  });
});

function apiWithFiles(files: readonly string[]): TypeInfoApi {
  return {
    directory: () =>
      files.map(
        (filePath): TypeInfoFileSnapshot => ({
          filePath,
          exports: [],
        }),
      ),
    file: () => ({ ok: false, reason: "not needed" }),
    isAssignableTo: () => false,
    resolveExport: () => undefined,
  };
}
