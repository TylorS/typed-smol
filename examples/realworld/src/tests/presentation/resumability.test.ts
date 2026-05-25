import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createBrowserVirtualModulePlugin } from "@typed/app/BrowserVirtualModulePlugin";
import {
  createActionResumeRegistry,
  createActionResumeRuntime,
  createRouteResumeRegistry,
  createRouteResumeRuntime,
  registerActionHandler,
  registerRouteContinuation,
  type RouteContinuationDescriptor,
} from "@typed/app/resumability";
import { Serializable } from "@typed/app/serialization/Serializable";
import * as EventHandler from "@typed/template/EventHandler";
import { bootActionResume, bootRouteResume } from "@typed/template/compiler-runtime/dom";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(testDir, "../..");

const descriptor = {
  _tag: "Continuation",
  captures: [],
  compatibilityFingerprint: "route:v1:realworld-profile",
  fingerprint: "continuation:realworld-profile",
  id: "/src/routes/profile.ts#closure:route",
  moduleId: "/src/routes/profile.ts",
  services: [
    {
      descriptor: Serializable.generated("ProfileClient", {
        fingerprint: "schema:profile-client",
        typeId: "ProfileClient",
        version: 1,
      }),
      id: "@realworld/ProfileClient",
      kind: "effect-service",
      name: "ProfileClient",
      typeText: "Context.Tag<ProfileClient>",
    },
    {
      id: "route.params.username",
      kind: "serializable-value",
      name: "username",
      typeText: "string",
    },
  ],
  symbolId: "/src/routes/profile.ts#closure:route",
} as const satisfies RouteContinuationDescriptor;

describe("realworld generated runtime resumability", () => {
  it("boots route and action metadata from server-rendered DOM", async () => {
    class Username extends Context.Service<Username, string>()("realworld:test:username") {}
    const routes = createRouteResumeRegistry();
    const actions = createActionResumeRegistry();
    const window = new Window();
    const root = window.document.createElement("main");

    registerRouteContinuation(routes, {
      descriptor,
      continuation: Effect.flatMap(Username, (username) =>
        Effect.sync(() => root.setAttribute("data-route", username)),
      ),
      providers: [{ tag: Username, valueIndex: 1 }],
    });
    registerActionHandler(actions, {
      descriptor: {
        component: "cmp:/src/ProfileActions.ts#ProfileActions",
        event: "click",
        id: "cmp:/src/ProfileActions.ts#ProfileActions:action:refresh",
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
      ' data-typed-route-resume-value-1-username="&quot;seed_author&quot;">',
      '<button data-typed-action-click-id="cmp:/src/ProfileActions.ts#ProfileActions:action:refresh"',
      ' data-typed-action-click-event="click"',
      ' data-typed-action-click-component="cmp:/src/ProfileActions.ts#ProfileActions">Refresh</button>',
      "</section>",
    ].join("");

    await Effect.runPromise(bootRouteResume(root, createRouteResumeRuntime(routes)));
    await Effect.runPromise(bootActionResume(root, createActionResumeRuntime(actions)));
    root.querySelector("button")?.dispatchEvent(new window.Event("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const serverHtml = root.outerHTML;
    expect(serverHtml).toContain("data-typed-resume");
    expect(serverHtml).toContain("data-typed-route-resume-id");
    expect(serverHtml).toContain("data-typed-action-");
    expect(serverHtml).toContain('data-route="seed_author"');
    expect(serverHtml).toContain('data-action="refresh"');
  });

  it("generates the browser runtime handoff for RealWorld routes", () => {
    const browserSource = readSource("browser.ts");
    const moduleId = extractTypedModuleId(browserSource);
    const generatedBrowserSource = generatedSource(
      createBrowserVirtualModulePlugin().build(
        moduleId,
        resolve(srcRoot, "browser.ts"),
        {} as never,
      ),
    );

    expect(generatedBrowserSource).toContain("createAppDomTemplateRuntime");
    expect(generatedBrowserSource).not.toContain("installTypedDevtoolsBridge");
    expect(generatedBrowserSource).toContain("runtime: domRuntime");
  });
});

function readSource(path: string): string {
  return readFileSync(resolve(srcRoot, path), "utf8");
}

function extractTypedModuleId(source: string): string {
  const match = source.match(/["'](typed:browser\?[^"']+)["']/);
  if (!match) throw new Error("missing typed:browser import");
  return match[1];
}

function generatedSource(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "sourceText" in result) {
    const sourceText = result.sourceText;
    if (typeof sourceText === "string") return sourceText;
  }
  throw new Error(JSON.stringify(result));
}
