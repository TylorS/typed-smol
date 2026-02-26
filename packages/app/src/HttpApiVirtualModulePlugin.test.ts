/// <reference types="node" />
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import {
  createTypeInfoApiSession,
  PluginManager,
  resolveTypeTargetsFromSpecs,
} from "@typed/virtual-modules";
import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import {
  createHttpApiVirtualModulePlugin,
  parseHttpApiVirtualModuleId,
  resolveHttpApiTargetDirectory,
  HTTPAPI_TYPE_TARGET_SPECS,
} from "./index.js";
import {
  collectExposureRoutes,
  normalizeOpenApiConfig,
  validateOpenApiExposureRouteConflicts,
  validateOpenApiExposureScope,
  validateOpenApiGenerationScope,
} from "./internal/httpapiOpenApiConfig.js";

const tempDirs: string[] = [];

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const createTempDir = (): string => {
  const base = join(APP_ROOT, "tmp-httpapi-test");
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
import * as Route from "@typed/router";

export const route = Route.Parse("/status");

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

const BOOTSTRAP_HTTPAPI_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "internal",
  "typeTargetBootstrapHttpApi.ts",
);

function buildApiFromFixture(
  spec: FixtureSpec,
  pluginOptions?: { pathPrefix?: `/${string}` },
) {
  const fixture = createApiFixture(spec);
  const plugin = createHttpApiVirtualModulePlugin(pluginOptions ?? {});
  const files =
    existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
      ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
      : fixture.paths;
  const program = makeProgram(files, fixture.root);
  const session = createTypeInfoApiSession({
    ts,
    program,
    typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
  });
  return plugin.build("api:./apis", fixture.importer, session.api);
}

/** Extract source text from build result (string or { sourceText, warnings }). */
function getSourceText(
  result: unknown,
): string | undefined {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "sourceText" in result) {
    return (result as { sourceText?: string }).sourceText;
  }
  return undefined;
}

const NM = join(APP_ROOT, "node_modules");

const HTTPAPI_MODULE_FALLBACKS: Record<string, string> = {
  "@typed/router": join(NM, "@typed", "router", "src", "index.ts"),
  effect: join(NM, "effect", "dist", "index.d.ts"),
  "effect/Effect": join(NM, "effect", "dist", "Effect.d.ts"),
  "effect/Schema": join(NM, "effect", "dist", "Schema.d.ts"),
  "effect/unstable/httpapi/HttpApi": join(NM, "effect", "dist", "unstable", "httpapi", "HttpApi.d.ts"),
  "effect/unstable/httpapi/HttpApiGroup": join(NM, "effect", "dist", "unstable", "httpapi", "HttpApiGroup.d.ts"),
  "effect/unstable/httpapi/HttpApiEndpoint": join(NM, "effect", "dist", "unstable", "httpapi", "HttpApiEndpoint.d.ts"),
  "effect/unstable/httpapi/HttpApiBuilder": join(NM, "effect", "dist", "unstable", "httpapi", "HttpApiBuilder.d.ts"),
  "effect/unstable/http/HttpServerResponse": join(NM, "effect", "dist", "unstable", "http", "HttpServerResponse.d.ts"),
};

