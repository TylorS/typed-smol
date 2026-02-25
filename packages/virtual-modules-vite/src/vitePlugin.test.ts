import { describe, expect, it } from "vitest";
import { PluginManager } from "@typed/virtual-modules";
import { encodeVirtualId } from "./encodeVirtualId.js";
import { virtualModulesVitePlugin } from "./vitePlugin.js";

type ResolveId = (specifier: string, importer: string | undefined) => string | null;
type Load = (specifier: string) => string | { code: string } | null;

describe("virtualModulesVitePlugin", () => {
  it("returns a plugin with name and enforce pre", () => {
    const manager = new PluginManager();
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    expect(plugin.name).toBe("virtual-modules");
    expect(plugin.enforce).toBe("pre");
  });

  it("resolveId returns null when importer is undefined", () => {
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: () => true,
        build: () => "export {};",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    expect(resolveId("virtual:x", undefined)).toBeNull();
  });

  it("resolveId returns encoded id when resolver resolves", () => {
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: (id) => id === "virtual:config",
        build: () => "export const x = 1;",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    const out = resolveId("virtual:config", "/app/main.ts");
    expect(out).not.toBeNull();
    expect(typeof out).toBe("string");
    expect((out as string).startsWith("\0virtual:")).toBe(true);
  });

  it("load returns sourceText for encoded virtual id", () => {
    const manager = new PluginManager([
      {
        name: "test",
        shouldResolve: (id) => id === "virtual:config",
        build: () => "export const x = 1;",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    const load = plugin.load! as Load;
    const resolvedId = resolveId("virtual:config", "/app/main.ts") as string;
    const result = load(resolvedId);
    const code = typeof result === "string" ? result : result?.code;
    expect(code).toBe("export const x = 1;");
  });

  it("resolveId with encoded virtual id as importer resolves virtual-to-virtual import", () => {
    const manager = new PluginManager([
      {
        name: "virtual-a",
        shouldResolve: (id) => id === "virtual:a",
        build: () => `import { x } from "virtual:b"; export { x };`,
      },
      {
        name: "virtual-b",
        shouldResolve: (id) => id === "virtual:b",
        build: () => "export const x = 1;",
      },
    ]);
    const plugin = virtualModulesVitePlugin({ resolver: manager });
    const resolveId = plugin.resolveId! as ResolveId;
    const load = plugin.load! as Load;
    const rootImporter = "/app/main.ts";
    const encodedA = encodeVirtualId("virtual:a", rootImporter);
    const resolvedB = resolveId("virtual:b", encodedA);
    expect(resolvedB).not.toBeNull();
    const result = load(resolvedB as string);
    const code = typeof result === "string" ? result : result?.code;
    expect(code).toBe("export const x = 1;");
  });
});
