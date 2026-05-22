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
import { typeCheckGeneratedSource } from "./test-utils/generatedSourceHarness.js";

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
  headers?: Record<string, string>;
  body?: unknown;
}) => Effect.succeed({ status: "ok" as const });
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

function buildApiFromFixture(spec: FixtureSpec, pluginOptions?: { pathPrefix?: `/${string}` }) {
  const fixture = createApiFixture(spec);
  return buildApiFromExistingFixture(fixture, pluginOptions);
}

function buildApiFromExistingFixture(
  fixture: ReturnType<typeof createApiFixture>,
  pluginOptions?: { pathPrefix?: `/${string}` },
  id = "typed:api?dir=./apis",
) {
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
  return plugin.build(id, fixture.importer, session.api);
}

/** Extract source text from build result (string or { sourceText, warnings }). */
function getSourceText(result: unknown): string | undefined {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "sourceText" in result) {
    return (result as { sourceText?: string }).sourceText;
  }
  return undefined;
}

function expectHttpApiGeneratedSourceToTypeCheck(
  fixture: ReturnType<typeof createApiFixture>,
  sourceText: string,
  generatedPath = "src/api.generated.ts",
) {
  const typeCheck = typeCheckGeneratedSource({
    rootDir: fixture.root,
    generatedPath,
    sourceText,
    rootFiles: fixture.paths,
    moduleFallbacks: HTTPAPI_MODULE_FALLBACKS,
  });
  expect(typeCheck.diagnostics).toEqual([]);
}

const NM = join(APP_ROOT, "node_modules");

const HTTPAPI_MODULE_FALLBACKS: Record<string, string> = {
  "@typed/app": join(APP_ROOT, "src", "test-utils", "typedAppGeneratedSourceFallback.d.ts"),
  "@typed/app/httpapi/ApiHandler": join(
    APP_ROOT,
    "src",
    "test-utils",
    "typedAppGeneratedSourceFallback.d.ts",
  ),
  "@typed/app/httpapi/Handlers": join(
    APP_ROOT,
    "src",
    "test-utils",
    "typedAppGeneratedSourceFallback.d.ts",
  ),
  "@typed/app/runtime": join(APP_ROOT, "src", "test-utils", "typedAppGeneratedSourceFallback.d.ts"),
  "@typed/app/internal/resolveConfig": join(
    APP_ROOT,
    "src",
    "test-utils",
    "typedAppGeneratedSourceFallback.d.ts",
  ),
  "@typed/app/TypedHttpServer": join(
    APP_ROOT,
    "src",
    "test-utils",
    "typedAppGeneratedSourceFallback.d.ts",
  ),
  "@typed/router": join(NM, "@typed", "router", "src", "index.ts"),
  "typed:config": join(APP_ROOT, "src", "test-utils", "typedConfigGeneratedSourceFallback.ts"),
  effect: join(NM, "effect", "dist", "index.d.ts"),
  "effect/Context": join(NM, "effect", "dist", "Context.d.ts"),
  "effect/Effect": join(NM, "effect", "dist", "Effect.d.ts"),
  "effect/Layer": join(NM, "effect", "dist", "Layer.d.ts"),
  "effect/Schema": join(NM, "effect", "dist", "Schema.d.ts"),
  "effect/unstable/httpapi/HttpApi": join(
    NM,
    "effect",
    "dist",
    "unstable",
    "httpapi",
    "HttpApi.d.ts",
  ),
  "effect/unstable/httpapi/HttpApiGroup": join(
    NM,
    "effect",
    "dist",
    "unstable",
    "httpapi",
    "HttpApiGroup.d.ts",
  ),
  "effect/unstable/httpapi/HttpApiEndpoint": join(
    NM,
    "effect",
    "dist",
    "unstable",
    "httpapi",
    "HttpApiEndpoint.d.ts",
  ),
  "effect/unstable/httpapi/HttpApiBuilder": join(
    NM,
    "effect",
    "dist",
    "unstable",
    "httpapi",
    "HttpApiBuilder.d.ts",
  ),
  "effect/unstable/http/HttpServerResponse": join(
    NM,
    "effect",
    "dist",
    "unstable",
    "http",
    "HttpServerResponse.d.ts",
  ),
  "effect/unstable/http/HttpServerError": join(
    NM,
    "effect",
    "dist",
    "unstable",
    "http",
    "HttpServerError.d.ts",
  ),
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
  it("returns ok with relativeDirectory when id is typed:api?dir=./apis", () => {
    const result = parseHttpApiVirtualModuleId("typed:api?dir=./apis");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.relativeDirectory).toBe("./apis");
  });

  it("normalizes typed api bare dir values to relative paths", () => {
    const result = parseHttpApiVirtualModuleId("typed:api?dir=apis");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.relativeDirectory).toBe("./apis");
  });

  it("maps typed api wildcard dir to the default api directory", () => {
    const result = parseHttpApiVirtualModuleId("typed:api?dir=*");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.relativeDirectory).toBe("./api");
  });

  it("returns not ok for legacy api prefix ids", () => {
    const result = parseHttpApiVirtualModuleId("api:./apis");
    expect(result.ok).toBe(false);
  });

  it("returns not ok when dir is missing", () => {
    const result = parseHttpApiVirtualModuleId("typed:api");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("AVM-ID-DIR-001");
  });

  it("returns not ok for unsupported query options", () => {
    const result = parseHttpApiVirtualModuleId("typed:api?dir=./apis&target=server");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("AVM-ID-QUERY-001");
  });
});

describe("resolveHttpApiTargetDirectory", () => {
  it("resolves typed:api?dir=./apis relative to importer directory", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const result = resolveHttpApiTargetDirectory("typed:api?dir=./apis", fixture.importer);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.targetDirectory).toContain("apis");
  });

  it("returns not ok when path escapes base", () => {
    const fixture = createApiFixture({ "src/entry.ts": "export {};" });
    const result = resolveHttpApiTargetDirectory("typed:api?dir=../../../etc", fixture.importer);
    expect(result.ok).toBe(false);
  });
});

