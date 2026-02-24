/// <reference types="node" />
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { createTypeInfoApiSession, PluginManager } from "@typed/virtual-modules";
import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import {
  createHttpApiVirtualModulePlugin,
  parseHttpApiVirtualModuleId,
  resolveHttpApiTargetDirectory,
  resolveHttpApiTypeTargets,
} from "./index.js";
import {
  collectExposureRoutes,
  normalizeOpenApiConfig,
  validateOpenApiExposureRouteConflicts,
  validateOpenApiExposureScope,
  validateOpenApiGenerationScope,
} from "./internal/httpapiOpenApiConfig.js";

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const base = join(process.cwd(), "tmp-httpapi-test");
  try {
    mkdirSync(base, { recursive: true });
  } catch {
    // ignore
  }
  const dir = mkdtempSync(join(base, "run-"));
  tempDirs.push(dir);
  return dir;
};

type FixtureSpec = Record<string, string>;

const VALID_ENDPOINT_SOURCE = `
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export const route = {
  path: "/status",
  pathSchema: Schema.Struct({}),
  querySchema: Schema.Struct({}),
};

export const method = "GET";
export const success = Schema.Struct({ status: Schema.Literal("ok") });
export const error = Schema.Struct({ message: Schema.String });

export const handler = ({ path, query, headers, body }: {
  path: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string>;
  body: unknown;
}) => Effect.succeed({ status: "ok" });
`;

function createApiFixture(spec: FixtureSpec): {
  root: string;
  importer: string;
  paths: string[];
} {
  const root = createTempDir();
  const normalized: FixtureSpec = { ...spec };
  if (!("src/entry.ts" in normalized)) {
    normalized["src/entry.ts"] = "export {};";
  }
  const sortedKeys = Object.keys(normalized).sort();
  const paths: string[] = [];
  for (const rel of sortedKeys) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, normalized[rel], "utf8");
    paths.push(abs);
  }
  const importer = join(root, "src/entry.ts");
  return { root, importer, paths };
}

function buildApiFromFixture(spec: FixtureSpec) {
  const fixture = createApiFixture(spec);
  const plugin = createHttpApiVirtualModulePlugin();
  const program = makeProgram(fixture.paths);
  const typeTargets = resolveHttpApiTypeTargets(program, ts);
  const session = createTypeInfoApiSession({ ts, program, typeTargets });
  return plugin.build("api:./apis", fixture.importer, session.api);
}

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NM = join(APP_ROOT, "node_modules");

function makeProgram(rootFiles: readonly string[]): ts.Program {
  const options: ts.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  };
  const fallbacks: Record<string, string> = {
    effect: join(NM, "effect", "dist", "index.d.ts"),
    "effect/Schema": join(NM, "effect", "dist", "Schema.d.ts"),
  };
  const resolvedRoots = rootFiles.map((f) => (fallbacks[f] ?? f));
  return ts.createProgram(resolvedRoots, options);
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  tempDirs.length = 0;
});

describe("parseHttpApiVirtualModuleId", () => {
  it("returns ok with relativeDirectory when id is api:./apis", () => {
    const result = parseHttpApiVirtualModuleId("api:./apis");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.relativeDirectory).toBe("./apis");
  });

  it("normalizes api:apis to api:./apis", () => {
    const result = parseHttpApiVirtualModuleId("api:apis");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.relativeDirectory).toBe("./apis");
  });

  it("returns not ok when id does not start with prefix", () => {
    expect(parseHttpApiVirtualModuleId("router:./routes")).toMatchInlineSnapshot(`
      {
        "ok": false,
        "reason": "id must start with "api:"",
      }
    `);
  });

  it("returns not ok when id is empty after prefix", () => {
    const result = parseHttpApiVirtualModuleId("api:");
    expect(result.ok).toBe(false);
  });
});

describe("resolveHttpApiTargetDirectory", () => {
  it("resolves api:./apis relative to importer directory", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const result = resolveHttpApiTargetDirectory("api:./apis", fixture.importer);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.targetDirectory).toContain("apis");
  });

  it("returns not ok when path escapes base", () => {
    const fixture = createApiFixture({ "src/entry.ts": "export {};" });
    const result = resolveHttpApiTargetDirectory("api:../../../etc", fixture.importer);
    expect(result.ok).toBe(false);
  });
});

