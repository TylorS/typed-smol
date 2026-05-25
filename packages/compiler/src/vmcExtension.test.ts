import { describe, expect, it } from "vitest";
import ts from "typescript";
import { createTypedCompilerExtension } from "./vmcExtension.js";

describe("createTypedCompilerExtension", () => {
  it("transforms imported typed html templates through direct DOM factories", () => {
    const extension = createTypedCompilerExtension();
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<p>${name}</p>`;",
    ].join("\n");
    const sourceFile = ts.createSourceFile("/project/view.ts", sourceText, ts.ScriptTarget.Latest);

    const result = extension.transformSource?.({
      fileName: "/project/view.ts",
      options: {},
      projectRoot: "/project",
      rootNames: ["/project/view.ts"],
      sourceFile,
      sourceText,
      ts,
    });

    expect(result?.diagnostics).toEqual([]);
    expect(result?.sourceText).toMatchInlineSnapshot(`
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

  it("does not rewrite modules without typed template imports", () => {
    const extension = createTypedCompilerExtension();
    const sourceText = "export const view = String.raw`<p>static</p>`;";
    const sourceFile = ts.createSourceFile("/project/view.ts", sourceText, ts.ScriptTarget.Latest);

    const result = extension.transformSource?.({
      fileName: "/project/view.ts",
      options: {},
      projectRoot: "/project",
      rootNames: ["/project/view.ts"],
      sourceFile,
      sourceText,
      ts,
    });

    expect(result).toBeUndefined();
  });

  it("transforms route modules through route continuation descriptors", () => {
    const extension = createTypedCompilerExtension();
    const sourceText = "export const route = (name: string) => name;";
    const sourceFile = ts.createSourceFile(
      "/project/src/routes/profile.ts",
      sourceText,
      ts.ScriptTarget.Latest,
    );

    const result = extension.transformSource?.({
      fileName: "/project/src/routes/profile.ts",
      options: {},
      projectRoot: "/project",
      rootNames: ["/project/src/routes/profile.ts"],
      sourceFile,
      sourceText,
      ts,
    });

    expect(result?.diagnostics).toEqual([]);
    expect(result?.sourceText).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      interface __TypedHot {
        readonly data: Record<string, unknown>;
        readonly accept: {
          (): void;
          (callback: (nextModule: Record<string, unknown> | undefined) => void): void;
        };
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      }
      declare global {
        interface ImportMeta {
          readonly hot?: __TypedHot;
        }
      }
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:generated-context:name:/project/src/routes/profile.ts#param:name\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:generated-context:name:string\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/project/src/routes/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
      const __typedRouteHmrKey = "__typed_route_hmr:/project/src/routes/profile.ts";
      const __typedRouteHot = import.meta.hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot && import.meta.hot) {
        import.meta.hot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /project/src/routes/profile.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /project/src/routes/profile.ts");
        }
      }
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, string>()("/project/src/routes/profile.ts#route:generated-context:name") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "name",
            "serviceId": "/project/src/routes/profile.ts#route:generated-context:name",
            "type": "string"
          }
        ],
        "fingerprint": "context:generated-context:name:string"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:generated-context:name:/project/src/routes/profile.ts#param:name",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/project/src/routes/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/project/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:generated-context:name:string",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/project/src/routes/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/project/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/project/src/routes/profile.ts#closure:route",
        "moduleId": "/project/src/routes/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-name"
          ]
        },
        "services": [
          {
            "id": "/project/src/routes/profile.ts#route:generated-context:name",
            "kind": "parameter",
            "name": "name",
            "typeText": "string"
          }
        ],
        "symbolId": "/project/src/routes/profile.ts#closure:route",
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

  it("uses configured route directories for route transforms", () => {
    const extension = createTypedCompilerExtension({ routeDirectories: ["src/pages"] });
    const sourceText = "export const route = (name: string) => name;";
    const sourceFile = ts.createSourceFile(
      "/project/src/pages/profile.ts",
      sourceText,
      ts.ScriptTarget.Latest,
    );

    const result = extension.transformSource?.({
      fileName: "/project/src/pages/profile.ts",
      options: {},
      projectRoot: "/project",
      rootNames: ["/project/src/pages/profile.ts"],
      sourceFile,
      sourceText,
      ts,
    });

    expect(result?.diagnostics).toEqual([]);
    expect(result?.sourceText).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      interface __TypedHot {
        readonly data: Record<string, unknown>;
        readonly accept: {
          (): void;
          (callback: (nextModule: Record<string, unknown> | undefined) => void): void;
        };
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      }
      declare global {
        interface ImportMeta {
          readonly hot?: __TypedHot;
        }
      }
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:generated-context:name:/project/src/pages/profile.ts#param:name\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:generated-context:name:string\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/project/src/pages/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
      const __typedRouteHmrKey = "__typed_route_hmr:/project/src/pages/profile.ts";
      const __typedRouteHot = import.meta.hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot && import.meta.hot) {
        import.meta.hot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /project/src/pages/profile.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /project/src/pages/profile.ts");
        }
      }
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, string>()("/project/src/pages/profile.ts#route:generated-context:name") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "name",
            "serviceId": "/project/src/pages/profile.ts#route:generated-context:name",
            "type": "string"
          }
        ],
        "fingerprint": "context:generated-context:name:string"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:generated-context:name:/project/src/pages/profile.ts#param:name",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/project/src/pages/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/project/src/pages/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:generated-context:name:string",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:name:/project/src/pages/profile.ts#param:name\\",\\"contextFingerprint\\":\\"context:generated-context:name:string\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/project/src/pages/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/project/src/pages/profile.ts#closure:route",
        "moduleId": "/project/src/pages/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-name"
          ]
        },
        "services": [
          {
            "id": "/project/src/pages/profile.ts#route:generated-context:name",
            "kind": "parameter",
            "name": "name",
            "typeText": "string"
          }
        ],
        "symbolId": "/project/src/pages/profile.ts#closure:route",
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
});
