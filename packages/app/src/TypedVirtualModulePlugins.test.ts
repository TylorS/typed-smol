import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import ts from "typescript";
import { createTypeInfoApiSession } from "@typed/virtual-modules";
import * as App from "./index.js";
import { createApiHandlerVirtualModulePlugin } from "./ApiHandlerVirtualModulePlugin.js";
import { createCatchVirtualModulePlugin } from "./CatchVirtualModulePlugin.js";
import { createErrorsVirtualModulePlugin } from "./ErrorsVirtualModulePlugin.js";
import { createGuardVirtualModulePlugin } from "./GuardVirtualModulePlugin.js";
import { createHeadersVirtualModulePlugin } from "./HeadersVirtualModulePlugin.js";
import { createLayoutVirtualModulePlugin } from "./LayoutVirtualModulePlugin.js";
import { createMiddlewaresVirtualModulePlugin } from "./MiddlewaresVirtualModulePlugin.js";
import { createOpenApiVirtualModulePlugin } from "./OpenApiVirtualModulePlugin.js";
import { createPrefixVirtualModulePlugin } from "./PrefixVirtualModulePlugin.js";
import { createRouteTemplateVirtualModulePlugin } from "./RouteTemplateVirtualModulePlugin.js";
import { createServicesVirtualModulePlugin } from "./ServicesVirtualModulePlugin.js";
import {
  createTypedVirtualModulePlugins,
  parseComposableTypedVirtualModuleId,
} from "./TypedVirtualModulePlugins.js";
import { HTTPAPI_TYPE_TARGET_SPECS, ROUTER_TYPE_TARGET_SPECS } from "./internal/typeTargetSpecs.js";

const tempDirs: string[] = [];
const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BOOTSTRAP_FILE = resolve(APP_ROOT, "src", "internal", "typeTargetBootstrap.ts");

function fixture(files: Record<string, string>) {
  const base = join(process.cwd(), "tmp-composable-vm");
  mkdirSync(base, { recursive: true });
  const root = mkdtempSync(join(base, "run-"));
  tempDirs.push(root);
  const paths: string[] = [];
  for (const [path, source] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, source);
    paths.push(full);
  }
  const importer = join(root, "src", "entry.ts");
  if (!files["src/entry.ts"]) {
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(importer, "export {};");
    paths.push(importer);
  }
  return { root, importer, paths };
}

function apiFor(f: ReturnType<typeof fixture>) {
  const program = ts.createProgram({
    rootNames: [...f.paths, BOOTSTRAP_FILE],
    options: {
      allowJs: true,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
    },
  });
  return createTypeInfoApiSession({
    ts,
    program,
    typeTargetSpecs: [...ROUTER_TYPE_TARGET_SPECS, ...HTTPAPI_TYPE_TARGET_SPECS],
  }).api;
}

