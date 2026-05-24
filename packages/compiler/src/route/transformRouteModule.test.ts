import { describe, expect, it } from "vitest";
import ts from "typescript";
import { transformRouteModule } from "./transformRouteModule.js";

describe("transformRouteModule", () => {
  it("emits continuation and context descriptors for parameter-only closures", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string, b: number) => a + b;`,
      ts,
    });

    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:generated-context:a:string|generated-context:b:number\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
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
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, string>()("/src/routes/profile.ts#route:generated-context:a") {}
      class __typed_route_context_0_1 extends __typedRouteContext.Service<__typed_route_context_0_1, number>()("/src/routes/profile.ts#route:generated-context:b") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "a",
            "serviceId": "/src/routes/profile.ts#route:generated-context:a",
            "type": "string"
          },
          {
            "name": "b",
            "serviceId": "/src/routes/profile.ts#route:generated-context:b",
            "type": "number"
          }
        ],
        "fingerprint": "context:generated-context:a:string|generated-context:b:number"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b\\",\\"contextFingerprint\\":\\"context:generated-context:a:string|generated-context:b:number\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:generated-context:a:string|generated-context:b:number",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b\\",\\"contextFingerprint\\":\\"context:generated-context:a:string|generated-context:b:number\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/profile.ts#closure:route",
        "moduleId": "/src/routes/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-a",
            "typed-route-resume-value-1-b"
          ]
        },
        "services": [
          {
            "id": "/src/routes/profile.ts#route:generated-context:a",
            "kind": "parameter",
            "name": "a",
            "typeText": "string"
          },
          {
            "id": "/src/routes/profile.ts#route:generated-context:b",
            "kind": "parameter",
            "name": "b",
            "typeText": "number"
          }
        ],
        "symbolId": "/src/routes/profile.ts#closure:route",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        const a = yield* __typed_route_context_0_0;
        const b = yield* __typed_route_context_0_1;
        return a + b;
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: [
          { tag: __typed_route_context_0_0, valueIndex: 0 },
          { tag: __typed_route_context_0_1, valueIndex: 1 }
        ]
      });

      export const route = (a: string, b: number) => __typed_route_continuation_0.pipe(__typedRouteEffect.provideService(__typed_route_context_0_0, a), __typedRouteEffect.provideService(__typed_route_context_0_1, b));"
    `);
    expect(result.plan.continuations[0]).toMatchObject({
      closureName: "route",
      contextFingerprint: "context:generated-context:a:string|generated-context:b:number",
      symbolId: "/src/routes/profile.ts#closure:route",
    });
  });

  it("lowers parameter-only closures through executable continuation symbols", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string, b: number) => a + b;`,
      ts,
    });

    expect(result.sourceText).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:generated-context:a:string|generated-context:b:number\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
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
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, string>()("/src/routes/profile.ts#route:generated-context:a") {}
      class __typed_route_context_0_1 extends __typedRouteContext.Service<__typed_route_context_0_1, number>()("/src/routes/profile.ts#route:generated-context:b") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "a",
            "serviceId": "/src/routes/profile.ts#route:generated-context:a",
            "type": "string"
          },
          {
            "name": "b",
            "serviceId": "/src/routes/profile.ts#route:generated-context:b",
            "type": "number"
          }
        ],
        "fingerprint": "context:generated-context:a:string|generated-context:b:number"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b\\",\\"contextFingerprint\\":\\"context:generated-context:a:string|generated-context:b:number\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:generated-context:a:string|generated-context:b:number",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:generated-context:a:/src/routes/profile.ts#param:a|generated-context:b:/src/routes/profile.ts#param:b\\",\\"contextFingerprint\\":\\"context:generated-context:a:string|generated-context:b:number\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/profile.ts#closure:route",
        "moduleId": "/src/routes/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-a",
            "typed-route-resume-value-1-b"
          ]
        },
        "services": [
          {
            "id": "/src/routes/profile.ts#route:generated-context:a",
            "kind": "parameter",
            "name": "a",
            "typeText": "string"
          },
          {
            "id": "/src/routes/profile.ts#route:generated-context:b",
            "kind": "parameter",
            "name": "b",
            "typeText": "number"
          }
        ],
        "symbolId": "/src/routes/profile.ts#closure:route",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        const a = yield* __typed_route_context_0_0;
        const b = yield* __typed_route_context_0_1;
        return a + b;
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: [
          { tag: __typed_route_context_0_0, valueIndex: 0 },
          { tag: __typed_route_context_0_1, valueIndex: 1 }
        ]
      });

      export const route = (a: string, b: number) => __typed_route_continuation_0.pipe(__typedRouteEffect.provideService(__typed_route_context_0_0, a), __typedRouteEffect.provideService(__typed_route_context_0_1, b));"
    `);
  });

  it("lowers generated route context through real Context.Service classes and Effect continuations", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string, b: number) => a + b;`,
      ts,
    });

    expect(result.sourceText).toContain("class __typed_route_context_0_0 extends __typedRouteContext.Service");
    expect(result.sourceText).toContain("const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen");
    expect(result.sourceText).toContain("yield* __typed_route_context_0_0");
    expect(result.sourceText).toContain("__typedRouteEffect.provideService(__typed_route_context_0_0, a)");
    expect(result.sourceText).not.toContain("__typed_route_context_values");
  });

  it("runs expression-bodied Effect pipelines inside generated continuations", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/login.ts",
      sourceText: `
        import { EventHandler } from "@typed/template";
        import * as Effect from "effect/Effect";
        import { formFromSubmitEvent } from "../common/workflowErrors.js";

        export const submitLogin = EventHandler.make(
          (event: SubmitEvent) => formFromSubmitEvent(event).pipe(Effect.asVoid),
          { preventDefault: true },
        );
      `,
      ts,
    });

    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain(
      "return yield* formFromSubmitEvent(event).pipe(Effect.asVoid);",
    );
    expect(result.sourceText).toContain(
      "(event: SubmitEvent) => __typed_route_continuation_0.pipe(__typedRouteEffect.provideService(__typed_route_context_0_0, event))",
    );
  });

  it("registers generated continuations with resumability runtime metadata", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string, b: number) => a + b;`,
      ts,
    });

    expect(routeRegistrationExcerpt(result.sourceText)).toMatchInlineSnapshot(`
      "import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: [
          { tag: __typed_route_context_0_0, valueIndex: 0 },
          { tag: __typed_route_context_0_1, valueIndex: 1 }
        ]
      });"
    `);
  });

  it("typechecks generated Context.Service continuation output", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string, b: number) => a + b;`,
      ts,
    });

    expect(generatedDiagnostics(result.sourceText)).toMatchInlineSnapshot(`[]`);
    expect(result.sourceText).not.toContain("__typed_route_context_values");
  });

  it("emits continuation descriptors for RefSubject.Service captures", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        const Count = RefSubject.Service<number>()("@app/Count");
        export const route = () => {
          const increment = () => Count.onSuccess(1);
          return html\`<button>\${increment}</button>\`;
        };
      `,
      ts,
    });

    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:refsubject-service:Count:@app/Count\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/counter.ts#closure:increment\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
      const __typedRouteHmrKey = "__typed_route_hmr:/src/routes/counter.ts";
      const __typedRouteHot = (import.meta as ImportMeta & { readonly hot?: __TypedRouteHot }).hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot) {
        __typedRouteHot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/counter.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/counter.ts");
        }
      }
      const __typed_route_context_0 = {
        "captures": [],
        "fingerprint": "context:"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:refsubject-service:Count:@app/Count",
        "closureName": "increment",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:refsubject-service:Count:@app/Count\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/counter.ts#closure:increment\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:refsubject-service:Count:@app/Count\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/counter.ts#closure:increment\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/counter.ts#closure:increment",
        "moduleId": "/src/routes/counter.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": []
        },
        "services": [],
        "symbolId": "/src/routes/counter.ts#closure:increment",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        return Count.onSuccess(1);
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: []
      });


              const Count = RefSubject.Service<number>()("@app/Count");
              export const route = () => {
                const increment = () => __typed_route_continuation_0;
                return html\`<button>\${increment}</button>\`;
              };
            "
    `);
    expect(result.plan.continuations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureFingerprint: "captures:refsubject-service:Count:@app/Count",
          closureName: "increment",
        }),
      ]),
    );
  });

  it("emits continuation descriptors for Context.Service captures", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `
        class ProfileClient extends Context.Service<
          ProfileClient,
          { readonly load: Effect.Effect<string> }
        >()("@app/ProfileClient") {}

        export const route = Effect.gen(function* route() {
          const client = yield* ProfileClient;
          const load = () => client.load;
          return html\`<section>\${yield* load()}</section>\`;
        });
      `,
      ts,
    });

    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:effect-service:ProfileClient:@app/ProfileClient\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/profile.ts#closure:route\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\",\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:effect-service:client:@app/ProfileClient\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/profile.ts#closure:load\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
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
      const __typed_route_context_0 = {
        "captures": [],
        "fingerprint": "context:"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:effect-service:ProfileClient:@app/ProfileClient",
        "closureName": "route",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:effect-service:ProfileClient:@app/ProfileClient\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:effect-service:ProfileClient:@app/ProfileClient\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:route\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/profile.ts#closure:route",
        "moduleId": "/src/routes/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": []
        },
        "services": [],
        "symbolId": "/src/routes/profile.ts#closure:route",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        const client = yield* ProfileClient;
        const load = () => client.load;
        return html\`<section>\${yield* load()}</section>\`;
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: []
      });
      const __typed_route_context_1 = {
        "captures": [],
        "fingerprint": "context:"
      };
      const __typed_route_descriptor_1 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:effect-service:client:@app/ProfileClient",
        "closureName": "load",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:effect-service:client:@app/ProfileClient\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:load\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:effect-service:client:@app/ProfileClient\\",\\"contextFingerprint\\":\\"context:\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/profile.ts#closure:load\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/profile.ts#closure:load",
        "moduleId": "/src/routes/profile.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": []
        },
        "services": [],
        "symbolId": "/src/routes/profile.ts#closure:load",
        "templateHashes": []
      };
      const __typed_route_continuation_1 = Object.assign(__typedRouteEffect.gen(function* () {
        const client = yield* ProfileClient;
        return client.load;
      }), { descriptor: __typed_route_descriptor_1 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_1,
        continuation: __typed_route_continuation_1,
        providers: []
      });


              class ProfileClient extends Context.Service<
                ProfileClient,
                { readonly load: Effect.Effect<string> }
              >()("@app/ProfileClient") {}

              export const route = Effect.gen(function* route() { return yield* __typed_route_continuation_0; });
            "
    `);
    expect(result.plan.continuations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureFingerprint: "captures:effect-service:client:@app/ProfileClient",
          closureName: "load",
        }),
      ]),
    );
  });

  it("rewrites inline RefSubject.make state through HMR lookup", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        export const route = Effect.gen(function* route() {
          const count = yield* RefSubject.make(0);
          const render = () => count;
          return render;
        });
      `,
      ts,
    });

    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import * as __typedRouteContext from "effect/Context";
      import * as __typedRouteEffect from "effect/Effect";
      import { registerRouteContinuation as __typedRegisterRouteContinuation, getDefaultRouteResumeRegistry as __typedGetRouteResumeRegistry } from "@typed/app/resumability";
      import { getOrCreateHmrStateEffect as __typedGetOrCreateHmrStateEffect } from "@typed/app/runtime/hmrRegistry";
      const __typedGetHmrStateEffect = (serviceId, create) => __typedGetOrCreateHmrStateEffect({ moduleId: import.meta.url, serviceId, shapeFingerprint: serviceId }, create);
      type __TypedRouteHot = {
        readonly data: Record<string, unknown>;
        readonly accept: (callback?: (nextModule: Record<string, unknown> | undefined) => void) => void;
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      };
      export const __typedRouteCompatibilityFingerprint = "{\\"continuations\\":[\\"{\\\\\\"captureFingerprint\\\\\\":\\\\\\"captures:inline-refsubject-migration:count:/src/routes/counter.ts#count\\\\\\",\\\\\\"contextFingerprint\\\\\\":\\\\\\"context:inline-refsubject-migration:count:unknown\\\\\\",\\\\\\"dependencyFingerprints\\\\\\":[],\\\\\\"symbolId\\\\\\":\\\\\\"/src/routes/counter.ts#closure:render\\\\\\",\\\\\\"templateHashes\\\\\\":[],\\\\\\"version\\\\\\":\\\\\\"1\\\\\\"}\\"],\\"version\\":\\"1\\"}";
      const __typedRouteHmrKey = "__typed_route_hmr:/src/routes/counter.ts";
      const __typedRouteHot = (import.meta as ImportMeta & { readonly hot?: __TypedRouteHot }).hot;
      const __typedPreviousFingerprint = __typedRouteHot?.data[__typedRouteHmrKey];
      if (__typedRouteHot) {
        __typedRouteHot.accept((nextModule) => {
          const nextFingerprint = nextModule?.__typedRouteCompatibilityFingerprint;
          if (nextFingerprint !== __typedRouteCompatibilityFingerprint) {
            __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/counter.ts");
          }
        });
        __typedRouteHot.dispose((data) => {
          data[__typedRouteHmrKey] = __typedRouteCompatibilityFingerprint;
        });
        if (__typedPreviousFingerprint !== undefined && __typedPreviousFingerprint !== __typedRouteCompatibilityFingerprint) {
          __typedRouteHot.invalidate("Typed route HMR compatibility changed for /src/routes/counter.ts");
        }
      }
      class __typed_route_context_0_0 extends __typedRouteContext.Service<__typed_route_context_0_0, unknown>()("/src/routes/counter.ts#render:inline-refsubject-migration:count") {}
      const __typed_route_context_0 = {
        "captures": [
          {
            "name": "count",
            "serviceId": "/src/routes/counter.ts#render:inline-refsubject-migration:count",
            "type": "unknown"
          }
        ],
        "fingerprint": "context:inline-refsubject-migration:count:unknown"
      };
      const __typed_route_descriptor_0 = {
        "_tag": "Continuation",
        "captures": [],
        "captureFingerprint": "captures:inline-refsubject-migration:count:/src/routes/counter.ts#count",
        "closureName": "render",
        "compatibilityFingerprint": "{\\"captureFingerprint\\":\\"captures:inline-refsubject-migration:count:/src/routes/counter.ts#count\\",\\"contextFingerprint\\":\\"context:inline-refsubject-migration:count:unknown\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/counter.ts#closure:render\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "contextFingerprint": "context:inline-refsubject-migration:count:unknown",
        "dependencyFingerprints": [],
        "fingerprint": "{\\"captureFingerprint\\":\\"captures:inline-refsubject-migration:count:/src/routes/counter.ts#count\\",\\"contextFingerprint\\":\\"context:inline-refsubject-migration:count:unknown\\",\\"dependencyFingerprints\\":[],\\"symbolId\\":\\"/src/routes/counter.ts#closure:render\\",\\"templateHashes\\":[],\\"version\\":\\"1\\"}",
        "id": "/src/routes/counter.ts#closure:render",
        "moduleId": "/src/routes/counter.ts",
        "serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-count"
          ]
        },
        "services": [
          {
            "id": "/src/routes/counter.ts#render:inline-refsubject-migration:count",
            "kind": "inline-refsubject-service",
            "name": "count",
            "typeText": "unknown"
          }
        ],
        "symbolId": "/src/routes/counter.ts#closure:render",
        "templateHashes": []
      };
      const __typed_route_continuation_0 = Object.assign(__typedRouteEffect.gen(function* () {
        const count = yield* __typed_route_context_0_0;
        return count;
      }), { descriptor: __typed_route_descriptor_0 });
      __typedRegisterRouteContinuation(__typedGetRouteResumeRegistry(), {
        descriptor: __typed_route_descriptor_0,
        continuation: __typed_route_continuation_0,
        providers: [
          { tag: __typed_route_context_0_0, valueIndex: 0 }
        ]
      });


              export const route = Effect.gen(function* route() {
                const count = yield* __typedGetHmrStateEffect("/src/routes/counter.ts#count", () => RefSubject.make(0));
                const render = () => __typed_route_continuation_0.pipe(__typedRouteEffect.provideService(__typed_route_context_0_0, count));
                return render;
              });
            "
    `);
  });

  it("leaves mutable captures unchanged and returns diagnostics", () => {
    const sourceText = `
      export const route = () => {
        let count = 0;
        const render = () => count;
        return render;
      };
    `;
    const result = transformRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText,
      ts,
    });

    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "unsupported-closure-capture",
        fileName: "/src/routes/counter.ts",
      }),
    ]);
  });

  it("leaves hidden unknown captures unchanged and reports full diagnostics", () => {
    const sourceText = `
      export const route = () => {
        const render = () => missingValue;
        return render;
      };
    `;
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText,
      ts,
    });

    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
    expect(result.diagnostics).toMatchInlineSnapshot(`
      [
        {
          "code": "unsupported-closure-capture",
          "fileName": "/src/routes/profile.ts",
          "message": "Cannot rewrite closure in /src/routes/profile.ts: missingValue is not an imported, top-level, service, serializable, template, or generated context value",
          "severity": "error",
          "source": "compiler",
        },
      ]
    `);
  });

  it("keeps fingerprints stable across whitespace-only edits", () => {
    const left = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string) => a;`,
      ts,
    });
    const right = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export   const route = ( a : string ) => a;`,
      ts,
    });

    expect(left.plan.continuations[0]?.compatibilityFingerprint).toBe(
      right.plan.continuations[0]?.compatibilityFingerprint,
    );
  });

  it("changes fingerprints when the capture list changes", () => {
    const left = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string) => a;`,
      ts,
    });
    const right = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (a: string, b: number) => a + b;`,
      ts,
    });

    expect(left.plan.continuations[0]?.compatibilityFingerprint).not.toBe(
      right.plan.continuations[0]?.compatibilityFingerprint,
    );
  });

  it("emits route descriptor service keys in service order", () => {
    const result = transformRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `export const route = (name: string, age: number) => name + age;`,
      ts,
    });

    const start = result.sourceText.indexOf('"serviceKeys"');
    const end = result.sourceText.indexOf('\n  "services"', start);

    expect(result.sourceText.slice(start, end)).toMatchInlineSnapshot(`
      ""serviceKeys": {
          "fingerprint": "typed-route-resume-fingerprint",
          "id": "typed-route-resume-id",
          "values": [
            "typed-route-resume-value-0-name",
            "typed-route-resume-value-1-age"
          ]
        },"
    `);
  });
});