describe("createHttpApiVirtualModulePlugin", () => {
  it("shouldResolve returns true for typed api ids without scanning the target directory", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    expect(plugin.shouldResolve("typed:api?dir=./apis", fixture.importer)).toBe(true);
  });

  it("shouldResolve returns true for typed api ids whose directory has no script files", () => {
    const fixture = createApiFixture({ "src/apis/readme.txt": "no ts" });
    const plugin = createHttpApiVirtualModulePlugin();
    expect(plugin.shouldResolve("typed:api?dir=./apis", fixture.importer)).toBe(true);
  });

  it("shouldResolve returns true for malformed typed api ids so build can surface diagnostics", () => {
    const fixture = createApiFixture({ "src/entry.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    expect(plugin.shouldResolve("typed:api", fixture.importer)).toBe(true);
    expect(plugin.shouldResolve("typed:api?dir=./apis&target=server", fixture.importer)).toBe(true);
  });

  it("build renders deterministic HttpApi assembly source when contracts are valid", () => {
    const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    expect(result).not.toHaveProperty("errors");
    const sourceText =
      typeof result === "string" ? result : (result as { sourceText?: string }).sourceText;
    expect(sourceText).toBeDefined();
    expect(sourceText).toMatchInlineSnapshot(`
      "import { composeWithLayers, type LayerOrGroup } from "@typed/app/runtime";
      import { resolveConfig } from "@typed/app/internal/resolveConfig";
      import { TypedHttpServer } from "@typed/app/TypedHttpServer";
      import { ApiHandlers } from "@typed/app/httpapi/Handlers";
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
      import * as TypedConfigModule from "typed:config";
      import * as Status from "./apis/status.js";

      export const Api = HttpApi.make("apis").add(HttpApiGroup.make("root").add(HttpApiEndpoint.get("status", Status.route.path, { params: Status.route.pathSchema, query: Status.route.querySchema, success: Status.success, error: Status.error })));
      export const DependenciesLayer = Layer.empty;
      export const ApiLayer = HttpApiBuilder.layer(Api).pipe(Layer.provideMerge(HttpApiBuilder.group(Api, "root", (handlers) => handlers.handle("status", ApiHandlers.handler(Status)))));
      export const OpenApi = OpenApiModule.fromApi(Api);
      export const Swagger = HttpApiSwagger.layer(Api);
      export const Scalar = HttpApiScalar.layer(Api);
      export const Client = HttpApiClient.make(Api);

      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };

      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");

      function joinBuildPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }

      type HttpApiRuntimeConfig = {
        readonly disableListenLog?: boolean;
        readonly host?: string;
        readonly port?: number;
      };

      function isDevImportMeta(meta: ImportMeta & { readonly env?: { readonly DEV?: boolean } }): boolean {
        return meta.env?.DEV === true;
      }

      export const App = <const Layers extends readonly LayerOrGroup[]>(
        config: HttpApiRuntimeConfig = {},
        ...layersToMergeIntoRouter: Layers
      ) => {
        const disableListenLog = config?.disableListenLog ?? false;
        const appLayer = composeWithLayers(ApiLayer, layersToMergeIntoRouter);
        return HttpRouter.serve(appLayer, { disableListenLog })
      };

      export const serve = <const Layers extends readonly LayerOrGroup[]>(
        config: HttpApiRuntimeConfig = {},
        ...layersToMergeIntoRouter: Layers
      ) =>
        Layer.unwrap(
          Effect.gen(function* () {
            const host = yield* resolveConfig(config?.host, "0.0.0.0");
            const port = yield* resolveConfig(config?.port, 3000);
            const disableListenLog = yield* resolveConfig(config?.disableListenLog, false);
            const dev = isDevImportMeta(import.meta);
            const appConfig = { disableListenLog };
            const staticAssetsLayer = TypedHttpServer.staticAssets({
              projectRoot: process.cwd(),
              clientOutDir,
              dev,
            });
            const appLayers = [staticAssetsLayer, ...layersToMergeIntoRouter] as const;
            const appLayer = App(appConfig, ...appLayers);
            const serverLayer = TypedHttpServer.layer({
              host,
              port,
              projectRoot: process.cwd(),
              dev,
            });
            return appLayer.pipe(Layer.provide(serverLayer));
          }),
        );
      "
    `);
  });

  it("inherits common headers and errors from directory companions", () => {
    const sourceText = getSourceText(
      buildApiFromFixture({
        "src/apis/_errors.ts": `
import * as Schema from "effect/Schema";
export const error = Schema.Struct({ message: Schema.String });
`,
        "src/apis/users/_headers.ts": `
import * as Schema from "effect/Schema";
export const headers = Schema.Struct({ authorization: Schema.String });
`,
        "src/apis/users/current.ts": `
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
export const route = Route.Parse("/current");
export const method = "GET";
export const success = Schema.Struct({ status: Schema.Literal("ok") });
export const handler = () => Effect.succeed({ status: "ok" });
`,
      }),
    );

    expect(sourceText).toContain('import * as Errors from "./apis/_errors.js";');
    expect(sourceText).toContain('import * as UsersHeaders from "./apis/users/_headers.js";');
    expect(sourceText).toContain(
      "headers: UsersHeaders.headers, success: UsersCurrent.success, error: Errors.error",
    );
  });

  it("emits a client-only API module without server imports or endpoint modules", () => {
    const fixture = createApiFixture({
      "src/domain.ts": `
import * as Schema from "effect/Schema";
export const Body = Schema.Struct({ name: Schema.String });
export const Success = Schema.Struct({ ok: Schema.Boolean });
export const ErrorBody = Schema.Struct({ message: Schema.String });
`,
      "src/apis/_errors.ts": `
import { ErrorBody } from "../domain.js";
export const error = ErrorBody;
`,
      "src/apis/status.ts": `
import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Effect from "effect/Effect";
import * as Route from "@typed/router";
import { ServerOnly } from "../server-only.js";
import { Body, Success } from "../domain.js";
export const route = Route.Parse("/status");
export const method = "POST";
export const body = Body;
export const success = Success;
export const handler = ApiHandlerRaw({ route, method, body })(({ body }) =>
  ServerOnly.use(() => Effect.succeed({ ok: true, body })),
);
`,
      "src/server-only.ts": `
import { readFileSync } from "node:fs";
export const ServerOnly = { use: readFileSync };
`,
    });
    const sourceText = getSourceText(
      buildApiFromExistingFixture(fixture, undefined, "typed:api?dir=./apis&mode=client"),
    );

    expect(sourceText).toBeDefined();
    expect(sourceText).toContain('import * as Route from "@typed/router";');
    expect(sourceText).toContain('import { Body as StatusBody } from "./domain.js";');
    expect(sourceText).toContain('import { Success as StatusSuccess } from "./domain.js";');
    expect(sourceText).toContain('import { ErrorBody as ErrorsError } from "./domain.js";');
    expect(sourceText).toContain("export const Client = HttpApiClient.make(Api);");
    expect(sourceText).not.toContain("@typed/app/TypedHttpServer");
    expect(sourceText).not.toContain("HttpApiBuilder");
    expect(sourceText).not.toContain("./apis/status.js");
    expect(sourceText).not.toContain("server-only");
    expect(sourceText).not.toContain("node:fs");
    expect(sourceText).not.toContain("export const serve");
    expect(sourceText).not.toContain("export const ApiLayer");
  });

  it("emits client-only API modules with endpoint route schemas intact", () => {
    const fixture = createApiFixture({
      "src/domain.ts": `
import * as Schema from "effect/Schema";
export const Success = Schema.Struct({ ok: Schema.Boolean });
`,
      "src/apis/comments/delete.ts": `
import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Success } from "../../domain.js";
export const route = Route.Join(Route.Parse("/articles/:slug/comments"), Route.Int("commentId"));
export const method = "DELETE";
export const success = Success;
export const handler = () => Effect.succeed({ ok: true });
`,
    });
    const sourceText = getSourceText(
      buildApiFromExistingFixture(fixture, undefined, "typed:api?dir=./apis&mode=client"),
    );

    expect(sourceText).toContain('Int("commentId")).pathSchema');
    expect(sourceText).not.toContain(
      'Route.Parse("/articles/:slug/comments/:commentId").pathSchema',
    );
  });

  it("delegates generated server wiring to TypedHttpServer", () => {
    const sourceText = getSourceText(
      buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE }),
    );

    expect(sourceText).toContain("TypedHttpServer.layer");
    expect(sourceText).toContain("TypedHttpServer.staticAssets");
    expect(sourceText).not.toContain("staticAssetsLayer as any");
    expect(sourceText).not.toContain("}) as any");
    expect(sourceText).not.toContain("Layer.Error<typeof appLayer>,\n        never");
    expect(sourceText).not.toContain("NodeHttpServer.layer(http.createServer");
  });

  it("imports runtime helpers from narrow @typed/app subpaths", () => {
    const sourceText = getSourceText(
      buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE }),
    );

    expect(sourceText).toContain(
      'import { composeWithLayers, type LayerOrGroup } from "@typed/app/runtime";',
    );
    expect(sourceText).toContain(
      'import { resolveConfig } from "@typed/app/internal/resolveConfig";',
    );
    expect(sourceText).toContain('import { TypedHttpServer } from "@typed/app/TypedHttpServer";');
    expect(sourceText).not.toContain('from "@typed/app";');
  });

  it("type-checks generated HttpApi source", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
    const result = buildApiFromExistingFixture(fixture);
    const sourceText = getSourceText(result);

    expect(sourceText).toBeDefined();
    if (!sourceText) return;
    const typeCheck = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/api.generated.ts",
      sourceText,
      rootFiles: fixture.paths,
      moduleFallbacks: HTTPAPI_MODULE_FALLBACKS,
    });
    expect(typeCheck.diagnostics).toEqual([]);
  });

  it("infers serve dependency services from provided layers", () => {
    const fixture = createApiFixture({
      "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      "src/serve-inference.ts": `
        import * as Context from "effect/Context";
        import * as Effect from "effect/Effect";
        import * as Layer from "effect/Layer";
        import { serve } from "./api.generated";

        const RequiredConfig = Context.Service<{ readonly value: string }>("RequiredConfig");
        const RuntimeDependency = Context.Service<{ readonly value: string }>("RuntimeDependency");
        const runtimeLayer = Layer.effect(RuntimeDependency)(
          Effect.gen(function* () {
            const config = yield* RequiredConfig;
            return { value: config.value };
          }),
        );
        const server = serve(undefined, runtimeLayer);

        type Assert<T extends true> = T;
        type Services = Layer.Services<typeof server>;
        type Expected = Context.Service.Identifier<typeof RequiredConfig>;
        type _RequiresConfig = Assert<Expected extends Services ? true : false>;
      `,
    });
    const result = buildApiFromExistingFixture(fixture);
    const sourceText = getSourceText(result);

    expect(sourceText).toBeDefined();
    if (!sourceText) return;
    const typeCheck = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/api.generated.ts",
      sourceText,
      rootFiles: fixture.paths,
      moduleFallbacks: HTTPAPI_MODULE_FALLBACKS,
    });
    expect(typeCheck.diagnostics).toEqual([]);
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

  it("treats unsupported reserved-looking files as non-participating", () => {
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
    const result = plugin.build("typed:api?dir=./apis", fixture.importer, session.api);

    const sourceText = getSourceText(result);
    expect(sourceText).toBeDefined();
    expect(sourceText).not.toContain("_unknown");
    if (typeof result === "object" && result && "warnings" in result) {
      expect(result.warnings).toBeUndefined();
    }
  });

  it("build returns AVM-ID-DIR-001 when typed api dir query is missing", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("typed:api", fixture.importer, session.api);
    expect(result).toHaveProperty("errors");
    const err = result as VirtualModuleBuildError;
    expect(err.errors[0].code).toBe("AVM-ID-DIR-001");
  });

  it("build returns AVM-ID-QUERY-001 when typed api query has unsupported options", () => {
    const fixture = createApiFixture({ "src/apis/status.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("typed:api?dir=./apis&target=server", fixture.importer, session.api);
    expect(result).toHaveProperty("errors");
    const err = result as VirtualModuleBuildError;
    expect(err.errors[0].code).toBe("AVM-ID-QUERY-001");
  });

  it("build returns AVM-DISC-001 when target directory does not exist", () => {
    const fixture = createApiFixture({ "src/entry.ts": "export {};" });
    const plugin = createHttpApiVirtualModulePlugin();
    const program = makeProgram(fixture.paths);
    const session = createTypeInfoApiSession({ ts, program });
    const result = plugin.build("typed:api?dir=./apis", fixture.importer, session.api);
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
    const source1 = plugin.build("typed:api?dir=./apis", fixture.importer, session1.api);
    const source2 = plugin.build("typed:api?dir=./apis", fixture.importer, session2.api);
    expect(typeof source1).toBe(typeof source2);
    if (typeof source1 === "string") expect(source1).toBe(source2);
  });
});

describe("HttpApiVirtualModulePlugin integration", () => {
  it("emits generated handler aliases from the effective endpoint contract", () => {
    const fixture = createApiFixture({
      "src/apis/_dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class RootApiService extends Context.Service<RootApiService, { readonly root: string }>()("RootApiService") {}
export const dependencies = Layer.succeed(RootApiService, { root: "root" });
`,
      "src/apis/_errors.ts": `
import * as Schema from "effect/Schema";

export const error = Schema.Struct({ message: Schema.String });
`,
      "src/apis/_openapi.ts": `
export default { annotations: { summary: "api root" as const } };
`,
      "src/apis/articles/_headers.ts": `
import * as Schema from "effect/Schema";

export const headers = Schema.Struct({ authorization: Schema.String });
`,
      "src/apis/articles/_middlewares.ts": `
export const middleware = "articles-middleware" as const;
`,
      "src/apis/articles/create.dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class CreateApiService extends Context.Service<CreateApiService, { readonly create: string }>()("CreateApiService") {}
export const dependencies = Layer.succeed(CreateApiService, { create: "create" });
`,
      "src/apis/articles/create.middlewares.ts": `
export const middleware = "create-middleware" as const;
`,
      "src/apis/articles/create.name.ts": `
export const name = "createArticle" as const;
`,
      "src/apis/articles/create.openapi.ts": `
export default { annotations: { summary: "create" as const } };
`,
      "src/apis/articles/create.ts": `
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import type {
  ApiTypes,
  Dependencies,
  Handler,
  Middlewares,
  Name,
  OpenApi,
  Prefixes,
  RawHandler,
} from "./$api-types";
import type * as Layer from "effect/Layer";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

export const route = Route.Parse("/articles");
export const method = "POST";
export const body = Schema.Struct({ article: Schema.Struct({ title: Schema.String }) });
export const success = Schema.Struct({ ok: Schema.String });
export const openapi = { annotations: { description: "in-file" as const } };

type _dependencies = Expect<Equals<
  Dependencies,
  Layer.Layer<
    Layer.Success<
      | typeof import("../_dependencies.js").dependencies
      | typeof import("./create.dependencies.js").dependencies
    >,
    Layer.Error<
      | typeof import("../_dependencies.js").dependencies
      | typeof import("./create.dependencies.js").dependencies
    >,
    Layer.Services<
      | typeof import("../_dependencies.js").dependencies
      | typeof import("./create.dependencies.js").dependencies
    >
  >
>>;
type _middlewares = Expect<Equals<
  Middlewares,
  readonly [
    typeof import("./_middlewares.js").middleware,
    typeof import("./create.middlewares.js").middleware,
  ]
>>;
type _prefixes = Expect<Equals<Prefixes, readonly []>>;
type _openApi = Expect<Equals<
  OpenApi,
  typeof openapi
>>;
type _name = Expect<Equals<Name, typeof import("./create.name.js").name>>;
type _apiTypes = Expect<Equals<ApiTypes["dependencies"], Dependencies>>;
type _apiTypeOpenApi = Expect<Equals<ApiTypes["openApi"], OpenApi>>;

export const handler = Effect.fn("Articles.create")(function* ({ body, headers }) {
  const authorization: string = headers.authorization;
  const title: string = body.article.title;
  return yield* HttpServerResponse.json({ authorization, title });
}) satisfies RawHandler;

export const typedHandler = Effect.fn("Articles.create.typed")(function* ({ body, headers }) {
  if (headers.authorization === "") {
    return yield* Effect.fail({ message: "missing" });
  }
  return { ok: body.article.title };
}) satisfies Handler;
`,
    });
    const importer = join(fixture.root, "src/apis/articles/create.ts");
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
    const result = createHttpApiVirtualModulePlugin().build("./$api-types", importer, session.api);
    const source = getSourceText(result);

    expect(source).toContain("ApiHandlerSuccessFromConfig");
    expect(source).toContain("ApiHandlerErrorFromConfig");
    expect(source).toContain('import type * as InheritedErrors0 from "../_errors.js";');
    expect(source).toContain('import type * as InheritedHeaders0 from "./_headers.js";');
    expect(source).toContain("export type Dependencies =");
    expect(source).toContain("export type Middlewares =");
    expect(source).toContain("export type Prefixes =");
    expect(source).toContain("export type OpenApi =");
    expect(source).not.toContain("export type OpenApis");
    expect(source).toContain("export type ApiTypes = {");
    expect(source).toContain("export type HandlerSuccess = ApiHandlerSuccessFromConfig<Config>;");
    expect(source).toContain("export type HandlerError = ApiHandlerErrorFromConfig<Config>;");
    expect(source).toContain("export type Handler<R = any> = (");
    expect(source).toContain("Effect.Effect<HandlerSuccess, HandlerError | HttpServerError.HttpServerError, R>");
    expect(source).toContain("export type RawHandler<R = any> = (");
    expect(source).toContain(
      "Effect.Effect<HttpServerResponse.HttpServerResponse, HandlerError, R>",
    );
    expect(source).not.toContain("RawHandler<E");
    expect(source).not.toContain("Effect.Effect<Success");

    const typeCheck = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/apis/articles/$api-types.ts",
      sourceText: source ?? "",
      rootFiles: fixture.paths,
      moduleFallbacks: HTTPAPI_MODULE_FALLBACKS,
    });
    expect(typeCheck.diagnostics).toEqual([]);
  });

  it("applies directory dependencies to the owning HttpApiGroup layer", () => {
    const fixture = createApiFixture({
      "src/apis/users/_dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class UsersService extends Context.Service<UsersService, { readonly users: string }>()("UsersService") {}
export default Layer.succeed(UsersService, { users: "users" });
`,
      "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
    });
    const result = buildApiFromExistingFixture(fixture);
    const sourceText = getSourceText(result);

    expect(sourceText).toContain('import * as UsersDependencies from "./apis/users/_dependencies.js";');
    expect(sourceText).toContain(
      'HttpApiBuilder.group(Api, "users", (handlers) => handlers.handle("list", ApiHandlers.handler(UsersList))).pipe(Layer.provideMerge(Router.normalizeDependencyInput(UsersDependencies.default)))',
    );
  });

  it("re-exports discovered API dependencies as a reusable layer", () => {
    const fixture = createApiFixture({
      "src/apis/_dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class RootApiService extends Context.Service<RootApiService, { readonly root: string }>()("RootApiService") {}
export default Layer.succeed(RootApiService, { root: "root" });
`,
      "src/apis/users/_dependencies.ts": `
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class UsersService extends Context.Service<UsersService, { readonly users: string }>()("UsersService") {}
export default Layer.succeed(UsersService, { users: "users" });
`,
      "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
    });
    const result = buildApiFromExistingFixture(fixture);
    const sourceText = getSourceText(result);

    expect(sourceText).toContain("export const DependenciesLayer = Layer.mergeAll(");
    expect(sourceText).toContain("Router.normalizeDependencyInput(Dependencies.default)");
    expect(sourceText).toContain("Router.normalizeDependencyInput(UsersDependencies.default)");
  });

  it("accepts Context default exports in generated Dependencies types", () => {
    const fixture = createApiFixture({
      "src/apis/_dependencies.ts": `
import * as Context from "effect/Context";

export class RootConfig extends Context.Service<RootConfig, { readonly root: string }>()("RootConfig") {}
export default Context.make(RootConfig, { root: "root" });
`,
      "src/apis/items/list.ts": VALID_ENDPOINT_SOURCE.replace(
        'Route.Parse("/articles")',
        'Route.Parse("/items")',
      ),
    });
    const importer = join(fixture.root, "src/apis/items/list.ts");
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
    const result = createHttpApiVirtualModulePlugin().build("./$api-types", importer, session.api);

    expect(typeof result).toBe("string");
    if (typeof result !== "string") return;

    expect(result).toContain("NormalizeDependency");
    expect(result).not.toContain("type DependencyLayer<");

    const typeCheck = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/apis/items/$api-types.ts",
      sourceText: result,
      rootFiles: fixture.paths,
      moduleFallbacks: HTTPAPI_MODULE_FALLBACKS,
    });
    expect(typeCheck.diagnostics).toEqual([]);
  });

  it("emits plugin-specific decoded API types for an endpoint importing ./$api-types", () => {
    const fixture = createApiFixture({
      "src/apis/articles.ts": `
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import type { RawHandler } from "./$api-types";

export const route = Route.Join(
  Route.Parse("/articles"),
  Route.QueryParams(Route.Int("page")),
);
export const method = "POST";
export const headers = Schema.Struct({ authorization: Schema.String });
export const body = Schema.Struct({ article: Schema.Struct({ title: Schema.String }) });

export const handler = (({ headers, query, body }) => {
  const authorization: string = headers.authorization;
  const page: number = query.page;
  const title: string = body.article.title;
  return HttpServerResponse.json({ authorization, page, title }).pipe(Effect.orDie);
}) satisfies RawHandler;
`,
    });
    const importer = join(fixture.root, "src/apis/articles.ts");
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
    const result = createHttpApiVirtualModulePlugin().build("./$api-types", importer, session.api);

    expect(typeof result).toBe("string");
    if (typeof result !== "string") return;
    expect(result).not.toContain("type DependencyValue");
    expect(result).not.toContain("type MiddlewareValue");
    expect(result).not.toContain("type OpenApiValue");

    const typeCheck = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/apis/$api-types.ts",
      sourceText: result,
      rootFiles: fixture.paths,
      moduleFallbacks: HTTPAPI_MODULE_FALLBACKS,
    });
    expect(typeCheck.diagnostics).toEqual([]);
  });

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
      id: "typed:api?dir=./apis",
      importer: fixture.importer,
      createTypeInfoApiSession: sessionFactory,
    });

    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;
    expect(resolved.pluginName).toBe("httpapi-virtual-module");
    expect(resolved.sourceText).toMatchInlineSnapshot(`
      "import { composeWithLayers, type LayerOrGroup } from "@typed/app/runtime";
      import { resolveConfig } from "@typed/app/internal/resolveConfig";
      import { TypedHttpServer } from "@typed/app/TypedHttpServer";
      import { ApiHandlers } from "@typed/app/httpapi/Handlers";
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
      import * as TypedConfigModule from "typed:config";
      import * as Status from "./apis/status.js";

      export const Api = HttpApi.make("apis").add(HttpApiGroup.make("root").add(HttpApiEndpoint.get("status", Status.route.path, { params: Status.route.pathSchema, query: Status.route.querySchema, success: Status.success, error: Status.error })));
      export const DependenciesLayer = Layer.empty;
      export const ApiLayer = HttpApiBuilder.layer(Api).pipe(Layer.provideMerge(HttpApiBuilder.group(Api, "root", (handlers) => handlers.handle("status", ApiHandlers.handler(Status)))));
      export const OpenApi = OpenApiModule.fromApi(Api);
      export const Swagger = HttpApiSwagger.layer(Api);
      export const Scalar = HttpApiScalar.layer(Api);
      export const Client = HttpApiClient.make(Api);

      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };

      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");

      function joinBuildPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }

      type HttpApiRuntimeConfig = {
        readonly disableListenLog?: boolean;
        readonly host?: string;
        readonly port?: number;
      };

      function isDevImportMeta(meta: ImportMeta & { readonly env?: { readonly DEV?: boolean } }): boolean {
        return meta.env?.DEV === true;
      }

      export const App = <const Layers extends readonly LayerOrGroup[]>(
        config: HttpApiRuntimeConfig = {},
        ...layersToMergeIntoRouter: Layers
      ) => {
        const disableListenLog = config?.disableListenLog ?? false;
        const appLayer = composeWithLayers(ApiLayer, layersToMergeIntoRouter);
        return HttpRouter.serve(appLayer, { disableListenLog })
      };

      export const serve = <const Layers extends readonly LayerOrGroup[]>(
        config: HttpApiRuntimeConfig = {},
        ...layersToMergeIntoRouter: Layers
      ) =>
        Layer.unwrap(
          Effect.gen(function* () {
            const host = yield* resolveConfig(config?.host, "0.0.0.0");
            const port = yield* resolveConfig(config?.port, 3000);
            const disableListenLog = yield* resolveConfig(config?.disableListenLog, false);
            const dev = isDevImportMeta(import.meta);
            const appConfig = { disableListenLog };
            const staticAssetsLayer = TypedHttpServer.staticAssets({
              projectRoot: process.cwd(),
              clientOutDir,
              dev,
            });
            const appLayers = [staticAssetsLayer, ...layersToMergeIntoRouter] as const;
            const appLayer = App(appConfig, ...appLayers);
            const serverLayer = TypedHttpServer.layer({
              host,
              port,
              projectRoot: process.cwd(),
              dev,
            });
            return appLayer.pipe(Layer.provide(serverLayer));
          }),
        );
      "
    `);
  });

  it("returns unresolved when id does not match", () => {
    const { importer } = createApiFixture({});
    const manager = new PluginManager([createHttpApiVirtualModulePlugin()]);
    const resolved = manager.resolveModule({ id: "typed:router?dir=./routes", importer });
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
      expect(api.isAssignableTo(handlerExport!.type, "Effect", [{ kind: "returnType" }])).toBe(
        true,
      );
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
    const result = plugin.build("typed:api?dir=./apis", fixture.importer, session.api);
    expect(result).toHaveProperty("errors");
    expect(
      (result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-003"),
    ).toBe(true);
  });
});

describe("HttpApi assignableTo and validation (comprehensive)", () => {
  describe("3a. Type-target resolution", () => {
    it("Resolution with bootstrap: build succeeds; assignableTo populated for Route, Effect, Schema", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('handlers.handle("status", ApiHandlers.handler(Status))');
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
      expect(
        (result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-003"),
      ).toBe(true);
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
        plugin.build("typed:api?dir=./apis", fixture.importer, session.api);
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

    it("Handler returns HttpServerResponse: emits a typed handler adapter", () => {
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
      expect(sourceText).toContain('handlers.handle("raw", ApiHandlers.handler(Raw))');
      expect(sourceText).not.toContain("handleRaw");
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
      expect(sourceText).toContain('handlers.handle("raw", ApiHandlers.handler(Raw))');
      expect(sourceText).toContain('handle("status", ApiHandlers.handler(Status))');
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
      expect(
        (result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-005"),
      ).toBe(true);
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
      expect(
        (result as VirtualModuleBuildError).errors.some((e) => e.code === "AVM-CONTRACT-006"),
      ).toBe(true);
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
      expect(sourceText).toContain('HttpApiGroup.make("users")');
      expect(sourceText).toContain("list");
      expect(sourceText).toContain("items/get");
    });

    it("_group.ts name export overrides the generated HttpApiGroup name", () => {
      const result = buildApiFromFixture({
        "src/apis/articles/_group.ts": 'export const name = "ArticleResources" as const;',
        "src/apis/articles/list.ts": VALID_ENDPOINT_SOURCE,
      });
      const sourceText = getSourceText(result);

      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('HttpApiGroup.make("ArticleResources")');
      expect(sourceText).toContain('HttpApiBuilder.group(Api, "ArticleResources"');
      expect(sourceText).not.toContain('HttpApiGroup.make("articles")');
    });

    it("Multiple endpoints per group: correct wiring", () => {
      const result = buildApiFromFixture({
        "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
        "src/apis/users/get.ts": VALID_ENDPOINT_SOURCE,
        "src/apis/users/update.ts": VALID_ENDPOINT_SOURCE,
      });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('handlers.handle("get", ApiHandlers.handler(UsersGet))');
      expect(sourceText).toContain('handle("list", ApiHandlers.handler(UsersList))');
      expect(sourceText).toContain('handle("update", ApiHandlers.handler(UsersUpdate))');
    });
  });

  describe("3f. Handler adapter paths", () => {
    it("Direct handler export: emitted correctly", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('handlers.handle("status", ApiHandlers.handler(Status))');
    });

    it("value return: handlers.handle with decoded params", () => {
      const result = buildApiFromFixture({ "src/apis/status.ts": VALID_ENDPOINT_SOURCE });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('handlers.handle("status", ApiHandlers.handler(Status))');
    });

    it("HttpServerResponse return: handler receives typed endpoint params", () => {
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
      expect(sourceText).toContain('handlers.handle("raw", ApiHandlers.handler(Raw))');
      expect(sourceText).not.toContain("Effect.map(Raw.handler");
      expect(sourceText).not.toContain("Effect.mapError(Raw.handler");
    });

    it("body endpoints pass decoded payload to the typed handler", () => {
      const rawHandlerSource = `
        import * as Effect from "effect/Effect";
        import * as Schema from "effect/Schema";
        import * as Route from "@typed/router";
        import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
        import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
        export const route = Route.Parse("/raw");
        export const method = "POST";
        export const body = Schema.Struct({ name: Schema.String });
        export const success = Schema.Struct({});
        export const error = Schema.Struct({ message: Schema.String });
        export const handler = ApiHandlerRaw({ route, method, body })(({ body }) =>
          Effect.succeed(HttpServerResponse.json({ name: body.name }))
        );
      `;
      const result = buildApiFromFixture({ "src/apis/raw.ts": rawHandlerSource });
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain(
        'handlers.handle("raw", ApiHandlers.handler(Raw, { body: "payload" }))',
      );
      expect(sourceText).not.toContain("HttpIncomingMessage.schemaBodyJson(Raw.body)");
      expect(sourceText).not.toContain("handleRaw");
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

    it("composes API, directory, and nested group prefixes recursively", () => {
      const result = buildApiFromFixture({
        "src/domain.ts": `
import * as Schema from "effect/Schema";
export const Success = Schema.Struct({ ok: Schema.Boolean });
`,
        "src/apis/_api.ts": `
import * as Route from "@typed/router";
export const prefix = Route.Parse("/api");
`,
        "src/apis/articles/_prefix.ts": `
import * as Route from "@typed/router";
export default Route.Parse("/articles");
`,
        "src/apis/articles/comments/_group.ts": `
import * as Route from "@typed/router";
export const prefix = Route.Parse("/:slug/comments");
`,
        "src/apis/articles/comments/delete.ts": `
import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Success } from "../../../domain.js";
export const route = Route.Int("commentId");
export const method = "DELETE";
export const success = Success;
export const handler = () => Effect.succeed({ ok: true });
`,
      });
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('.prefix("/api/articles/:slug/comments")');
      expect(sourceText).not.toContain('.prefix("/:slug/comments")');
    });

    it("uses recursive directory prefixes for endpoint route schemas", () => {
      const result = buildApiFromFixture({
        "src/domain.ts": `
import * as Schema from "effect/Schema";
export const Success = Schema.Struct({ ok: Schema.Boolean });
`,
        "src/apis/_api.ts": `
import * as Route from "@typed/router";
export const prefix = Route.Parse("/api");
`,
        "src/apis/articles/_prefix.ts": `
import * as Route from "@typed/router";
export default Route.Parse("/articles");
`,
        "src/apis/articles/comments/_prefix.ts": `
import * as Route from "@typed/router";
export default Route.Parse("/:slug/comments");
`,
        "src/apis/articles/comments/delete.ts": `
import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Success } from "../../../domain.js";
export const route = Route.Int("commentId");
export const method = "DELETE";
export const success = Success;
export const handler = () => Effect.succeed({ ok: true });
`,
      });
      const sourceText = getSourceText(result);

      expect(sourceText).toBeDefined();
      expect(sourceText).toContain('import * as ArticlesPrefix from "./apis/articles/_prefix.js";');
      expect(sourceText).toContain(
        'import * as ArticlesCommentsPrefix from "./apis/articles/comments/_prefix.js";',
      );
      expect(sourceText).toContain("const ApiRoute = ApiRoot.prefix;");
      expect(sourceText).toContain(
        "const ArticlesRoute = Route.Join(ApiRoute, ArticlesPrefix.default);",
      );
      expect(sourceText).toContain(
        "const ArticlesCommentsRoute = Route.Join(ArticlesRoute, ArticlesCommentsPrefix.default);",
      );
      expect(sourceText).toContain(
        "const ArticlesCommentsDeleteRoute = Route.Join(ArticlesCommentsRoute, ArticlesCommentsDelete.route);",
      );
      expect(sourceText).toContain("params: ArticlesCommentsDeleteRoute.pathSchema");
      expect(sourceText).toContain("query: ArticlesCommentsDeleteRoute.querySchema");
      expect(sourceText).not.toContain(
        "params: Route.Join(ApiRoot.prefix, ArticlesPrefix.default, ArticlesCommentsPrefix.default, ArticlesCommentsDelete.route).pathSchema",
      );
    });

    it("uses recursive directory prefixes for client endpoint route schemas", () => {
      const fixture = createApiFixture({
        "src/domain.ts": `