function makeProgram(rootFiles: readonly string[], fixtureRoot?: string): ts.Program {
  const projectRoot =
    fixtureRoot ?? (rootFiles.length > 0 ? dirname(dirname(rootFiles[0]!)) : APP_ROOT);
  const options: ts.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  };
  const defaultHost = ts.createCompilerHost(options);
  const moduleResolutionHost: ts.ModuleResolutionHost = {
    getCurrentDirectory: () => projectRoot,
    fileExists: defaultHost.fileExists?.bind(defaultHost),
    readFile: defaultHost.readFile?.bind(defaultHost),
    useCaseSensitiveFileNames: () => defaultHost.useCaseSensitiveFileNames?.() ?? true,
  };
  const customHost: ts.CompilerHost = {
    ...defaultHost,
    getCurrentDirectory: () => projectRoot,
    resolveModuleNames: (
      moduleNames: string[],
      containingFile: string,
    ): (ts.ResolvedModule | undefined)[] =>
      moduleNames.map((moduleName) => {
        const resolved = ts.resolveModuleName(
          moduleName,
          containingFile,
          options,
          moduleResolutionHost,
        );
        if (resolved.resolvedModule) return resolved.resolvedModule;
        const fallback = HTTPAPI_MODULE_FALLBACKS[moduleName];
        if (fallback && defaultHost.fileExists?.(fallback)) {
          return {
            resolvedFileName: fallback,
            extension: fallback.endsWith(".ts") ? ts.Extension.Ts : ts.Extension.Js,
            isExternalLibraryImport: false,
          };
        }
        return undefined;
      }),
  };
  return ts.createProgram(rootFiles, options, customHost);
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
    expect(result).not.toHaveProperty("errors");
    const sourceText =
      typeof result === "string" ? result : (result as { sourceText?: string }).sourceText;
    expect(sourceText).toBeDefined();
    expect(sourceText).toMatchInlineSnapshot(`
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
      const err = (result as VirtualModuleBuildError).errors;
      expect(err.some((e) => e.code === "AVM-CONTRACT-003")).toBe(true);
  });

  it("build returns warnings for unsupported reserved files while still emitting source", () => {
    const fixture = createApiFixture({
      "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
      "src/apis/users/_unknown.ts": "export {};",
    });
    const plugin = createHttpApiVirtualModulePlugin();
    const files =
      existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
        ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
        : fixture.paths;
    const program = makeProgram(
      files,
      files.includes(BOOTSTRAP_HTTPAPI_FILE) ? APP_ROOT : fixture.root,
    );
    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
    });
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
    const files =
      existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
        ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
        : fixture.paths;
    const program = makeProgram(
      files,
      files.includes(BOOTSTRAP_HTTPAPI_FILE) ? APP_ROOT : fixture.root,
    );
    const session1 = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
    });
    const session2 = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
    });
    const source1 = plugin.build("api:./apis", fixture.importer, session1.api);
    const source2 = plugin.build("api:./apis", fixture.importer, session2.api);
    expect(typeof source1).toBe(typeof source2);
    if (typeof source1 === "string") expect(source1).toBe(source2);
  });
});

describe("HttpApiVirtualModulePlugin integration", () => {
  it("resolves through PluginManager when target exists with script files", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    const files =
      existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
        ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
        : fixture.paths;
    const program = makeProgram(
      files,
      files.includes(BOOTSTRAP_HTTPAPI_FILE) ? APP_ROOT : fixture.root,
    );
    const sessionFactory = () =>
      createTypeInfoApiSession({ ts, program, typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS });
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

describe("resolveTypeTargetsFromSpecs with HTTPAPI_TYPE_TARGET_SPECS", () => {
  it("returns array (possibly empty) from program without bootstrap", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const program = makeProgram(fixture.paths);
    const targets = resolveTypeTargetsFromSpecs(program, ts, HTTPAPI_TYPE_TARGET_SPECS);
    expect(Array.isArray(targets)).toBe(true);
    const targetIds = targets.map((t) => t.id).sort();
    expect(targetIds).toMatchInlineSnapshot(`[]`);
  });

  describe("explicit type target resolution", () => {
    it("resolves all HTTPAPI_TYPE_TARGET_SPECS when bootstrap in program", () => {
      const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const files =
        existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
          ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
          : fixture.paths;
      const program = makeProgram(files, fixture.root);
      const targets = resolveTypeTargetsFromSpecs(program, ts, HTTPAPI_TYPE_TARGET_SPECS);
      const targetIds = targets.map((t) => t.id).sort();
      expect(targetIds).toMatchInlineSnapshot(`
        [
          "Effect",
          "HttpApi",
          "HttpApiEndpoint",
          "HttpApiGroup",
          "HttpServerResponse",
          "Route",
          "Schema",
        ]
      `);
    });
  });

  it("route with local Route module and typeMember: assignableTo.Route is true", () => {
    const routeSource = `
export interface Route<P, S> { readonly path: P; readonly schema: S }
export namespace Route {
  export type Any = Route<any, any>;
  export const Parse = <P extends string>(path: P): Route<P, any> =>
    ({ path, schema: {} } as Route<P, any>);
}
`;
    const endpointSource = `
import * as Route from "../route.js";
export const route = Route.Parse("/status");
export const method = "GET";
export const handler = () => ({});
`;
    const fixture = createApiFixture({
      "src/route.ts": routeSource,
      "src/apis/status.ts": endpointSource,
    });
    const files = fixture.paths;
    const program = makeProgram(files, fixture.root);
    const specs = [
      { id: "Route", module: "../route.js", exportName: "Route", typeMember: "Any" },
    ] as const;
    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: specs,
      failWhenNoTargetsResolved: false,
    });
    const result = session.api.file("src/apis/status.ts", { baseDir: fixture.root });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const routeExport = result.snapshot.exports.find((e) => e.name === "route");
    expect(routeExport).toBeDefined();
    expect(session.api.isAssignableTo(routeExport!.type, "Route")).toBe(true);
  });

  it("route export has assignableTo.Route when fixture uses Route.Parse and bootstrap present", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    const files =
      existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
        ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
        : fixture.paths;
    const program = makeProgram(files, fixture.root);
    const session = createTypeInfoApiSession({
      ts,
      program,
      typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
    });
    const result = session.api.file("src/apis/status.ts", { baseDir: fixture.root });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const routeExport = result.snapshot.exports.find((e) => e.name === "route");
    expect(routeExport).toBeDefined();
    expect(session.api.isAssignableTo(routeExport!.type, "Route")).toBe(true);
  });

  describe("explicit assignability against @typed/router and effect/*", () => {
    it("status endpoint exports have expected assignability (route, handler, success, error)", () => {
      const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const files =
        existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
          ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
          : fixture.paths;
      const program = makeProgram(
        files,
        files.includes(BOOTSTRAP_HTTPAPI_FILE) ? APP_ROOT : fixture.root,
      );
      const session = createTypeInfoApiSession({
        ts,
        program,
        typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
      });
      const result = session.api.file("src/apis/status.ts", { baseDir: fixture.root });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const { api } = session;
      const routeExport = result.snapshot.exports.find((e) => e.name === "route");
      const handlerExport = result.snapshot.exports.find((e) => e.name === "handler");
      const successExport = result.snapshot.exports.find((e) => e.name === "success");
      const errorExport = result.snapshot.exports.find((e) => e.name === "error");
      expect(routeExport).toBeDefined();
      expect(handlerExport).toBeDefined();
      expect(successExport).toBeDefined();
      expect(errorExport).toBeDefined();
      expect(api.isAssignableTo(routeExport!.type, "Route")).toBe(true);
      expect(api.isAssignableTo(handlerExport!.type, "Effect", [{ kind: "returnType" }])).toBe(true);
      expect(api.isAssignableTo(successExport!.type, "Schema")).toBe(true);
      expect(api.isAssignableTo(errorExport!.type, "Schema")).toBe(true);
      expect(api.isAssignableTo(handlerExport!.type, "Route")).toBe(false);
      expect(api.isAssignableTo(routeExport!.type, "Schema")).toBe(false);
    });
  });

  it("wrong module path for Route: Route target not resolved; build fails with AVM-CONTRACT-003", () => {
    const wrongSpecs = [
      ...HTTPAPI_TYPE_TARGET_SPECS.filter((s) => s.id !== "Route"),
      { id: "Route", module: "wrong/path/Route", exportName: "Route" },
    ];
    const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    const files =
      existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
        ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
        : fixture.paths;
    const program = makeProgram(files, fixture.root);
    const session = createTypeInfoApiSession({ ts, program, typeTargetSpecs: wrongSpecs });
    const plugin = createHttpApiVirtualModulePlugin();
    const result = plugin.build("api:./apis", fixture.importer, session.api);
    expect(result).toHaveProperty("errors");
    expect((result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-003")).toBe(
      true,
    );
  });
});

describe("HttpApi assignableTo and validation (comprehensive)", () => {
  describe("3a. Type-target resolution", () => {
    it("Resolution with bootstrap: build succeeds; assignableTo populated for Route, Effect, Schema", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("handlers.handle(");
    });

    it("Wrong typeTargetSpecs: wrong module paths; assignableTo missing; build fails", () => {
      const wrongSpecs = [
        { id: "Route", module: "effect", exportName: "Route" },
        { id: "Effect", module: "wrong/module", exportName: "Effect" },
      ];
      const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const files =
        existsSync(BOOTSTRAP_HTTPAPI_FILE) && !fixture.paths.includes(BOOTSTRAP_HTTPAPI_FILE)
          ? [...fixture.paths, BOOTSTRAP_HTTPAPI_FILE]
          : fixture.paths;
      const program = makeProgram(files, fixture.root);
      expect(() =>
        createTypeInfoApiSession({
          ts,
          program,
          typeTargetSpecs: wrongSpecs,
        }),
      ).toThrow(/type targets could not be resolved/);
    });

    it("Missing bootstrap when specs provided: program has no canonical imports; session creation throws", () => {
      const fixture = createApiFixture({
        "src/apis/status.ts": `
          export const route = { path: "/status" };
          export const method = "GET";
          export const handler = () => ({});
        `,
      });
      expect(() =>
        createTypeInfoApiSession({
          ts,
          program: makeProgram(fixture.paths, fixture.root),
          typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
        }),
      ).toThrow(/type targets could not be resolved/);
    });
  });

  describe("3b. Route validation (assignableTo.Route only)", () => {
    it("Route from @typed/router: Route.Parse passes", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      expect(getSourceText(result)).toBeDefined();
    });

    it("Route invalid (no assignableTo.Route): plain object; AVM-CONTRACT-003", () => {
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
      expect((result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-003")).toBe(true);
    });

    it("Route invalid (assignableTo absent): type targets unresolved; session throws when no bootstrap", () => {
      const fixture = createApiFixture({
        "src/apis/status.ts": `
          const route = { path: "/status" };
          export { route };
          export const method = "GET";
          export const handler = () => ({});
        `,
      });
      expect(() => {
        const program = makeProgram(fixture.paths, fixture.root);
        const session = createTypeInfoApiSession({
          ts,
          program,
          typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
        });
        const plugin = createHttpApiVirtualModulePlugin();
        plugin.build("api:./apis", fixture.importer, session.api);
      }).toThrow(/type targets could not be resolved/);
    });
  });

  describe("3c. Handler validation", () => {
    it("Handler returns Effect: passes", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      expect(getSourceText(result)).toBeDefined();
    });

    it("Handler returns non-Effect: AVM-CONTRACT-004", () => {
      const result = buildApiFromFixture({
        "src/apis/status.ts": `
          import * as Effect from "effect/Effect";
          import * as Schema from "effect/Schema";
          import * as Route from "@typed/router";
          export const route = Route.Parse("/status");
          export const method = "GET";
          export const handler = () => ({ status: "ok" });
        `,
      });
      expect(result).toHaveProperty("errors");
      expect((result as VirtualModuleBuildError).errors[0].code).toBe("AVM-CONTRACT-004");
    });

    it("Handler returns HttpServerResponse: uses handleRaw", () => {
      const rawHandlerSource = `
        import * as Effect from "effect/Effect";
        import * as Schema from "effect/Schema";
        import * as Route from "@typed/router";
        import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
        export const route = Route.Parse("/raw");
        export const method = "GET";
        export const success = Schema.Struct({});
        export const error = Schema.Struct({ message: Schema.String });
        export const handler = () => Effect.succeed(HttpServerResponse.empty());
      `;
      const result = buildApiFromFixture({ "src/apis/raw.ts": rawHandlerSource });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("handleRaw");
      expect(sourceText).toContain("raw");
    });

    it("Handler returns value vs raw: both in same API", () => {
      const rawHandlerSource = `
        import * as Effect from "effect/Effect";
        import * as Schema from "effect/Schema";
        import * as Route from "@typed/router";
        import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
        export const route = Route.Parse("/raw");
        export const method = "GET";
        export const success = Schema.Struct({});
        export const error = Schema.Struct({ message: Schema.String });
        export const handler = () => Effect.succeed(HttpServerResponse.empty());
      `;
      const result = buildApiFromFixture({
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
        "src/apis/raw.ts": rawHandlerSource,
      });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("handle(\"status\"");
      expect(sourceText).toContain("handleRaw(\"raw\"");
    });
  });

  describe("3d. Success and error schemas", () => {
    it("success present, Schema: passes", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      expect(getSourceText(result)).toBeDefined();
    });

    it("success present, not Schema: AVM-CONTRACT-005", () => {
      const result = buildApiFromFixture({
        "src/apis/status.ts": `
          import * as Effect from "effect/Effect";
          import * as Route from "@typed/router";
          export const route = Route.Parse("/status");
          export const method = "GET";
          export const success = { foo: "bar" };
          export const error = { message: "err" };
          export const handler = () => Effect.succeed({ status: "ok" });
        `,
      });
      expect(result).toHaveProperty("errors");
      expect((result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-005")).toBe(true);
    });

    it("error present, Schema: passes", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      expect(getSourceText(result)).toBeDefined();
    });

    it("error present, not Schema: AVM-CONTRACT-006", () => {
      const result = buildApiFromFixture({
        "src/apis/status.ts": `
          import * as Effect from "effect/Effect";
          import * as Schema from "effect/Schema";
          import * as Route from "@typed/router";
          export const route = Route.Parse("/status");
          export const method = "GET";
          export const success = Schema.Struct({ status: Schema.Literal("ok") });
          export const error = { message: "err" };
          export const handler = () => Effect.succeed({ status: "ok" });
        `,
      });
      expect(result).toHaveProperty("errors");
      expect((result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-006")).toBe(true);
    });

    it("Both success and error valid Schema: passes", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      expect(getSourceText(result)).toBeDefined();
    });
  });

  describe("3e. Groups and structure", () => {
    it("Nested groups: correct HttpApiGroup composition", () => {
      const result = buildApiFromFixture({
        "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
        "src/apis/users/items/get.ts": VALID_ENDPOINT_SOURCE,
      });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("HttpApiGroup.make(\"users\")");
      expect(sourceText).toContain("list");
      expect(sourceText).toContain("items/get");
    });

    it("Multiple endpoints per group: correct wiring", () => {
      const result = buildApiFromFixture({
        "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
        "src/apis/users/get.ts": VALID_ENDPOINT_SOURCE,
        "src/apis/users/update.ts": VALID_ENDPOINT_SOURCE,
      });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("handle(\"list\"");
      expect(sourceText).toContain("handle(\"get\"");
      expect(sourceText).toContain("handle(\"update\"");
    });
  });

  describe("3f. Coercion paths (handle vs handleRaw)", () => {
    it("Direct handler export: emitted correctly", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("Status.handler(");
    });

    it("handle for value return: handlers.handle with decoded params", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("handlers.handle(\"status\", (ctx) => Status.handler({ path:");
    });

    it("handleRaw for HttpServerResponse: handlers.handleRaw, handler receives ctx", () => {
      const rawHandlerSource = `
        import * as Effect from "effect/Effect";
        import * as Schema from "effect/Schema";
        import * as Route from "@typed/router";
        import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
        export const route = Route.Parse("/raw");
        export const method = "GET";
        export const success = Schema.Struct({});
        export const error = Schema.Struct({ message: Schema.String });
        export const handler = () => Effect.succeed(HttpServerResponse.empty());
      `;
      const result = buildApiFromFixture({ "src/apis/raw.ts": rawHandlerSource });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("handlers.handleRaw(\"raw\", (ctx) => Raw.handler(ctx))");
    });
  });

  describe("3g. Path prefix and OpenAPI exposure", () => {
    const API_PREFIX_SOURCE = `
import * as Route from "@typed/router";
export const prefix = Route.Parse("/api");
`;

    it("_api.ts with prefix Route: emits .prefix on group", () => {
      const result = buildApiFromFixture({
        "src/apis/_api.ts": API_PREFIX_SOURCE,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('.prefix("/api")');
    });

    it("_api.ts with prefix string literal: returns AVM-CONTRACT-007", () => {
      const result = buildApiFromFixture({
        "src/apis/_api.ts": 'export const prefix = "/api";',
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      expect(result).toHaveProperty("errors");
      const err = result as VirtualModuleBuildError;
      expect(err.errors.some((e) => e.code === "AVM-CONTRACT-007")).toBe(true);
    });

    it("plugin pathPrefix when no convention: emits .prefix from option", () => {
      const result = buildApiFromFixture(
        { "src/apis/status.ts": VALID_ENDPOINT_SOURCE },
        { pathPrefix: "/api" },
      );
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('.prefix("/api")');
    });

    it("_api.ts openapi.exposure: emits HttpApiBuilder/Swagger/Scalar with paths", () => {
      const apiWithExposure = `
import * as Route from "@typed/router";
export const prefix = Route.Parse("/api");
export const openapi = {
  exposure: {
    jsonPath: "/api/docs/spec" as const,
    swaggerPath: "/api/docs/swagger" as const,
    scalar: { path: "/api/docs" as const },
  },
};
`;
      const result = buildApiFromFixture({
        "src/apis/_api.ts": apiWithExposure,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('openapiPath: "/api/docs/spec"');
      expect(sourceText).toContain('path: "/api/docs/swagger"');
      expect(sourceText).toContain('path: "/api/docs"');
    });
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
