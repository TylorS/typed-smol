import type { VirtualModuleBuildContext, VirtualModuleBuildError } from "@typed/virtual-modules";
import { describe, expect, it } from "vitest";
import { createEnvVirtualModulePlugin } from "./index.js";

const buildEnv = (
  id: string,
  env: Readonly<Record<string, string | undefined>>,
  context?: VirtualModuleBuildContext,
) => createEnvVirtualModulePlugin({ env }).build(id, "/project/src/entry.ts", {} as never, context);

const namedContext = (names: readonly string[]): VirtualModuleBuildContext => ({
  id: "typed:env",
  rootImporter: "/project/src/entry.ts",
  containingFile: "/project/src/entry.ts",
  consumer: "server",
  requestedExports: {
    kind: "names",
    names: new Set(names),
    typeOnlyNames: new Set<string>(),
  },
  closure: {
    kind: "partial",
    requested: new Set(names),
    pluginDeclared: new Set(),
    typeInfoReachable: new Set(),
    routeOrAppReachable: new Set(),
  },
});

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

  it("emits only requested environment exports", () => {
    expect(buildEnv("typed:env", { FOO: "bar", BAZ: "qux" }, namedContext(["BAZ"]))).toBe(
      'export const BAZ = "qux";',
    );
  });

  it("ignores invalid unrequested environment keys", () => {
    expect(buildEnv("typed:env", { FOO: "bar", "BAD-NAME": "nope" }, namedContext(["FOO"]))).toBe(
      'export const FOO = "bar";',
    );
  });

  it("emits an empty module when no requested environment export exists", () => {
    expect(
      buildEnv("typed:env", { FOO: "bar", "BAD-NAME": "nope" }, namedContext(["MISSING"])),
    ).toBe("export {};");
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