import * as Schema from "effect/Schema";
export const Success = Schema.Struct({ ok: Schema.Boolean });
`,
        "src/apis/articles/_prefix.ts": `
import * as Route from "@typed/router";
export default Route.Parse("/articles");
`,
        "src/apis/articles/comments/_prefix.ts": `
import * as Route from "@typed/router";
export default Route.Parse("/:slug/comments");
`,
        "src/apis/articles/comments/delete.ts": `
import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Success } from "../../../domain.js";
export const route = Route.Int("commentId");
export const method = "DELETE";
export const success = Success;
export const handler = () => Effect.succeed({ ok: true });
`,
      });
      const sourceText = getSourceText(
        buildApiFromExistingFixture(fixture, undefined, "typed:api?dir=./apis&mode=client"),
      );

      expect(sourceText).toBeDefined();
      expect(sourceText).toContain(
        'const ArticlesRoute = ArticlesPrefixDefaultRoute.Parse("/articles");',
      );
      expect(sourceText).toContain(
        'const ArticlesCommentsRoute = Route.Join(ArticlesRoute, ArticlesCommentsPrefixDefaultRoute.Parse("/:slug/comments"));',
      );
      expect(sourceText).toContain(
        "const ArticlesCommentsDeleteRoute = Route.Join(ArticlesCommentsRoute, ArticlesCommentsDeleteRouteRoute.Int(\"commentId\"));",
      );
      expect(sourceText).toContain("params: ArticlesCommentsDeleteRoute.pathSchema");
      expect(sourceText).toContain("query: ArticlesCommentsDeleteRoute.querySchema");
    });

    it("_api.ts openapi.exposure: emits installed JSON, Swagger, and Scalar CDN layers", () => {
      const apiWithExposure = `
