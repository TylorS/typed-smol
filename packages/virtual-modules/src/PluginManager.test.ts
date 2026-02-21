import { describe, expect, it, vi } from "vitest";
import { PluginManager } from "./PluginManager.js";

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
    expect(resolved.diagnostic.message).toContain("explode");
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
    expect(resolved.diagnostic.message).toContain("id");
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
    expect(resolved.diagnostic.message).toContain("importer");
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
    expect(resolved.diagnostic.message).toContain("Plugin name");
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
    expect(resolved.diagnostic.message).toContain("build exploded");
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
    expect(resolved.diagnostic.message).toContain("Session creation failed");
    expect(resolved.diagnostic.message).toContain("session factory error");
  });
});