afterEach(() => {
  while (tempDirs.length > 0) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("parseComposableTypedVirtualModuleId", () => {
  it("parses dir-based concern modules", () => {
    expect(parseComposableTypedVirtualModuleId("typed:services?dir=./routes")).toEqual({
      ok: true,
      kind: "services",
      target: "dir",
      value: "./routes",
    });
  });

  it("parses path-based leaf modules", () => {
    expect(parseComposableTypedVirtualModuleId("typed:api-handler?path=./api/status.ts")).toEqual({
      ok: true,
      kind: "api-handler",
      target: "path",
      value: "./api/status.ts",
    });
  });

  it("rejects URL-shaped targets", () => {
    expect(parseComposableTypedVirtualModuleId("typed:services?dir=https://example.com")).toEqual({
      ok: false,
      code: "CVM-ID-TARGET-002",
      reason: "typed:services dir must be a relative path",
    });
  });

  it("rejects unsupported query options", () => {
    expect(parseComposableTypedVirtualModuleId("typed:guard?dir=./routes&url=/x")).toEqual({
      ok: false,
      code: "CVM-ID-QUERY-001",
      reason: 'typed:guard does not support query option "url"',
    });
  });
});

describe("createTypedVirtualModulePlugins", () => {
  it("is the only convenience aggregate and includes every app VM plugin", () => {
    const individual = [
      "router-virtual-module",
      "route-handlers-virtual-module",
      createServicesVirtualModulePlugin(),
      createGuardVirtualModulePlugin(),
      createLayoutVirtualModulePlugin(),
      createCatchVirtualModulePlugin(),
      createHeadersVirtualModulePlugin(),
      createErrorsVirtualModulePlugin(),
      createMiddlewaresVirtualModulePlugin(),
      createPrefixVirtualModulePlugin(),
      createOpenApiVirtualModulePlugin(),
      createRouteTemplateVirtualModulePlugin(),
      createApiHandlerVirtualModulePlugin(),
      "typed-component-virtual-module",
      "httpapi-virtual-module",
      "typed-env-virtual-module",
      "typed-config-virtual-module",
      "typed-html-virtual-module",
      "typed-server-virtual-module",
      "typed-browser-virtual-module",
      "typed-storybook-virtual-module",
    ].map((plugin) => (typeof plugin === "string" ? plugin : plugin.name));
    const aggregate = createTypedVirtualModulePlugins().map((plugin) => plugin.name);

    expect(aggregate).toEqual(individual);
    const oldComposableAggregateName = [
      "create",
      "Composable",
      "Typed",
      "Virtual",
      "Module",
      "Plugins",
    ].join("");
    expect(oldComposableAggregateName in App).toBe(false);
  });

  it("generates service companion maps", () => {
    const f = fixture({
      "src/routes/_dependencies.ts": "export default [];",
      "src/routes/dashboard.dependencies.ts": "export const dependencies = [];",
      "src/entry.ts": 'import "typed:services?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-services-virtual-module",
    )!;
    const source = plugin.build("typed:services?dir=./routes", f.importer, apiFor(f));

    expect(source).not.toContain("Object.values");
    expect(source).toContain('dependencyLayers["_dependencies.ts"]');
    expect(source).toContain('dependencyLayers["dashboard.dependencies.ts"]');
    expect(source).toMatchInlineSnapshot(`
      "import * as Layer from "effect/Layer";
      import * as Router from "@typed/router";
      import * as RootDependencies from "./routes/_dependencies.js";
      import * as DashboardDependencies from "./routes/dashboard.dependencies.js";

      export const modules = {
        "_dependencies.ts": RootDependencies,
        "dashboard.dependencies.ts": DashboardDependencies
      } as const;
      export const dependencyInputs = {
        "_dependencies.ts": RootDependencies.default,
        "dashboard.dependencies.ts": DashboardDependencies.dependencies
      } as const;
      export const dependencyLayers = {
        "_dependencies.ts": Router.normalizeDependencyInput(RootDependencies.default),
        "dashboard.dependencies.ts": Router.normalizeDependencyInput(DashboardDependencies.dependencies)
      } as const;
      export const dependencyLayerList = [
        dependencyLayers["_dependencies.ts"],
        dependencyLayers["dashboard.dependencies.ts"]
      ] as const;
      export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...dependencyLayerList);
      "
    `);
  });

  it("generates an empty service layer for directories without service companions", () => {
    const f = fixture({
      "src/routes/home.ts": "export const route = {}; export const template = '';",
      "src/entry.ts": 'import "typed:services?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-services-virtual-module",
    )!;
    const source = plugin.build("typed:services?dir=./routes", f.importer, apiFor(f));

    expect(source).not.toContain("Object.values");
    expect(source).toMatchInlineSnapshot(`
      "import * as Layer from "effect/Layer";

      export const modules = {

      } as const;
      export const dependencyInputs = {} as const;
      export const dependencyLayers = {} as const;
      export const DependenciesLayer = Layer.empty;
      "
    `);
  });

  it("generates type-directed service dependency layers", () => {
    const f = fixture({
      "src/routes/_dependencies.ts": `
import * as Context from "effect/Context";
export default null as never as Context.Context<never>;
`,
      "src/routes/dashboard.dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
export class DashboardService extends Context.Service<DashboardService, { readonly value: string }>()("DashboardService") {}
export const dependencies = Layer.succeed(DashboardService, { value: "dashboard" });
`,
      "src/entry.ts": 'import "typed:services?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-services-virtual-module",
    )!;
    const source = plugin.build("typed:services?dir=./routes", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import * as Layer from "effect/Layer";
      import * as RootDependencies from "./routes/_dependencies.js";
      import * as DashboardDependencies from "./routes/dashboard.dependencies.js";

      export const modules = {
        "_dependencies.ts": RootDependencies,
        "dashboard.dependencies.ts": DashboardDependencies
      } as const;
      export const dependencyInputs = {
        "_dependencies.ts": RootDependencies.default,
        "dashboard.dependencies.ts": DashboardDependencies.dependencies
      } as const;
      export const dependencyLayers = {
        "_dependencies.ts": Layer.succeedContext(RootDependencies.default),
        "dashboard.dependencies.ts": DashboardDependencies.dependencies
      } as const;
      export const dependencyLayerList = [
        dependencyLayers["_dependencies.ts"],
        dependencyLayers["dashboard.dependencies.ts"]
      ] as const;
      export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...dependencyLayerList);
      "
    `);
  });

  it("rejects service exports with unsupported dependency shapes", () => {
    const f = fixture({
      "src/routes/_dependencies.ts": "export default { nope: true };",
      "src/entry.ts": 'import "typed:services?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-services-virtual-module",
    )!;
    const result = plugin.build("typed:services?dir=./routes", f.importer, apiFor(f));

    expect(result).toMatchObject({ errors: [{ code: "CVM-SERVICES-002" }] });
  });

  it("generates strict guard maps", () => {
    const f = fixture({
      "src/routes/_guard.ts": `
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
export function guard(): Effect.Effect<Option.Option<unknown>> { return Effect.succeed(Option.none()); }
`,
      "src/entry.ts": 'import "typed:guard?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-guard-virtual-module",
    )!;
    const source = plugin.build("typed:guard?dir=./routes", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import * as Guard from "./routes/_guard.js";

      export const modules = {
        "_guard.ts": Guard
      } as const;
      export const guards = {
        "_guard.ts": Guard.guard
      } as const;
      "
    `);
  });

  it("rejects guard modules whose return type is not Effect<Option<*>>", () => {
    const f = fixture({
      "src/routes/_guard.ts": `
import * as Effect from "effect/Effect";
export const guard = (): Effect.Effect<string> => Effect.succeed("nope");
`,
      "src/entry.ts": 'import "typed:guard?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-guard-virtual-module",
    )!;
    const result = plugin.build("typed:guard?dir=./routes", f.importer, apiFor(f));

    expect(result).toMatchObject({ errors: [{ code: "CVM-GUARD-001" }] });
  });

  it("generates strict layout maps", () => {
    const f = fixture({
      "src/routes/_layout.ts": "export const layout = (x: unknown) => x;",
      "src/entry.ts": 'import "typed:layout?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-layout-virtual-module",
    )!;
    const source = plugin.build("typed:layout?dir=./routes", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import * as Layout from "./routes/_layout.js";

      export const modules = {
        "_layout.ts": Layout
      } as const;
      export const layouts = {
        "_layout.ts": Layout.layout
      } as const;
      "
    `);
  });

  it("generates strict catch maps lifted to catch-cause handlers", () => {
    const f = fixture({
      "src/routes/_catch.ts": "export const catchFn = (error: unknown) => String(error);",
      "src/entry.ts": 'import "typed:catch?dir=./routes";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-catch-virtual-module",
    )!;
    const source = plugin.build("typed:catch?dir=./routes", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";
      import * as Cause from "effect/Cause";
      import * as Effect from "effect/Effect";
      import * as Result from "effect/Result";
      import * as Fx from "@typed/fx/Fx";
      import * as Catch from "./routes/_catch.js";

      export const modules = {
        "_catch.ts": Catch
      } as const;
      export const catchers = {
        "_catch.ts": (causeRef: RefSubject<Cause.Cause<any>>) => Fx.flatMap(causeRef, (cause) => Result.match(Cause.findFail(cause), { onFailure: (c) => Fx.fromEffect(Effect.failCause(c)), onSuccess: ({ error: e }) => Fx.succeed(Catch.catchFn(e)) }))
      } as const;
      "
    `);
  });

  it("generates api handler leaf modules", () => {
    const f = fixture({
      "src/api/status.ts":
        "export const route = { path: '/status' }; export const handler = () => null;",
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-api-handler-virtual-module",
    )!;
    const source = plugin.build("typed:api-handler?path=./api/status.ts", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import * as Endpoint from "./api/status.js";
      import { ApiHandlers } from "@typed/app/httpapi/Handlers";

      export const endpoint = Endpoint;
      export const route = Endpoint.route;
      export const method = Endpoint.method;

      export const metadata = { bodyMode: "empty", raw: false } as const;
      export const handler = ApiHandlers.handler(Endpoint);
      "
    `);
  });

  it("generates api handler payload mode when the endpoint exports body", () => {
    const f = fixture({
      "src/api/status.ts": `
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
export const route = Route.Parse("/status");
export const method = "POST";
export const body = Schema.Struct({ name: Schema.String });
export const handler: (ctx: { readonly body: { readonly name: string } }) => Effect.Effect<{ readonly name: string }> = ({ body }) =>
  Effect.succeed({ name: body.name })
;
`,
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-api-handler-virtual-module",
    )!;
    const source = plugin.build("typed:api-handler?path=./api/status.ts", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import * as Endpoint from "./api/status.js";
      import { ApiHandlers } from "@typed/app/httpapi/Handlers";

      export const endpoint = Endpoint;
      export const route = Endpoint.route;
      export const method = Endpoint.method;
      export const body = Endpoint.body;
      export const metadata = { bodyMode: "payload", raw: false } as const;
      export const handler = ApiHandlers.handler(Endpoint, { body: "payload" });
      "
    `);
  });

  it("does not select payload mode from body export alone", () => {
    const f = fixture({
      "src/api/status.ts": `
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
export const route = Route.Parse("/status");
export const method = "POST";
export const body = Schema.Struct({ name: Schema.String });
export const handler = () => Effect.succeed({ ok: true });
`,
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-api-handler-virtual-module",
    )!;
    const source = plugin.build("typed:api-handler?path=./api/status.ts", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import * as Endpoint from "./api/status.js";
      import { ApiHandlers } from "@typed/app/httpapi/Handlers";

      export const endpoint = Endpoint;
      export const route = Endpoint.route;
      export const method = Endpoint.method;
      export const body = Endpoint.body;
      export const metadata = { bodyMode: "empty", raw: false } as const;
      export const handler = ApiHandlers.handler(Endpoint);
      "
    `);
  });

  it("generates raw api handler mode from HttpServerResponse return type", () => {
    const f = fixture({
      "src/api/raw.ts": `
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
export const route = Route.Parse("/raw");
export const method = "POST";
export const body = Schema.Struct({ name: Schema.String });
export const handler: (ctx: { readonly body: { readonly name: string } }) => Effect.Effect<HttpServerResponse.HttpServerResponse> = ({ body }) =>
  Effect.succeed(HttpServerResponse.json({ name: body.name }))
;
`,
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-api-handler-virtual-module",
    )!;
    const source = plugin.build("typed:api-handler?path=./api/raw.ts", f.importer, apiFor(f));

    expect(source).toMatchInlineSnapshot(`
      "import * as Endpoint from "./api/raw.js";
      import { ApiHandlers } from "@typed/app/httpapi/Handlers";

      export const endpoint = Endpoint;
      export const route = Endpoint.route;
      export const method = Endpoint.method;
      export const body = Endpoint.body;
      export const metadata = { bodyMode: "payload", raw: true } as const;
      export const handler = ApiHandlers.rawHandler(Endpoint, { body: "payload" });
      "
    `);
  });

  it("generates normalized API concern maps", () => {
    const f = fixture({
      "src/api/_api.ts": "export const prefix = '/api';",
      "src/api/_headers.ts": "export const headers = {};",
      "src/api/_errors.ts": "export const error = {};",
      "src/api/_middlewares.ts": "export default 'middleware';",
      "src/api/_prefix.ts": "export const prefix = '/api';",
      "src/api/_openapi.ts": "export default { annotations: { summary: 'api' } };",
      "src/entry.ts": 'import "typed:headers?dir=./api";',
    });
    const plugins = createTypedVirtualModulePlugins();

    expect(
      plugins
        .find((p) => p.name === "typed-headers-virtual-module")!
        .build("typed:headers?dir=./api", f.importer, apiFor(f)),
    ).toMatchInlineSnapshot(`
      "import * as Headers from "./api/_headers.js";

      export const modules = {
        "_headers.ts": Headers
      } as const;
      export const headers = {
        "_headers.ts": Headers.headers
      } as const;
      "
    `);
    expect(
      plugins
        .find((p) => p.name === "typed-errors-virtual-module")!
        .build("typed:errors?dir=./api", f.importer, apiFor(f)),
    ).toMatchInlineSnapshot(`
      "import * as Errors from "./api/_errors.js";

      export const modules = {
        "_errors.ts": Errors
      } as const;
      export const errors = {
        "_errors.ts": Errors.error
      } as const;
      "
    `);
    expect(
      plugins
        .find((p) => p.name === "typed-middlewares-virtual-module")!
        .build("typed:middlewares?dir=./api", f.importer, apiFor(f)),
    ).toMatchInlineSnapshot(`
      "import * as Middlewares from "./api/_middlewares.js";

      export const modules = {
        "_middlewares.ts": Middlewares
      } as const;
      export const middlewares = {
        "_middlewares.ts": Middlewares.default
      } as const;
      "
    `);
    expect(
      plugins
        .find((p) => p.name === "typed-prefix-virtual-module")!
        .build("typed:prefix?dir=./api", f.importer, apiFor(f)),
    ).toMatchInlineSnapshot(`
      "import * as Api from "./api/_api.js";
      import * as Prefix from "./api/_prefix.js";

      export const modules = {
        "_api.ts": Api,
        "_prefix.ts": Prefix
      } as const;
      export const prefixes = {
        "_api.ts": Api.prefix,
        "_prefix.ts": Prefix.prefix
      } as const;
      "
    `);
    expect(
      plugins
        .find((p) => p.name === "typed-prefix-virtual-module")!
        .build("typed:prefix?dir=./api", f.importer, apiFor(f)),
    ).toMatchInlineSnapshot(`
      "import * as Api from "./api/_api.js";
      import * as Prefix from "./api/_prefix.js";

      export const modules = {
        "_api.ts": Api,
        "_prefix.ts": Prefix
      } as const;
      export const prefixes = {
        "_api.ts": Api.prefix,
        "_prefix.ts": Prefix.prefix
      } as const;
      "
    `);
    expect(
      plugins
        .find((p) => p.name === "typed-openapi-virtual-module")!
        .build("typed:openapi?dir=./api", f.importer, apiFor(f)),
    ).toMatchInlineSnapshot(`
      "import * as Openapi from "./api/_openapi.js";

      export const modules = {
        "_openapi.ts": Openapi
      } as const;
      export const openapi = {
        "_openapi.ts": Openapi.default
      } as const;
      "
    `);
  });

  it("generates route template handlers without runtime export fallbacks", () => {
    const f = fixture({
      "src/routes/home.ts": `
import * as Route from "@typed/router";
export const route = Route.Slash;
export const template = "<main/>";
`,
      "src/entry.ts": 'import "typed:route-template?path=./routes/home.ts";',
    });
    const plugin = createTypedVirtualModulePlugins().find(
      (p) => p.name === "typed-route-template-virtual-module",
    )!;
    const source = plugin.build(
      "typed:route-template?path=./routes/home.ts",
      f.importer,
      apiFor(f),
    );

    expect(source).toMatchInlineSnapshot(`
      "import * as Fx from "@typed/fx/Fx";
      import { constant } from "effect/Function";
      import * as RouteModule from "./routes/home.js";

      export const route = RouteModule.route;
      export const entrypoint = {"exportName":"template","runtimeKind":"plain","isFunction":false,"expectsRefSubject":false} as const;
      export const template = RouteModule.template;
      export const handler = constant(Fx.succeed(RouteModule.template));

      "
    `);
  });
});