import * as Route from "@typed/router";
export const prefix = Route.Parse("/api");
export const openapi = {
  exposure: {
    jsonPath: "/api/docs/spec" as const,
    swaggerPath: "/api/docs/swagger" as const,
    scalar: {
      path: "/api/docs" as const,
      source: "cdn" as const,
      version: "1.25.0" as const,
      config: { theme: "moon" as const, hideModels: true as const },
    },
  },
};
`;
      const fixture = createApiFixture({
        "src/apis/_api.ts": apiWithExposure,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      if (!sourceText) return;
      expect(sourceText).toContain('openapiPath: "/api/docs/spec"');
      expect(sourceText).toContain('path: "/api/docs/swagger"');
      expect(sourceText).toContain("HttpApiScalar.layerCdn(Api");
      expect(sourceText).toContain('version: "1.25.0"');
      expect(sourceText).toContain('theme: "moon"');
      expect(sourceText).toContain("hideModels: true");
      expectHttpApiGeneratedSourceToTypeCheck(fixture, sourceText, "src/api-openapi.generated.ts");
    });

    it("_api.ts openapi.annotations: annotates generated Api with installed OpenApi annotations", () => {
      const apiWithAnnotations = `
export const openapi = {
  annotations: {
    title: "Status API" as const,
    version: "2026.05" as const,
    description: "Generated docs" as const,
  },
};
`;
      const fixture = createApiFixture({
        "src/apis/_api.ts": apiWithAnnotations,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      if (!sourceText) return;
      expect(sourceText).toContain("OpenApiModule.annotations");
      expect(sourceText).toContain('title: "Status API"');
      expect(sourceText).toContain('version: "2026.05"');
      expect(sourceText).toContain(".annotateMerge(");
      expectHttpApiGeneratedSourceToTypeCheck(
        fixture,
        sourceText,
        "src/api-openapi-annotations.generated.ts",
      );
    });

    it("_api.ts openapi.generation.additionalProperties false emits strict OpenAPI transform", () => {
      const apiWithGeneration = `