describe("createHttpApiVirtualModulePlugin", () => {
  it("shouldResolve returns true when target directory exists with .ts files", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    expect(plugin.shouldResolve("api:./apis", fixture.importer)).toBe(true);
  });

  it("shouldResolve returns false when directory has no script files", () => {
    const fixture = createApiFixture({ "src/apis/readme.txt": "no ts" });
    const plugin = createHttpApiVirtualModulePlugin();
    expect(plugin.shouldResolve("api:./apis", fixture.importer)).toBe(false);
  });

  it("shouldResolve returns false when target directory is missing", () => {
    const fixture = createApiFixture({ "src/entry.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    expect(plugin.shouldResolve("api:./apis", fixture.importer)).toBe(false);
  });

  it("build renders deterministic HttpApi assembly source when contracts are valid", () => {
    const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    expect(typeof result).toBe("string");
    expect(result).toMatchInlineSnapshot(`
      "import { emptyRecordString, emptyRecordStringArray, composeWithLayers, resolveConfig, type AppConfig, type ComputeLayers, type LayerOrGroup, type RunConfig } from "@typed/app";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpApi from "effect/unstable/httpapi/HttpApi";
      import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
      import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";
      import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
      import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
      import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";
      import * as HttpApiSwagger from "effect/unstable/httpapi/HttpApiSwagger";
      import * as HttpServer from "effect/unstable/http/HttpServer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";
      import http from "node:http";
      import { NodeHttpServer } from "@effect/platform-node";
      import * as Status from "./apis/status.js";

      export const Api = HttpApi.make("apis").add(HttpApiGroup.make("root").add(HttpApiEndpoint.get("status", Status.route.path, { params: Status.route.pathSchema, query: Status.route.querySchema, success: Status.success, error: Status.error })));
      export const ApiLayer = HttpApiBuilder.layer(Api).pipe(Layer.provideMerge(HttpApiBuilder.group(Api, "root", (handlers) => handlers.handle("status", (ctx) => Status.handler({ path: ctx.params ?? emptyRecordString, query: ctx.query ?? emptyRecordStringArray, headers: emptyRecordString, body: undefined })))));
      export const OpenApi = OpenApiModule.fromApi(Api);
      export const Swagger = HttpApiSwagger.layer(Api);
      export const Scalar = HttpApiScalar.layer(Api);
      export const Client = HttpApiClient.make(Api);

      export const App = <const Layers extends readonly LayerOrGroup[] = []>(
        config?: AppConfig,
        ...layersToMergeIntoRouter: Layers
      ): Layer.Layer<
        Layer.Success<ComputeLayers<Layers, typeof ApiLayer>>, 
        Layer.Error<ComputeLayers<Layers, typeof ApiLayer>>, 
        Exclude<Layer.Services<ComputeLayers<Layers, typeof ApiLayer>>, HttpRouter.HttpRouter> | HttpServer.HttpServer
      > => {
        const disableListenLog = config?.disableListenLog ?? false;
        const appLayer = composeWithLayers(ApiLayer, layersToMergeIntoRouter) as ComputeLayers<
          Layers,
          typeof ApiLayer
        >;
        return HttpRouter.serve(appLayer, { disableListenLog })
      };

      export const serve = <const Layers extends readonly LayerOrGroup[] = []>(
        config?: RunConfig,
        ...layersToMergeIntoRouter: Layers
      ) =>
        Layer.unwrap(
          Effect.gen(function* () {
            const host = yield* resolveConfig(config?.host, "0.0.0.0");
            const port = yield* resolveConfig(config?.port, 3000);
            const disableListenLog = yield* resolveConfig(config?.disableListenLog, false);
            const appConfig: AppConfig = { disableListenLog };
            const appLayer = App(appConfig, ...layersToMergeIntoRouter);
            const serverLayer = NodeHttpServer.layer(http.createServer, { host, port });
            return appLayer.pipe(Layer.provide(serverLayer));
          }),
        );
      "
    `);
  });

  it("build returns AVM-LEAF-001 when directory has no endpoint primary modules", () => {
    const result = buildApiFromFixture({
      "src/apis/_api.ts": "export const name = 'x';",
      "src/apis/_group.ts": "export const name = 'group';",
      "src/apis/list.openapi.ts": "export default {};",
    });
    expect(result).toHaveProperty("errors");
    const err = result as VirtualModuleBuildError;
    expect(err.errors[0].code).toBe("AVM-LEAF-001");
  });

  it("build returns AVM-CONTRACT-002 when endpoint misses required exports", () => {
    const result = buildApiFromFixture({
      "src/apis/status.ts": "export const route = { path: '/status' };",
    });
    expect(result).toHaveProperty("errors");
    expect((result as VirtualModuleBuildError).errors[0]).toMatchInlineSnapshot(`
      {
        "code": "AVM-CONTRACT-002",
        "message": "endpoint "status.ts" missing required export(s): method, handler",
        "pluginName": "httpapi-virtual-module",
      }
    `);
  });

  it("build returns AVM-CONTRACT-003 when route lacks pathSchema or querySchema", () => {
    const result = buildApiFromFixture({
      "src/apis/status.ts": `
        import * as Effect from "effect/Effect";
        import * as Schema from "effect/Schema";
        export const route = { path: "/status" };
        export const method = "GET";
        export const handler = () => Effect.succeed({});
      `,
    });
    expect(result).toHaveProperty("errors");
    expect((result as VirtualModuleBuildError).errors[0]).toMatchInlineSnapshot(`
      {
        "code": "AVM-CONTRACT-003",
        "message": "endpoint "status.ts" route: export must be Router.Route (Parse, Param, Join, etc.) or object with pathSchema and querySchema",
        "pluginName": "httpapi-virtual-module",
      }
    `);
  });

  it("build returns warnings for unsupported reserved files while still emitting source", () => {
    const fixture = createApiFixture({
      "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
      "src/apis/users/_unknown.ts": "export {};",
    });
    const plugin = createHttpApiVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("api:./apis", fixture.importer, session.api);

    expect(typeof result).toBe("object");
    if (typeof result === "string" || !result || !("sourceText" in result)) {
      throw new Error("expected sourceText + warnings build result");
    }

    const r = result as { sourceText: string; warnings?: Array<{ code: string; message?: string }> };
    expect({ sourceText: r.sourceText, warnings: r.warnings }).toMatchInlineSnapshot(`
      {
        "sourceText": "import { emptyRecordString, emptyRecordStringArray, composeWithLayers, resolveConfig, type AppConfig, type ComputeLayers, type LayerOrGroup, type RunConfig } from "@typed/app";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpApi from "effect/unstable/httpapi/HttpApi";
      import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
      import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";
      import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
      import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
      import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";
      import * as HttpApiSwagger from "effect/unstable/httpapi/HttpApiSwagger";
      import * as HttpServer from "effect/unstable/http/HttpServer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";
      import http from "node:http";
      import { NodeHttpServer } from "@effect/platform-node";
      import * as UsersList from "./apis/users/list.js";

      export const Api = HttpApi.make("apis").add(HttpApiGroup.make("users").add(HttpApiEndpoint.get("list", UsersList.route.path, { params: UsersList.route.pathSchema, query: UsersList.route.querySchema, success: UsersList.success, error: UsersList.error })));
      export const ApiLayer = HttpApiBuilder.layer(Api).pipe(Layer.provideMerge(HttpApiBuilder.group(Api, "users", (handlers) => handlers.handle("list", (ctx) => UsersList.handler({ path: ctx.params ?? emptyRecordString, query: ctx.query ?? emptyRecordStringArray, headers: emptyRecordString, body: undefined })))));
      export const OpenApi = OpenApiModule.fromApi(Api);
      export const Swagger = HttpApiSwagger.layer(Api);
      export const Scalar = HttpApiScalar.layer(Api);
      export const Client = HttpApiClient.make(Api);

      export const App = <const Layers extends readonly LayerOrGroup[] = []>(
        config?: AppConfig,
        ...layersToMergeIntoRouter: Layers
      ): Layer.Layer<
        Layer.Success<ComputeLayers<Layers, typeof ApiLayer>>, 
        Layer.Error<ComputeLayers<Layers, typeof ApiLayer>>, 
        Exclude<Layer.Services<ComputeLayers<Layers, typeof ApiLayer>>, HttpRouter.HttpRouter> | HttpServer.HttpServer
      > => {
        const disableListenLog = config?.disableListenLog ?? false;
        const appLayer = composeWithLayers(ApiLayer, layersToMergeIntoRouter) as ComputeLayers<
          Layers,
          typeof ApiLayer
        >;
        return HttpRouter.serve(appLayer, { disableListenLog })
      };

      export const serve = <const Layers extends readonly LayerOrGroup[] = []>(
        config?: RunConfig,
        ...layersToMergeIntoRouter: Layers
      ) =>
        Layer.unwrap(
          Effect.gen(function* () {
            const host = yield* resolveConfig(config?.host, "0.0.0.0");
            const port = yield* resolveConfig(config?.port, 3000);
            const disableListenLog = yield* resolveConfig(config?.disableListenLog, false);
            const appConfig: AppConfig = { disableListenLog };
            const appLayer = App(appConfig, ...layersToMergeIntoRouter);
            const serverLayer = NodeHttpServer.layer(http.createServer, { host, port });
            return appLayer.pipe(Layer.provide(serverLayer));
          }),
        );
      ",
        "warnings": [
          {
            "code": "HTTPAPI-ROLE-006",
            "message": "reserved underscore-prefixed filename not in supported matrix: _unknown.ts",
            "pluginName": "httpapi-virtual-module",
          },
        ],
      }
    `);
  });

  it("build returns AVM-ID-001 when virtual module id is invalid", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("api:", fixture.importer, session.api);
    expect(result).toHaveProperty("errors");
    const err = result as VirtualModuleBuildError;
    expect(err.errors[0].code).toBe("AVM-ID-001");
  });

  it("build returns AVM-DISC-001 when target directory does not exist", () => {
    const fixture = createApiFixture({ "src/entry.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("api:./apis", fixture.importer, session.api);
    expect(result).toHaveProperty("errors");
    const err = result as VirtualModuleBuildError;
    expect(err.errors[0].code).toBe("AVM-DISC-001");
  });

  it("build returns deterministic output for same input", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    const plugin = createHttpApiVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const typeTargets = resolveHttpApiTypeTargets(program, ts);
    const session1 = createTypeInfoApiSession({ ts, program, typeTargets });
    const session2 = createTypeInfoApiSession({ ts, program, typeTargets });
    const source1 = plugin.build("api:./apis", fixture.importer, session1.api);
    const source2 = plugin.build("api:./apis", fixture.importer, session2.api);
    expect(source1).toBe(source2);
  });
});

describe("HttpApiVirtualModulePlugin integration", () => {
  it("resolves through PluginManager when target exists with script files", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    const program = makeProgram(fixture.paths);
    const sessionFactory = () => createTypeInfoApiSession({ ts, program });
    const manager = new PluginManager([createHttpApiVirtualModulePlugin()]);

    const resolved = manager.resolveModule({
      id: "api:./apis",
      importer: fixture.importer,
      createTypeInfoApiSession: sessionFactory,
    });

    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;
    expect(resolved.pluginName).toBe("httpapi-virtual-module");
    expect(resolved.sourceText).toMatchInlineSnapshot(`
      "import { emptyRecordString, emptyRecordStringArray, composeWithLayers, resolveConfig, type AppConfig, type ComputeLayers, type LayerOrGroup, type RunConfig } from "@typed/app";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpApi from "effect/unstable/httpapi/HttpApi";
      import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
      import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";
      import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
      import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
      import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";
      import * as HttpApiSwagger from "effect/unstable/httpapi/HttpApiSwagger";
      import * as HttpServer from "effect/unstable/http/HttpServer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";
      import http from "node:http";
      import { NodeHttpServer } from "@effect/platform-node";
      import * as Status from "./apis/status.js";

      export const Api = HttpApi.make("apis").add(HttpApiGroup.make("root").add(HttpApiEndpoint.get("status", Status.route.path, { params: Status.route.pathSchema, query: Status.route.querySchema, success: Status.success, error: Status.error })));
      export const ApiLayer = HttpApiBuilder.layer(Api).pipe(Layer.provideMerge(HttpApiBuilder.group(Api, "root", (handlers) => handlers.handle("status", (ctx) => Status.handler({ path: ctx.params ?? emptyRecordString, query: ctx.query ?? emptyRecordStringArray, headers: emptyRecordString, body: undefined })))));
      export const OpenApi = OpenApiModule.fromApi(Api);
      export const Swagger = HttpApiSwagger.layer(Api);
      export const Scalar = HttpApiScalar.layer(Api);
      export const Client = HttpApiClient.make(Api);

      export const App = <const Layers extends readonly LayerOrGroup[] = []>(
        config?: AppConfig,
        ...layersToMergeIntoRouter: Layers
      ): Layer.Layer<
        Layer.Success<ComputeLayers<Layers, typeof ApiLayer>>, 
        Layer.Error<ComputeLayers<Layers, typeof ApiLayer>>, 
        Exclude<Layer.Services<ComputeLayers<Layers, typeof ApiLayer>>, HttpRouter.HttpRouter> | HttpServer.HttpServer
      > => {
        const disableListenLog = config?.disableListenLog ?? false;
        const appLayer = composeWithLayers(ApiLayer, layersToMergeIntoRouter) as ComputeLayers<
          Layers,
          typeof ApiLayer
        >;
        return HttpRouter.serve(appLayer, { disableListenLog })
      };

      export const serve = <const Layers extends readonly LayerOrGroup[] = []>(
        config?: RunConfig,
        ...layersToMergeIntoRouter: Layers
      ) =>
        Layer.unwrap(
          Effect.gen(function* () {
            const host = yield* resolveConfig(config?.host, "0.0.0.0");
            const port = yield* resolveConfig(config?.port, 3000);
            const disableListenLog = yield* resolveConfig(config?.disableListenLog, false);
            const appConfig: AppConfig = { disableListenLog };
            const appLayer = App(appConfig, ...layersToMergeIntoRouter);
            const serverLayer = NodeHttpServer.layer(http.createServer, { host, port });
            return appLayer.pipe(Layer.provide(serverLayer));
          }),
        );
      "
    `);
  });

  it("returns unresolved when id does not match", () => {
    const { importer } = createApiFixture({});
    const manager = new PluginManager([createHttpApiVirtualModulePlugin()]);
    const resolved = manager.resolveModule({ id: "router:./routes", importer });
    expect(resolved.status).toBe("unresolved");
  });
});

