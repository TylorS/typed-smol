import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConfigVirtualModulePlugin } from "./index.js";

const buildConfig = (id: string, config: Readonly<Record<string, unknown>>) =>
  createConfigVirtualModulePlugin({ config }).build(id, "/project/src/entry.ts", {} as never);

describe("ConfigVirtualModulePlugin", () => {
  it("resolves exactly typed:config", () => {
    const plugin = createConfigVirtualModulePlugin({ config: { entry: "server.ts" } });

    expect(plugin.shouldResolve("typed:config", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:config?raw=true", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:env", "/project/src/entry.ts")).toBe(false);
  });

  it("emits named exports from computed config entries", () => {
    expect(buildConfig("typed:config", { entry: "server.ts", server: { port: 3000 } })).toBe(
      'export const entry = "server.ts";\nexport const server = {"port":3000};',
    );
  });

  it("does not emit a default export", () => {
    const source = buildConfig("typed:config", { entry: "server.ts" });

    expect(source).toBe('export const entry = "server.ts";');
    expect(source).not.toContain("export default");
  });

  it("emits a module marker for empty computed config", () => {
    expect(buildConfig("typed:config", {})).toBe("export {};");
  });

  it("loads the typed config nearest to the importer when no config is provided", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "typed-config-vm-"));
    const cwd = process.cwd();
    try {
      const appRoot = join(fixtureRoot, "app");
      const srcRoot = join(appRoot, "node_modules", ".typed", "virtual");
      mkdirSync(srcRoot, { recursive: true });
      writeFileSync(join(fixtureRoot, "typed.config.ts"), `export default { entry: "wrong.ts" };`);
      writeFileSync(
        join(appRoot, "typed.config.ts"),
        `export default { entry: "src/server.ts", build: { outDir: "dist" } };`,
      );
      writeFileSync(join(srcRoot, "importer.ts"), `import "typed:config";`, { flag: "wx" });
      process.chdir(fixtureRoot);

      const source = createConfigVirtualModulePlugin().build(
        "typed:config",
        join(srcRoot, "importer.ts"),
        {} as never,
      );

      expect(source).toContain('export const entry = "src/server.ts";');
      expect(source).toContain('export const build = {"outDir":"dist"};');
      expect(source).not.toContain("wrong.ts");
    } finally {
      process.chdir(cwd);
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("rejects invalid JavaScript export names", () => {
    const result = buildConfig("typed:config", { "bad-name": true }) as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-CONFIG-004",
        message: 'typed:config cannot export invalid config key "bad-name"',
        pluginName: "typed-config-virtual-module",
      },
    ]);
  });

  it("rejects reserved word export names", () => {
    const result = buildConfig("typed:config", { default: true }) as VirtualModuleBuildError;

    expect(result.errors[0]).toEqual({
      code: "TVM-CONFIG-004",
      message: 'typed:config cannot export invalid config key "default"',
      pluginName: "typed-config-virtual-module",
    });
  });

  it("rejects non-serializable config values", () => {
    const result = buildConfig("typed:config", { entry: () => "server.ts" }) as VirtualModuleBuildError;

    expect(result.errors[0]).toEqual({
      code: "TVM-CONFIG-002",
      message: 'typed:config cannot serialize config key "entry"',
      pluginName: "typed-config-virtual-module",
    });
  });

  it("returns config load failures as diagnostics", () => {
    const plugin = createConfigVirtualModulePlugin({
      loadConfig: () => ({ status: "error", message: "broken config" }),
    });
    const result = plugin.build("typed:config", "/project/src/entry.ts", {} as never);

    expect((result as VirtualModuleBuildError).errors).toEqual([
      {
        code: "TVM-CONFIG-001",
        message: "broken config",
        pluginName: "typed-config-virtual-module",
      },
    ]);
  });

  it("rejects unsupported query options", () => {
    const result = buildConfig("typed:config?raw=true", { entry: "server.ts" }) as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-CONFIG-003",
        message: 'typed:config does not support query option "raw"',
        pluginName: "typed-config-virtual-module",
      },
    ]);
  });
});