export const openapi = {
  generation: {
    additionalProperties: false as const,
  },
};
`;
      const fixture = createApiFixture({
        "src/apis/_api.ts": apiWithGeneration,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      if (!sourceText) return;
      expect(sourceText).toContain("const applyOpenApiAdditionalProperties");
      expect(sourceText).toContain("additionalProperties: false");
      expect(sourceText).toContain("OpenApiModule.annotations");
      expect(sourceText).toContain(".annotateMerge(");
      expect(sourceText).not.toContain("OpenApiModule.fromApi(Api,");
      expectHttpApiGeneratedSourceToTypeCheck(
        fixture,
        sourceText,
        "src/api-openapi-generation.generated.ts",
      );
    });

    it("_api.ts openapi.generation.additionalProperties true emits allow OpenAPI transform", () => {
      const fixture = createApiFixture({
        "src/apis/_api.ts": `
export const openapi = {
  generation: {
    additionalProperties: true as const,
  },
};
`,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toBeDefined();
      expect(sourceText).toContain("additionalProperties: true");
      expectHttpApiGeneratedSourceToTypeCheck(
        fixture,
        sourceText!,
        "src/api-openapi-generation-allow.generated.ts",
      );
    });

    it("_api.ts openapi generation composes with JSON Swagger and Scalar exposure", () => {
      const fixture = createApiFixture({
        "src/apis/_api.ts": `