function generatedDiagnostics(sourceText: string): readonly string[] {
  const fileName = `${process.cwd()}/__typed_generated_route.ts`;
  const appResumabilityFileName = `${process.cwd()}/__typed_app_resumability.d.ts`;
  const appResumabilitySource = [
    "export declare function registerRouteContinuation(registry: unknown, registration: unknown): unknown;",
    "export declare function getDefaultRouteResumeRegistry(): unknown;",
  ].join("\n");
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const appResumabilitySourceFile = ts.createSourceFile(
    appResumabilityFileName,
    appResumabilitySource,
    ts.ScriptTarget.Latest,
    true,
  );
  const host: ts.CompilerHost = {
    ...defaultHost,
    fileExists: (candidate) =>
      candidate === fileName || candidate === appResumabilityFileName || defaultHost.fileExists(candidate),
    getSourceFile: (candidate, languageVersion, onError, shouldCreateNewSourceFile) =>
      candidate === fileName
        ? sourceFile
        : candidate === appResumabilityFileName
          ? appResumabilitySourceFile
        : defaultHost.getSourceFile(
            candidate,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
          ),
    readFile: (candidate) =>
      candidate === fileName
        ? sourceText
        : candidate === appResumabilityFileName
          ? appResumabilitySource
          : defaultHost.readFile(candidate),
    resolveModuleNames: (moduleNames, containingFile) =>
      moduleNames.map((moduleName) =>
        moduleName === "@typed/app/resumability"
          ? {
              extension: ts.Extension.Dts,
              resolvedFileName: appResumabilityFileName,
            }
          : ts.resolveModuleName(moduleName, containingFile, options, defaultHost).resolvedModule,
      ),
  };
  const program = ts.createProgram([fileName], options, host);
  return ts.getPreEmitDiagnostics(program).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  );
}

function routeRegistrationExcerpt(sourceText: string): string {
  const importStart = sourceText.indexOf("import { registerRouteContinuation");
  const registerStart = sourceText.indexOf("\n__typedRegisterRouteContinuation") + 1;
  const registerEnd = sourceText.indexOf("});", registerStart);
  return [
    sourceText.slice(importStart, sourceText.indexOf("\n", importStart)),
    sourceText.slice(registerStart, registerEnd + "});".length),
  ].join("\n");
}
