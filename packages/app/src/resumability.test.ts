import { describe, expect, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Schema from "effect/Schema";
import * as EventHandler from "@typed/template/EventHandler";
import { Window } from "happy-dom";
import { Serializable } from "./serialization/Serializable.js";
import {
  bootActionResume,
  bootRouteResume,
  provideRouteResumeServices,
  readRouteResumePayload,
  writeRouteResumePayload,
} from "../../template/src/compiler-runtime/dom.js";
import {
  decodeRouteResumePayload,
  encodeRouteResumePayload,
  createRouteResumeRegistry,
  createRouteResumeRuntime,
  createActionResumeRegistry,
  createActionResumeRuntime,
  registerActionHandler,
  registerRouteContinuation,
  resumeRouteFromPayload,
  routeResumeDataAttrKeys,
  routeResumeServiceDataAttrKey,
  type RouteContinuationDescriptor,
} from "./resumability.js";

const descriptor = {
  _tag: "Continuation",
  id: "/src/routes/profile.ts#closure:route",
  fingerprint: "continuation:profile",
  compatibilityFingerprint: "route:v1:profile",
  moduleId: "/src/routes/profile.ts",
  symbolId: "/src/routes/profile.ts#closure:route",
  captures: [],
  services: [
    {
      id: "@app/ProfileClient",
      name: "ProfileClient",
      kind: "effect-service",
      typeText: "Context.Tag<ProfileClient>",
      descriptor: Serializable.generated("ProfileClient", {
        version: 1,
        typeId: "ProfileClient",
        fingerprint: "schema:profile-client",
      }),
    },
    {
      id: "route.params.name",
      name: "name",
      kind: "serializable-value",
      typeText: "string",
    },
  ],
} as const satisfies RouteContinuationDescriptor;

describe("typed/app/resumability", () => {
  it("encodes route resume payloads as data-attribute-compatible objects", () => {
    expect(encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"])).toMatchInlineSnapshot(`
        {
          "typed-route-resume-fingerprint": "route:v1:profile",
          "typed-route-resume-id": "/src/routes/profile.ts#closure:route",
          "typed-route-resume-value-0-profile-client": "{"clientId":1}",
          "typed-route-resume-value-1-name": ""tylor"",
        }
      `);
  });

  it("maps descriptor services to route resume data-attribute object keys", () => {
    expect(routeResumeDataAttrKeys(descriptor)).toMatchInlineSnapshot(`
      {
        "fingerprint": "typed-route-resume-fingerprint",
        "id": "typed-route-resume-id",
        "values": [
          "typed-route-resume-value-0-profile-client",
          "typed-route-resume-value-1-name",
        ],
      }
    `);
  });

  it("normalizes service names into stable data-attribute object key fragments", () => {
    expect(
      routeResumeServiceDataAttrKey(
        {
          id: "@app/routes/profile/Profile API",
          name: "Profile API",
          kind: "context-service",
          typeText: "Context.Tag<ProfileApi>",
        },
        7,
      ),
    ).toMatchInlineSnapshot(`"typed-route-resume-value-7-profile-api"`);
  });

  it("decodes ordered route resume values when descriptor identity matches", () =>
    Effect.gen(function* () {
      const payload = encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"]);
      const values = yield* decodeRouteResumePayload(descriptor, payload);

      expect(values).toMatchInlineSnapshot(`
        [
          {
            "clientId": 1,
          },
          "tylor",
        ]
      `);
    }).pipe(Effect.runPromise));

  it("fails when the descriptor id does not match", () =>
    Effect.gen(function* () {
      const payload = encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"]);
      const exit = yield* decodeRouteResumePayload(
        { ...descriptor, id: "/src/routes/other.ts#closure:route" },
        payload,
      ).pipe(Effect.exit);

      expect(exitMessage(exit)).toMatchInlineSnapshot(
        `"Error: Invalid route resume payload: descriptor-id-mismatch"`,
      );
    }).pipe(Effect.runPromise));

  it("fails when the compatibility fingerprint does not match", () =>
    Effect.gen(function* () {
      const payload = encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"]);
      const exit = yield* decodeRouteResumePayload(
        { ...descriptor, compatibilityFingerprint: "route:v2:profile" },
        payload,
      ).pipe(Effect.exit);

      expect(exitMessage(exit)).toMatchInlineSnapshot(
        `"Error: Invalid route resume payload: compatibility-fingerprint-mismatch"`,
      );
    }).pipe(Effect.runPromise));

  it("fails when ordered values are not an array matching service order", () =>
    Effect.gen(function* () {
      const exit = yield* decodeRouteResumePayload(descriptor, {
        "typed-route-resume-id": descriptor.id,
        "typed-route-resume-fingerprint": descriptor.compatibilityFingerprint,
        "typed-route-resume-value-0-profile-client": "1",
      }).pipe(Effect.exit);

      expect(exitMessage(exit)).toMatchInlineSnapshot(
        `"Error: Invalid route resume payload: ordered-values-length-mismatch"`,
      );
    }).pipe(Effect.runPromise));

  it("fails when the payload has extra service values", () =>
    Effect.gen(function* () {
      const exit = yield* decodeRouteResumePayload(descriptor, {
        ...encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"]),
        "typed-route-resume-value-2-extra": "true",
      }).pipe(Effect.exit);

      expect(exitMessage(exit)).toMatchInlineSnapshot(
        `"Error: Invalid route resume payload: ordered-values-length-mismatch"`,
      );
    }).pipe(Effect.runPromise));

  it("round-trips route resume payloads through DOM DataAttr into Context.Service values", () =>
    Effect.gen(function* () {
      class RouteName extends Context.Service<RouteName, string>()("typed:test:route-name") {}
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const element = window.document.createElement("section");
      const payload = encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"]);

      writeRouteResumePayload(element, payload);
      const values = yield* decodeRouteResumePayload(descriptor, readRouteResumePayload(element));
      const greeting = yield* provideRouteResumeServices(
        Effect.map(RouteName, (name) => `hello ${name}`),
        values,
        [{ tag: RouteName, valueIndex: 1 }],
      );

      expect(element.outerHTML).toMatchInlineSnapshot(
        `"<section data-typed-route-resume-id="/src/routes/profile.ts#closure:route" data-typed-route-resume-fingerprint="route:v1:profile" data-typed-route-resume-value-0-profile-client="{&quot;clientId&quot;:1}" data-typed-route-resume-value-1-name="&quot;tylor&quot;"></section>"`,
      );
      expect(greeting).toMatchInlineSnapshot(`"hello tylor"`);
    }).pipe(Effect.runPromise));

  it("decodes service values through user Schema descriptors before returning resume values", () =>
    Effect.gen(function* () {
      const Profile = Schema.Struct({ clientId: Schema.Number });
      const schemaDescriptor = {
        ...descriptor,
        services: [
          {
            id: "@app/ProfileClient",
            name: "ProfileClient",
            kind: "context-service",
            typeText: "ProfileClient",
            descriptor: Serializable.schema(Profile, { id: "ProfileClient" }),
          },
        ],
      } satisfies RouteContinuationDescriptor;

      const values = yield* decodeRouteResumePayload(
        schemaDescriptor,
        encodeRouteResumePayload(schemaDescriptor, [{ clientId: 7 }]),
      );
      const exit = yield* decodeRouteResumePayload(
        schemaDescriptor,
        encodeRouteResumePayload(schemaDescriptor, [{ clientId: "7" }]),
      ).pipe(Effect.exit);

      expect(values).toMatchInlineSnapshot(`
        [
          {
            "clientId": 7,
          },
        ]
      `);
      expect(exitMessage(exit)).toMatchInlineSnapshot(
        `"Error: Invalid route resume payload: service-value-schema-decode-failed:ProfileClient"`,
      );
    }).pipe(Effect.runPromise));

  it("decodes service values through generated primitive schema plans when no user Schema exists", () =>
    Effect.gen(function* () {
      const generatedDescriptor = {
        ...descriptor,
        services: [
          {
            id: "route.params.name",
            name: "name",
            kind: "parameter",
            typeText: "string",
            descriptor: Serializable.generated("RouteName", {
              version: 1,
              typeId: "RouteName",
              root: { kind: "primitive", name: "string" },
              fingerprint: "schema:route-name",
            }),
          },
        ],
      } satisfies RouteContinuationDescriptor;

      const values = yield* decodeRouteResumePayload(
        generatedDescriptor,
        encodeRouteResumePayload(generatedDescriptor, ["Ada"]),
      );
      const exit = yield* decodeRouteResumePayload(
        generatedDescriptor,
        encodeRouteResumePayload(generatedDescriptor, [7]),
      ).pipe(Effect.exit);

      expect(values).toMatchInlineSnapshot(`
        [
          "Ada",
        ]
      `);
      expect(exitMessage(exit)).toMatchInlineSnapshot(
        `"Error: Invalid route resume payload: service-value-schema-decode-failed:name"`,
      );
    }).pipe(Effect.runPromise));

  it("registers and resumes route continuations by descriptor id and fingerprint", () =>
    Effect.gen(function* () {
      class RouteName extends Context.Service<RouteName, string>()("typed:test:route-name") {}
      const registry = createRouteResumeRegistry();

      registerRouteContinuation(registry, {
        descriptor,
        continuation: Effect.map(RouteName, (name) => `hello ${name}`),
        providers: [{ tag: RouteName, valueIndex: 1 }],
      });

      const result = yield* resumeRouteFromPayload(
        registry,
        encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"]),
      );
      const missing = yield* resumeRouteFromPayload(registry, {
        ...encodeRouteResumePayload(descriptor, [{ clientId: 1 }, "tylor"]),
        "typed-route-resume-id": "/src/routes/missing.ts#closure:route",
      }).pipe(Effect.exit);

      expect(result).toMatchInlineSnapshot(`"hello tylor"`);
      expect(exitMessage(missing)).toMatchInlineSnapshot(
        `"Error: Invalid route resume payload: continuation-not-registered:/src/routes/missing.ts#closure:route"`,
      );
    }).pipe(Effect.runPromise));

  it("creates a DOM runtime bridge for bootRouteResume", async () => {
    class RouteName extends Context.Service<RouteName, string>()("typed:test:route-name") {}
    const registry = createRouteResumeRegistry();
    const window = new Window();
    const root = window.document.createElement("main");

    registerRouteContinuation(registry, {
      descriptor,
      continuation: Effect.flatMap(RouteName, (name) =>
        Effect.sync(() => root.setAttribute("data-result", `hello ${name}`)),
      ),
      providers: [{ tag: RouteName, valueIndex: 1 }],
    });
    root.innerHTML = [
      '<button data-typed-resume="load"',
      ` data-typed-route-resume-id="${descriptor.id}"`,
      ` data-typed-route-resume-fingerprint="${descriptor.compatibilityFingerprint}"`,
      ' data-typed-route-resume-value-0-profile-client="{&quot;clientId&quot;:1}"',
      ' data-typed-route-resume-value-1-name="&quot;Ada&quot;"></button>',
    ].join("");

    await Effect.runPromise(bootRouteResume(root, createRouteResumeRuntime(registry)));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.outerHTML).toMatchInlineSnapshot(
      `"<main data-result="hello Ada"><button data-typed-resume="load" data-typed-route-resume-id="/src/routes/profile.ts#closure:route" data-typed-route-resume-fingerprint="route:v1:profile" data-typed-route-resume-value-0-profile-client="{&quot;clientId&quot;:1}" data-typed-route-resume-value-1-name="&quot;Ada&quot;"></button></main>"`,
    );
  });

  it("boots serializable event actions from DOM descriptors without original closures", async () => {
    const registry = createActionResumeRegistry();
    const window = new Window();
    const root = window.document.createElement("main");
    let clicks = 0;

    registerActionHandler(registry, {
      descriptor: {
        component: "cmp:/src/Button.ts#Button",
        event: "click",
        id: "cmp:/src/Button.ts#Button:action:toggle",
      },
      handler: EventHandler.action("toggle", "click", () =>
        Effect.sync(() => {
          clicks += 1;
          root.setAttribute("data-clicks", String(clicks));
        }),
      ),
    });
    root.innerHTML = [
      '<button data-typed-action-click-id="cmp:/src/Button.ts#Button:action:toggle"',
      ' data-typed-action-click-event="click"',
      ' data-typed-action-click-component="cmp:/src/Button.ts#Button">Toggle</button>',
    ].join("");

    await Effect.runPromise(bootActionResume(root, createActionResumeRuntime(registry)));
    root.querySelector("button")?.dispatchEvent(new window.Event("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(clicks).toMatchInlineSnapshot(`1`);
    expect(root.outerHTML).toMatchInlineSnapshot(
      `"<main data-clicks="1"><button data-typed-action-click-id="cmp:/src/Button.ts#Button:action:toggle" data-typed-action-click-event="click" data-typed-action-click-component="cmp:/src/Button.ts#Button">Toggle</button></main>"`,
    );
  });

  it("resumes route services and dispatches actions from the same server-rendered DOM", async () => {
    class RouteName extends Context.Service<RouteName, string>()("typed:test:e2e-route-name") {}
    const routes = createRouteResumeRegistry();
    const actions = createActionResumeRegistry();
    const window = new Window();
    const root = window.document.createElement("main");

    registerRouteContinuation(routes, {
      descriptor,
      continuation: Effect.flatMap(RouteName, (name) =>
        Effect.sync(() => root.setAttribute("data-route", `hello ${name}`)),
      ),
      providers: [{ tag: RouteName, valueIndex: 1 }],
    });
    registerActionHandler(actions, {
      descriptor: {
        component: "cmp:/src/ProfileButton.ts#ProfileButton",
        event: "click",
        id: "cmp:/src/ProfileButton.ts#ProfileButton:action:refresh",
      },
      handler: EventHandler.action("refresh", "click", () =>
        Effect.sync(() => root.setAttribute("data-action", "refresh")),
      ),
    });
    root.innerHTML = [
      '<section data-typed-resume="load"',
      ` data-typed-route-resume-id="${descriptor.id}"`,
      ` data-typed-route-resume-fingerprint="${descriptor.compatibilityFingerprint}"`,
      ' data-typed-route-resume-value-0-profile-client="{&quot;clientId&quot;:1}"',
      ' data-typed-route-resume-value-1-name="&quot;Ada&quot;">',
      '<button data-typed-action-click-id="cmp:/src/ProfileButton.ts#ProfileButton:action:refresh"',
      ' data-typed-action-click-event="click"',
      ' data-typed-action-click-component="cmp:/src/ProfileButton.ts#ProfileButton">Refresh</button>',
      "</section>",
    ].join("");

    await Effect.runPromise(bootRouteResume(root, createRouteResumeRuntime(routes)));
    await Effect.runPromise(bootActionResume(root, createActionResumeRuntime(actions)));
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.querySelector("button")?.dispatchEvent(new window.Event("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.outerHTML).toMatchInlineSnapshot(
      `"<main data-route="hello Ada" data-action="refresh"><section data-typed-resume="load" data-typed-route-resume-id="/src/routes/profile.ts#closure:route" data-typed-route-resume-fingerprint="route:v1:profile" data-typed-route-resume-value-0-profile-client="{&quot;clientId&quot;:1}" data-typed-route-resume-value-1-name="&quot;Ada&quot;"><button data-typed-action-click-id="cmp:/src/ProfileButton.ts#ProfileButton:action:refresh" data-typed-action-click-event="click" data-typed-action-click-component="cmp:/src/ProfileButton.ts#ProfileButton">Refresh</button></section></main>"`,
    );
  });
});

function exitMessage(exit: Exit.Exit<unknown, unknown>): string {
  return Exit.match(exit, {
    onFailure: (cause) => String(Cause.squash(cause)),
    onSuccess: (value) => `success:${String(value)}`,
  });
}