export const openapi = {
  generation: { additionalProperties: false as const },
  exposure: {
    jsonPath: "/openapi.json" as const,
    swaggerPath: "/swagger" as const,
    scalar: { path: "/docs" as const, source: "inline" as const, config: { theme: "default" as const } },
  },
};
`,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toContain('openapiPath: "/openapi.json"');
      expect(sourceText).toContain('path: "/swagger"');
      expect(sourceText).toContain("HttpApiScalar.layer(Api");
      expect(sourceText).toContain("applyOpenApiAdditionalProperties");
      expectHttpApiGeneratedSourceToTypeCheck(
        fixture,
        sourceText!,
        "src/api-openapi-generation-exposure.generated.ts",
      );
    });

    it("returns AVM-OPENAPI-001 when generation appears outside _api.ts", () => {
      const result = buildApiFromFixture({
        "src/apis/users/_group.ts": `
export const openapi = {
  generation: { additionalProperties: false as const },
};
`,
        "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
      });
      expect(result).toHaveProperty("errors");
      const err = result as VirtualModuleBuildError;
      expect(err.errors.some((e) => e.code === "AVM-OPENAPI-001")).toBe(true);
    });

    it("returns AVM-OPENAPI-002 when exposure appears outside _api.ts", () => {
      const result = buildApiFromFixture({
        "src/apis/users/list.ts": `
