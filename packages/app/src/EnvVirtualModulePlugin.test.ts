import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { describe, expect, it } from "vitest";
import { createEnvVirtualModulePlugin } from "./index.js";

const buildEnv = (id: string, env: Readonly<Record<string, string>>) =>
  createEnvVirtualModulePlugin({ env }).build(id, "/project/src/entry.ts", {} as never);

describe("EnvVirtualModulePlugin", () => {
  it("resolves exactly typed:env", () => {
    const plugin = createEnvVirtualModulePlugin({ env: { FOO: "bar" } });

    expect(plugin.shouldResolve("typed:env", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:env?prefix=PUBLIC_", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:config", "/project/src/entry.ts")).toBe(false);
  });

  it("emits named exports from environment entries", () => {
    expect(buildEnv("typed:env", { FOO: "bar", EMPTY: "" })).toBe(
      'export const FOO = "bar";\nexport const EMPTY = "";',
    );
  });

  it("json stringifies env values", () => {
    expect(buildEnv("typed:env", { QUOTED: 'a"b', NEWLINE: "a\nb" })).toBe(
      'export const QUOTED = "a\\"b";\nexport const NEWLINE = "a\\nb";',
    );
  });

  it("rejects invalid JavaScript export names", () => {
    const result = buildEnv("typed:env", { "BAD-NAME": "nope" }) as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-ENV-001",
        message: 'typed:env cannot export invalid environment key "BAD-NAME"',
        pluginName: "typed-env-virtual-module",
      },
    ]);
  });

  it("rejects reserved word export names", () => {
    const result = buildEnv("typed:env", { default: "nope" }) as VirtualModuleBuildError;

    expect(result.errors[0]).toEqual({
      code: "TVM-ENV-001",
      message: 'typed:env cannot export invalid environment key "default"',
      pluginName: "typed-env-virtual-module",
    });
  });

  it("rejects unsupported query options", () => {
    const result = buildEnv("typed:env?prefix=PUBLIC_", { FOO: "bar" }) as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-ENV-002",
        message: 'typed:env does not support query option "prefix"',
        pluginName: "typed-env-virtual-module",
      },
    ]);
  });
});
