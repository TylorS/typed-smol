import { describe, expect, it, vi } from "vitest";
import { PluginManager } from "./PluginManager.js";
import { createPartialDependencyClosure } from "./types.js";
import type { VirtualModuleBuildContext } from "./types.js";

describe("PluginManager", () => {
  it("uses first matching plugin only", () => {
    const firstBuild = vi.fn(() => "export const value = 1;");
    const secondBuild = vi.fn(() => "export const value = 2;");

    const manager = new PluginManager([
      {
        name: "first",
        shouldResolve: () => true,
        build: firstBuild,
      },
      {
        name: "second",
        shouldResolve: () => true,
        build: secondBuild,
      },
    ]);

    const resolved = manager.resolveModule({
      id: "virtual:test",
      importer: "/project/src/main.ts",
    });

    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;
    expect(resolved.pluginName).toBe("first");
    expect(firstBuild).toHaveBeenCalledTimes(1);
    expect(secondBuild).toHaveBeenCalledTimes(0);
  });

  it("returns unresolved when no plugin matches", () => {
    const manager = new PluginManager([
      {
        name: "noop",
        shouldResolve: () => false,
        build: () => "export {};",
      },
    ]);

    expect(
      manager.resolveModule({
        id: "virtual:none",
        importer: "/project/src/main.ts",
      }),
    ).toEqual({ status: "unresolved" });
  });

  it("returns structured error when shouldResolve throws", () => {
    const manager = new PluginManager([
      {
        name: "broken",
        shouldResolve: () => {
          throw new Error("explode");
        },
        build: () => "export {};",
      },
    ]);

    const resolved = manager.resolveModule({
      id: "virtual:bad",
      importer: "/project/src/main.ts",
    });

    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("plugin-should-resolve-threw");
    expect(resolved.diagnostic.message).toMatchInlineSnapshot(`"Plugin "broken" shouldResolve failed: explode"`);
  });

  it("returns invalid-options for empty id", () => {
    const manager = new PluginManager([
      { name: "any", shouldResolve: () => true, build: () => "export {};" },
    ]);
    const resolved = manager.resolveModule({
      id: "",
      importer: "/project/src/main.ts",
    });
    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("invalid-options");
    expect(resolved.diagnostic.message).toMatchInlineSnapshot(`"options.id must be non-empty"`);
  });

  it("returns invalid-options for empty importer", () => {
    const manager = new PluginManager([
      { name: "any", shouldResolve: () => true, build: () => "export {};" },
    ]);
    const resolved = manager.resolveModule({
      id: "virtual:x",
      importer: "",
    });
    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("invalid-options");
    expect(resolved.diagnostic.message).toMatchInlineSnapshot(`"options.importer must be non-empty"`);
  });

  it("returns invalid-options when a plugin has empty name", () => {
    const manager = new PluginManager([
      { name: "", shouldResolve: () => true, build: () => "export {};" },
    ]);
    const resolved = manager.resolveModule({
      id: "virtual:x",
      importer: "/project/src/main.ts",
    });
    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("invalid-options");
    expect(resolved.diagnostic.message).toMatchInlineSnapshot(`"Plugin name must be non-empty"`);
  });

  it("returns plugin-build-threw when plugin build() throws", () => {
    const manager = new PluginManager([
      {
        name: "throws",
        shouldResolve: () => true,
        build: () => {
          throw new Error("build exploded");
        },
      },
    ]);
    const resolved = manager.resolveModule({
      id: "virtual:x",
      importer: "/project/src/main.ts",
    });
    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("plugin-build-threw");
    expect(resolved.diagnostic.message).toMatchInlineSnapshot(`"Plugin "throws" build failed: build exploded"`);
  });

  it("returns invalid-build-output when plugin returns non-string", () => {
    const manager = new PluginManager([
      {
        name: "bad-return",
        shouldResolve: () => true,
        build: () => null as unknown as string,
      },
    ]);
    const resolved = manager.resolveModule({
      id: "virtual:x",
      importer: "/project/src/main.ts",
    });
    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("invalid-build-output");
  });

  it("returns unresolved when plugin list is empty", () => {
    const manager = new PluginManager([]);
    const resolved = manager.resolveModule({
      id: "virtual:any",
      importer: "/project/src/main.ts",
    });
    expect(resolved.status).toBe("unresolved");
  });

  it("returns session-creation-failed when createTypeInfoApiSession throws", () => {
    const manager = new PluginManager([
      { name: "needs-session", shouldResolve: () => true, build: () => "export {};" },
    ]);
    const resolved = manager.resolveModule({
      id: "virtual:x",
      importer: "/project/src/main.ts",
      createTypeInfoApiSession: () => {
        throw new Error("session factory error");
      },
    });
    expect(resolved.status).toBe("error");
    if (resolved.status !== "error") return;
    expect(resolved.diagnostic.code).toBe("session-creation-failed");
    expect(resolved.diagnostic.message).toMatchInlineSnapshot(`"Session creation failed: session factory error"`);
  });

  it("passes build context to the matching plugin", () => {
    let received: VirtualModuleBuildContext | undefined;
    const requestedExports = {
      kind: "names" as const,
      names: new Set(["Client"]),
      typeOnlyNames: new Set<string>(),
    };
    const context: VirtualModuleBuildContext = {
      id: "virtual:x",
      rootImporter: "/project/src/main.ts",
      containingFile: "/project/src/main.ts",
      consumer: "client",
      requestedExports,
      closure: createPartialDependencyClosure({
        requestedExports,
        pluginDeclared: ["makeClient"],
        typeInfoReachable: ["Api"],
        routeOrAppReachable: ["Routes"],
      }),
    };
    const manager = new PluginManager([
      {
        name: "contextual",
        shouldResolve: () => true,
        build: (_id, _importer, _api, buildContext) => {
          received = buildContext;
          return "export const Client = 1;";
        },
      },
    ]);

    const resolved = manager.resolveModule({
      id: "virtual:x",
      importer: "/project/src/main.ts",
      context,
    });

    expect(resolved.status).toBe("resolved");
    expect(received).toBe(context);
    expect(received?.closure).toEqual({
      kind: "partial",
      requested: new Set(["Client"]),
      pluginDeclared: new Set(["makeClient"]),
      typeInfoReachable: new Set(["Api"]),
      routeOrAppReachable: new Set(["Routes"]),
    });
  });
});