${VALID_ENDPOINT_SOURCE}
export const openapi = {
  exposure: { jsonPath: "/bad.json" as const },
};
`,
      });
      expect(result).toHaveProperty("errors");
      const err = result as VirtualModuleBuildError;
      expect(err.errors.some((e) => e.code === "AVM-OPENAPI-002")).toBe(true);
    });

    it("returns AVM-OPENAPI-005 for object-shaped additionalProperties", () => {
      const result = buildApiFromFixture({
        "src/apis/_api.ts": `
export const openapi = {
  generation: { additionalProperties: { type: "string" as const } },
};
`,
        "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
      });
      expect(result).toHaveProperty("errors");
      const err = result as VirtualModuleBuildError;
      expect(err.errors.some((e) => e.code === "AVM-OPENAPI-005")).toBe(true);
    });

    it("_group.ts openapi.annotations annotates generated HttpApiGroup", () => {
      const fixture = createApiFixture({
        "src/apis/users/_group.ts": `
export const openapi = {
  annotations: {
    title: "Users" as const,
    description: "User management" as const,
  },
};
`,
        "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
      });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toContain('HttpApiGroup.make("users")');
      expect(sourceText).toContain('title: "Users"');
      expect(sourceText).toContain('description: "User management"');
      expect(sourceText).toContain(".annotateMerge(OpenApiModule.annotations");
      expectHttpApiGeneratedSourceToTypeCheck(
        fixture,
        sourceText!,
        "src/api-openapi-group-annotations.generated.ts",
      );
    });

    it("endpoint openapi.annotations annotates generated HttpApiEndpoint", () => {
      const endpoint = `
