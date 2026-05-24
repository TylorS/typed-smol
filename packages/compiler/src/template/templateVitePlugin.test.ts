import ts from "typescript";
import { describe, expect, it } from "vitest";
import { typedTemplateVitePlugin } from "./templateVitePlugin.js";
import { invalidTemplateModuleSource } from "./templateFixtures.js";

describe("typedTemplateVitePlugin", () => {
  it("transforms typed html templates in Vite transform hooks", async () => {
    const plugin = typedTemplateVitePlugin();
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<p>${name}</p>`;",
    ].join("\n");

    const result = await transform(plugin, sourceText, "/src/view.ts");

    expect(result).toMatchObject({ map: null });
    expect(result?.code).toMatchInlineSnapshot(`
      "import { html } from "@typed/template";
      import * as __typedTemplateEffect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";

      const __typed_template_0 = defineDomTemplate({
        templateHash: "KwZ/fKKViAs=",
        html: "<p><!--n_0--></p>",
        mount(instance, values, runtime) {
          return __typedTemplateEffect.all([bindNode(getCommentAtPath(instance.root, [
        0,
        0
      ]), values[0], "unknown", runtime)], { concurrency: "unbounded" });
        }
      });


      const name = 'Ada';
      export const view = __typed_template_0(name);"
    `);
  });

  it("derives template target from the Vite transform context", async () => {
    const plugin = typedTemplateVitePlugin();
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<p>${name}</p>`;",
    ].join("\n");

    const result = await transform(plugin, sourceText, "/src/view.ts", undefined, { ssr: true });

    expect(result?.code).toMatchInlineSnapshot(`
      "import { html } from "@typed/template";
      import { defineServerTemplate, renderServerChunks } from "@typed/template/compiler-runtime/server";

      const __typed_template_0 = defineServerTemplate({
        templateHash: "KwZ/fKKViAs=",
        chunks: [
        {
          "kind": "text",
          "text": "<p"
        },
        {
          "kind": "text",
          "text": ">"
        },
        {
          "kind": "text",
          "text": "<!--n_0-->"
        },
        {
          "kind": "slot",
          "valueIndex": 0,
          "valueKind": "unknown",
          "mode": "node"
        },
        {
          "kind": "text",
          "text": "<!--/n_0-->"
        },
        {
          "kind": "text",
          "text": "</p>"
        }
      ],
        render(values, runtime) {
          return renderServerChunks(values, runtime, [
        {
          "kind": "text",
          "text": "<p"
        },
        {
          "kind": "text",
          "text": ">"
        },
        {
          "kind": "text",
          "text": "<!--n_0-->"
        },
        {
          "kind": "slot",
          "valueIndex": 0,
          "valueKind": "unknown",
          "mode": "node"
        },
        {
          "kind": "text",
          "text": "<!--/n_0-->"
        },
        {
          "kind": "text",
          "text": "</p>"
        }
      ]);
        }
      });


      const name = 'Ada';
      export const view = __typed_template_0(name);"
    `);
  });

  it("leaves modules unchanged when template transforms are disabled", async () => {
    const plugin = typedTemplateVitePlugin({ enabled: false });
    const sourceText = [
      'import { html } from "@typed/template";',
      "export const view = html`<p>Hi</p>`;",
    ].join("\n");

    await expect(transform(plugin, sourceText, "/src/view.ts")).resolves.toBeNull();
  });

  it("ignores non TypeScript and JavaScript module ids", async () => {
    const plugin = typedTemplateVitePlugin();
    const sourceText = 'import { html } from "@typed/template";\nhtml`<p>Hi</p>`;';

    await expect(transform(plugin, sourceText, "/src/view.css")).resolves.toBeNull();
  });

  it("reports template diagnostics through the Vite hook context", async () => {
    const warnings: string[] = [];
    const plugin = typedTemplateVitePlugin({ diagnostics: "warn" });

    await expect(
      transform(plugin, invalidTemplateModuleSource, "/src/view.ts", {
        warn: (message) => warnings.push(message),
        error: (error) => {
          throw new Error(String(error));
        },
      }),
    ).resolves.toBeNull();

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchInlineSnapshot(`"TYPED-TEMPLATE-ANALYZE-001: Expected AttrValueDq or AttrValueSq or AttrValueNq but got OpenTagEnd"`);
  });

  it("transforms route modules through the same Vite transform hook", async () => {
    const plugin = typedTemplateVitePlugin();
    const sourceText = "export const route = (name: string) => name;";

    const result = await transform(plugin, sourceText, "/src/routes/profile.ts");

    expect(result?.code).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:generated-context:name:/src/routes/profile.ts#param:name\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:generated-context:name:string\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
      const __typedRouteHmrKey = "__typed_route_hmr:/src/routes/profile.ts";
      const __typedRouteHot = (import.meta as ImportMeta & { readonly hot?: __TypedRouteHot }).hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot) {
        __typedRouteHot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/profile.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/profile.ts");
        }
      }
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, string>()("/src/routes/profile.ts#route:generated-context:name") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "name",
            "serviceId": "/src/routes/profile.ts#route:generated-context:name",
            "type": "string"
          }
        ],
        "fingerprint": "context:generated-context:name:string"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:generated-context:name:/src/routes/profile.ts#param:name",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/src/routes/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:generated-context:name:string",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/src/routes/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/profile.ts#closure:route",
        "moduleId": "/src/routes/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-name"
          ]
        },
        "services": [
          {
            "id": "/src/routes/profile.ts#route:generated-context:name",
            "kind": "parameter",
            "name": "name",
            "typeText": "string"
          }
        ],
        "symbolId": "/src/routes/profile.ts#closure:route",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        const name = yield* __typed_route_context_0_0;
        return name;
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: [
          { tag: __typed_route_context_0_0, valueIndex: 0 }
        ]
      });

      export const route = (name: string) => __typed_route_continuation_0.pipe(__typedRouteEffect.provideService(__typed_route_context_0_0, name));"
    `);
  });

  it("uses configured route directories for route transforms", async () => {
    const plugin = typedTemplateVitePlugin({ routeDirectories: ["pages"] });
    const sourceText = "export const route = (name: string) => name;";

    const page = await transform(plugin, sourceText, "/src/pages/profile.ts");
    const route = await transform(plugin, sourceText, "/src/routes/profile.ts");

    expect(page?.code).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:generated-context:name:/src/pages/profile.ts#param:name\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:generated-context:name:string\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/pages/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
      const __typedRouteHmrKey = "__typed_route_hmr:/src/pages/profile.ts";
      const __typedRouteHot = (import.meta as ImportMeta & { readonly hot?: __TypedRouteHot }).hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot) {
        __typedRouteHot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/pages/profile.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/pages/profile.ts");
        }
      }
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, string>()("/src/pages/profile.ts#route:generated-context:name") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "name",
            "serviceId": "/src/pages/profile.ts#route:generated-context:name",
            "type": "string"
          }
        ],
        "fingerprint": "context:generated-context:name:string"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:generated-context:name:/src/pages/profile.ts#param:name",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/src/pages/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/pages/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:generated-context:name:string",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/src/pages/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/pages/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/pages/profile.ts#closure:route",
        "moduleId": "/src/pages/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-name"
          ]
        },
        "services": [
          {
            "id": "/src/pages/profile.ts#route:generated-context:name",
            "kind": "parameter",
            "name": "name",
            "typeText": "string"
          }
        ],
        "symbolId": "/src/pages/profile.ts#closure:route",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        const name = yield* __typed_route_context_0_0;
        return name;
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: [
          { tag: __typed_route_context_0_0, valueIndex: 0 }
        ]
      });

      export const route = (name: string) => __typed_route_continuation_0.pipe(__typedRouteEffect.provideService(__typed_route_context_0_0, name));"
    `);
    expect(route).toBeNull();
  });

  it("passes configured TypeScript program facts into route transforms", async () => {
    const sourceText = [
      'import { client } from "./client";',
      'const label = "profile";',
      "export const route = () => client.load(label);",
    ].join("\n");
    const fixture = programFixture({
      "/src/routes/client.ts": `
        declare const RefSubject: {
          readonly Service: <A>() => (id: string) => unknown;
        };
        export const Client = RefSubject.Service<number>()("@app/Client");
        export const client = { load: (label: string) => [Client, label] };
      `,
      "/src/routes/profile.ts": sourceText,
    });
    const plugin = typedTemplateVitePlugin({ programProvider: () => fixture.program });

    const result = await transform(plugin, sourceText, "/src/routes/profile.ts");

    expect(result).toMatchObject({ map: null });
    expect(result?.code).toMatchInlineSnapshot(`
      "import { client } from "./client";
      import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:serializable-value:label::\\\\\\\\\\\\\\"profile\\\\\\\\\\\\\\"\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:serializable-value:label:\\\\\\\\\\\\\\"profile\\\\\\\\\\\\\\"\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[\\\\\\"/src/routes/client.ts:@app/Client\\\\\\"],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
      const __typedRouteHmrKey = "__typed_route_hmr:/src/routes/profile.ts";
      const __typedRouteHot = (import.meta as ImportMeta & { readonly hot?: __TypedRouteHot }).hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot) {
        __typedRouteHot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/profile.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/profile.ts");
        }
      }
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, "profile">()("/src/routes/profile.ts#route:serializable-value:label") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "label",
            "serviceId": "/src/routes/profile.ts#route:serializable-value:label",
            "type": "\\"profile\\""
          }
        ],
        "fingerprint": "context:serializable-value:label:\\"profile\\""
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:serializable-value:label::\\"profile\\"",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:serializable-value:label::\\\\\\"profile\\\\\\"\\",\\"contextFingerprint\\":\\"context:serializable-value:label:\\\\\\"profile\\\\\\"\\",\\"dependencyFingerprints\\":[\\"/src/routes/client.ts:@app/Client\\"],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:serializable-value:label:\\"profile\\"",
        "dependencyFingerprints": [
          "/src/routes/client.ts:@app/Client"
        ],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:serializable-value:label::\\\\\\"profile\\\\\\"\\",\\"contextFingerprint\\":\\"context:serializable-value:label:\\\\\\"profile\\\\\\"\\",\\"dependencyFingerprints\\":[\\"/src/routes/client.ts:@app/Client\\"],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/profile.ts#closure:route",
        "moduleId": "/src/routes/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-label"
          ]
        },
        "services": [
          {
            "id": "/src/routes/profile.ts#route:serializable-value:label",
            "kind": "serializable-value",
            "name": "label",
            "typeText": "\\"profile\\""
          }
        ],
        "symbolId": "/src/routes/profile.ts#closure:route",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        const label = yield* __typed_route_context_0_0;
        return client.load(label);
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: [
          { tag: __typed_route_context_0_0, valueIndex: 0 }
        ]
      });


      const label = "profile";
      export const route = () => __typed_route_continuation_0.pipe(__typedRouteEffect.provideService(__typed_route_context_0_0, label));"
    `);
  });

  it("invalidates updated route modules through handleHotUpdate", () => {
    const plugin = typedTemplateVitePlugin();
    const invalidated: unknown[] = [];
    const module = { id: "/src/routes/profile.ts" };
    const hook = plugin.handleHotUpdate;

    if (typeof hook !== "function") throw new Error("Expected handleHotUpdate hook.");
    const result = hook.call({} as never, {
      file: "/src/routes/profile.ts",
      modules: [module],
      read: async () => "",
      server: {
        moduleGraph: {
          invalidateModule: (item: unknown) => invalidated.push(item),
        },
      },
      timestamp: Date.now(),
    } as never);

    expect(result).toEqual([module]);
    expect(invalidated).toEqual([module]);
  });

  it("uses configured route directories for hot update invalidation", () => {
    const plugin = typedTemplateVitePlugin({ routeDirectories: ["pages"] });
    const invalidated: unknown[] = [];
    const module = { id: "/src/pages/profile.ts" };
    const hook = plugin.handleHotUpdate;

    if (typeof hook !== "function") throw new Error("Expected handleHotUpdate hook.");
    const result = hook.call({} as never, {
      file: "/src/pages/profile.ts",
      modules: [module],
      read: async () => "",
      server: {
        moduleGraph: {
          invalidateModule: (item: unknown) => invalidated.push(item),
        },
      },
      timestamp: Date.now(),
    } as never);

    expect(result).toEqual([module]);
    expect(invalidated).toEqual([module]);
  });
});

async function transform(
  plugin: ReturnType<typeof typedTemplateVitePlugin>,
  sourceText: string,
  id: string,
  context: { warn(message: string): void; error(error: unknown): never } = {
    warn: () => {},
    error: (error) => {
      throw error;
    },
  },
  options: { readonly ssr?: boolean } = {},
): Promise<{ readonly code: string; readonly map: null } | null> {
  const hook = plugin.transform;
  if (typeof hook !== "function") throw new Error("Expected function transform hook.");
  return (await hook.call(context, sourceText, id, options)) as
    | { readonly code: string; readonly map: null }
    | null;
}

function programFixture(files: Record<string, string>): {
  readonly program: ts.Program;
} {
  const normalized = new Map(Object.entries(files));
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const host: ts.CompilerHost = {
    ...defaultHost,
    fileExists: (fileName) => normalized.has(fileName) || defaultHost.fileExists(fileName),
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      const sourceText = normalized.get(fileName);
      return sourceText === undefined
        ? defaultHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
        : ts.createSourceFile(fileName, sourceText, languageVersion, true);
    },
    readFile: (fileName) => normalized.get(fileName) ?? defaultHost.readFile(fileName),
  };

  return {
    program: ts.createProgram([...normalized.keys()], options, host),
  };
}
