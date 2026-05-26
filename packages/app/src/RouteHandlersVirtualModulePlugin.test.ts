import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createRouteHandlersVirtualModulePlugin } from "./RouteHandlersVirtualModulePlugin.js";
import type {
  TypeInfoApi,
  TypeInfoFileSnapshot,
  VirtualModuleBuildContext,
} from "@typed/virtual-modules";

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

    expect(source).toMatchInlineSnapshot(`
      "import * as RouteHandlers from "@typed/app/RouteHandlers";
      import * as Article from "./routes/article.js";
      import * as Articlehandler from "./routes/article.handler.js";

      const handlers = RouteHandlers.empty.match(Article.route, Articlehandler.handler);
      export default handlers;
      "
    `);
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

    expect(source).toMatchInlineSnapshot(`
      "import * as RouteHandlers from "@typed/app/RouteHandlers";

      const handlers = RouteHandlers.empty;
      export default handlers;
      "
    `);
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

    expect(source).toMatchInlineSnapshot(`
      "import * as RouteHandlers from "@typed/app/RouteHandlers";
      import * as Article from "./routes/article.js";
      import * as Articlehandler from "./routes/article.handler.js";
      import * as Handlersdependencies from "./routes/_handlers.dependencies.js";

      const handlers = RouteHandlers.empty.match(Article.route, Articlehandler.handler).provide(RouteHandlers.normalizeDependencyInput(Handlersdependencies.default));
      export default handlers;
      "
    `);
  });

  it("emits the default handler collection when production requests default", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-route-handlers-default-"));
    const routes = join(root, "src/routes");
    mkdirSync(routes, { recursive: true });
    const routePath = join(routes, "article.ts");
    const handlerPath = join(routes, "article.handler.ts");
    writeFileSync(routePath, "export const route = {};");
    writeFileSync(handlerPath, "export const handler = () => 'server';");

    const plugin = createRouteHandlersVirtualModulePlugin();
    const id = "route-handlers:./routes";
    const importer = join(root, "src/server.ts");
    const source = plugin.build(
      id,
      importer,
      apiWithFiles([routePath, handlerPath]),
      productionContext(id, importer, ["default"]),
    );

    expect(source).toMatchInlineSnapshot(`
      "import * as RouteHandlers from "@typed/app/RouteHandlers";
      import * as Article from "./routes/article.js";
      import * as Articlehandler from "./routes/article.handler.js";

      const handlers = RouteHandlers.empty.match(Article.route, Articlehandler.handler);
      export default handlers;
      "
    `);
  });

  it("emits the default handler collection when production requests default as type-only", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-route-handlers-type-default-"));
    const routes = join(root, "src/routes");
    mkdirSync(routes, { recursive: true });
    const routePath = join(routes, "article.ts");
    const handlerPath = join(routes, "article.handler.ts");
    writeFileSync(routePath, "export const route = {};");
    writeFileSync(handlerPath, "export const handler = () => 'server';");

    const plugin = createRouteHandlersVirtualModulePlugin();
    const id = "route-handlers:./routes";
    const importer = join(root, "src/server.ts");
    const source = plugin.build(
      id,
      importer,
      apiWithFiles([routePath, handlerPath]),
      productionContext(id, importer, [], ["default"]),
    );

    expect(source).toContain("export default handlers;");
  });

  it("returns an empty module when production requests no route handler export", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-route-handlers-unrequested-"));
    const routes = join(root, "src/routes");
    mkdirSync(routes, { recursive: true });
    const routePath = join(routes, "article.ts");
    const handlerPath = join(routes, "article.handler.ts");
    writeFileSync(routePath, "export const route = {};");
    writeFileSync(handlerPath, "export const handler = () => 'server';");

    const plugin = createRouteHandlersVirtualModulePlugin();
    const id = "route-handlers:./routes";
    const importer = join(root, "src/server.ts");

    expect(
      plugin.build(
        id,
        importer,
        apiWithFiles([routePath, handlerPath]),
        productionContext(id, importer, ["missing"]),
      ),
    ).toBe("export {};");
  });
});

function productionContext(
  id: string,
  importer: string,
  names: readonly string[],
  typeOnlyNames: readonly string[] = [],
): VirtualModuleBuildContext {
  return {
    id,
    rootImporter: importer,
    containingFile: importer,
    consumer: "server",
    requestedExports: {
      kind: "names",
      names: new Set(names),
      typeOnlyNames: new Set(typeOnlyNames),
    },
    closure: {
      kind: "partial",
      requested: new Set([...names, ...typeOnlyNames]),
      pluginDeclared: new Set(),
      typeInfoReachable: new Set(),
      routeOrAppReachable: new Set(),
    },
  };
}

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
    project: () => undefined,
    isAssignableTo: () => false,
    resolveExport: () => undefined,
  };
}