${VALID_ENDPOINT_SOURCE}
export const openapi = {
  annotations: {
    summary: "Status summary" as const,
    description: "Status description" as const,
  },
};
`;
      const fixture = createApiFixture({ "src/apis/status.ts": endpoint });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toContain('summary: "Status summary"');
      expect(sourceText).toContain('description: "Status description"');
      expect(sourceText).toContain("HttpApiEndpoint.get");
      expect(sourceText).toContain(".annotateMerge(OpenApiModule.annotations");
      expectHttpApiGeneratedSourceToTypeCheck(
        fixture,
        sourceText!,
        "src/api-openapi-endpoint-direct.generated.ts",
      );
    });

    it("endpoint OpenAPI annotations use in-file over companion over nearest inherited defaults", () => {
      const fixture = createApiFixture({
        "src/apis/_openapi.ts": `
export default {
  annotations: {
    summary: "Root default" as const,
    description: "Root default description" as const,
  },
};
`,
        "src/apis/users/_openapi.ts": `
export default {
  annotations: {
    summary: "Users default" as const,
    deprecated: true as const,
  },
};
`,
        "src/apis/users/list.openapi.ts": `
export default {
  annotations: {
    summary: "Companion summary" as const,
  },
};
`,
        "src/apis/users/list.ts": `
${VALID_ENDPOINT_SOURCE}
export const openapi = {
  annotations: {
    description: "In-file description" as const,
  },
};
`,
      });
      const result = buildApiFromExistingFixture(fixture);
      expect(result).not.toHaveProperty("errors");
      const sourceText = getSourceText(result);
      expect(sourceText).toContain('summary: "Companion summary"');
      expect(sourceText).toContain('description: "In-file description"');
      expect(sourceText).toContain("deprecated: true");
      expect(sourceText).not.toContain("Root default description");
      expectHttpApiGeneratedSourceToTypeCheck(
        fixture,
        sourceText!,
        "src/api-openapi-endpoint-precedence.generated.ts",
      );
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