describe("resolveHttpApiTypeTargets", () => {
  it("returns array (possibly empty) from program", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const program = makeProgram(fixture.paths);
    const targets = resolveHttpApiTypeTargets(program, ts);
    expect(Array.isArray(targets)).toBe(true);
  });
});

describe("httpapiOpenApiConfig", () => {
  it("normalizeOpenApiConfig at api scope returns no diagnostics for empty config", () => {
    const { diagnostics } = normalizeOpenApiConfig("api", {
      annotations: {},
      generation: {},
      exposure: {},
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("validateOpenApiGenerationScope returns diagnostic when generation used at group scope", () => {
    const diag = validateOpenApiGenerationScope("group", {
      additionalProperties: true,
    });
    expect(diag).toHaveLength(1);
    expect(diag[0].code).toBe("AVM-OPENAPI-001");
  });

  it("validateOpenApiExposureScope returns diagnostic when exposure used at endpoint scope", () => {
    const diag = validateOpenApiExposureScope("endpoint", {
      jsonPath: "/openapi.json",
    });
    expect(diag).toHaveLength(1);
    expect(diag[0].code).toBe("AVM-OPENAPI-002");
  });

  it("validateOpenApiExposureRouteConflicts detects same path for json and swagger", () => {
    const diag = validateOpenApiExposureRouteConflicts({
      jsonPath: "/spec",
      swaggerPath: "/spec",
    });
    expect(diag).toHaveLength(1);
    expect(diag[0]).toMatchInlineSnapshot(`
      {
        "code": "AVM-OPENAPI-003",
        "message": "OpenAPI exposure route conflict: path "/spec" used for multiple modes: json, swagger",
      }
    `);
  });

  it("collectExposureRoutes returns entries for jsonPath, swaggerPath, scalar", () => {
    const routes = collectExposureRoutes({
      jsonPath: "/openapi.json",
      swaggerPath: "/swagger",
      scalar: { path: "/scalar", source: "inline" },
    });
    expect(routes).toHaveLength(3);
    expect(routes.map((r) => r.mode).sort()).toEqual(["json", "scalar", "swagger"]);
  });
});
