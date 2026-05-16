import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ts from "typescript";
import {
  createGeneratedSourceHash,
  createParsedTsconfigFingerprint,
  createPluginConfigFingerprint,
  createPluginModuleFingerprint,
  createPluginPackageFingerprint,
  createSourceInputFingerprint,
  createTypeScriptFingerprint,
  getNonReusableFingerprintReasons,
  hashVirtualArtifactJson,
} from "../index.js";

describe("ArtifactFingerprint", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "typed-vm-fingerprint-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("hashes source file contents with sha256 instead of path or timestamp identity", () => {
    const sourcePath = join(dir, "src", "route.ts");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(sourcePath, "export const route = '/a';\n", "utf8");

    const first = createSourceInputFingerprint(sourcePath);
    writeFileSync(sourcePath, "export const route = '/b';\n", "utf8");
    const second = createSourceInputFingerprint(sourcePath);

    expect(first).toEqual({
      kind: "file",
      name: sourcePath,
      hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(second.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.hash).not.toBe(first.hash);
  });

  it("hashes plugin module file contents and records unavailable modules as non-reusable", () => {
    const modulePath = join(dir, "plugin.mjs");
    writeFileSync(modulePath, "export default { name: 'routes' };\n", "utf8");

    const first = createPluginModuleFingerprint("routes", modulePath);
    writeFileSync(modulePath, "export default { name: 'routes-v2' };\n", "utf8");
    const second = createPluginModuleFingerprint("routes", modulePath);

    expect(first).toEqual({
      kind: "module",
      name: "routes",
      hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(second.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.hash).not.toBe(first.hash);

    const missing = createPluginModuleFingerprint("routes", join(dir, "missing.mjs"));

    expect(missing).toEqual({
      kind: "module",
      name: "routes",
      unavailableReason: expect.stringContaining("Unable to read plugin module"),
    });
    expect(getNonReusableFingerprintReasons([missing])).toEqual([missing.unavailableReason]);
  });

  it("hashes plugin config with stable normalized JSON independent of key order", () => {
    const left = createPluginConfigFingerprint("routes", {
      include: ["src/**/*.ts"],
      options: { strict: true, root: "src" },
    });
    const right = createPluginConfigFingerprint("routes", {
      options: { root: "src", strict: true },
      include: ["src/**/*.ts"],
    });

    expect(left).toEqual({
      kind: "config",
      name: "routes",
      hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(right.hash).toBe(left.hash);
    expect(createPluginConfigFingerprint("routes", { include: ["src/**/*.tsx"] }).hash).not.toBe(
      left.hash,
    );
    expect(hashVirtualArtifactJson({ b: 1, a: 2 })).toBe(hashVirtualArtifactJson({ a: 2, b: 1 }));
  });

  it("fails closed for unsupported plugin config and tsconfig fingerprint inputs", () => {
    const cyclicConfig: Record<string, unknown> = {};
    cyclicConfig.self = cyclicConfig;
    const symbolConfig = { visible: true, [Symbol("hidden")]: "changes-runtime" };
    const accessorConfig = {
      get value() {
        return Math.random();
      },
    };
    const arrayWithSideProperty = ["src/**/*.ts"] as string[] & { extra?: string };
    arrayWithSideProperty.extra = "runtime-visible";
    const nonEnumerableTsconfig = { options: { strict: true } };
    Object.defineProperty(nonEnumerableTsconfig, "hidden", {
      enumerable: false,
      value: "runtime-visible",
    });

    const badConfig = createPluginConfigFingerprint("routes", cyclicConfig);
    const badTsconfig = createParsedTsconfigFingerprint({ options: new Map([["strict", true]]) });
    const symbolFingerprint = createPluginConfigFingerprint("routes", symbolConfig);
    const accessorFingerprint = createPluginConfigFingerprint("routes", accessorConfig);
    const arraySideFingerprint = createPluginConfigFingerprint("routes", arrayWithSideProperty);
    const nonEnumerableFingerprint = createParsedTsconfigFingerprint(nonEnumerableTsconfig);

    expect(badConfig).toEqual({
      kind: "config",
      name: "routes",
      unavailableReason: expect.stringContaining("Unable to hash plugin config"),
    });
    expect(badTsconfig).toEqual({
      kind: "tsconfig",
      name: "parsed-tsconfig",
      unavailableReason: expect.stringContaining("Unable to hash parsed tsconfig"),
    });
    expect(symbolFingerprint.unavailableReason).toContain("Unsupported symbol property key");
    expect(accessorFingerprint.unavailableReason).toContain("Unsupported accessor property");
    expect(arraySideFingerprint.unavailableReason).toContain("Unsupported array property");
    expect(nonEnumerableFingerprint.unavailableReason).toContain("Unsupported non-enumerable");
    expect(getNonReusableFingerprintReasons([badConfig, badTsconfig])).toEqual([
      badConfig.unavailableReason,
      badTsconfig.unavailableReason,
    ]);
    expect(() => hashVirtualArtifactJson(new Date("2026-05-15T20:25:00.000Z"))).toThrow(
      /plain object/,
    );
  });

  it("does not collide undefined values with user marker-shaped objects", () => {
    expect(hashVirtualArtifactJson({ a: undefined })).not.toBe(
      hashVirtualArtifactJson({ a: { $typedVirtualUndefined: true } }),
    );
    expect(hashVirtualArtifactJson(-0)).not.toBe(hashVirtualArtifactJson(0));
  });

  it("records plugin package metadata separately from the module content hash", () => {
    const first = createPluginPackageFingerprint("@typed/routes", "1.2.3");
    const second = createPluginPackageFingerprint("@typed/routes", "1.2.4");
    const renamed = createPluginPackageFingerprint("@typed/routes-next", "1.2.3");

    expect(first).toEqual({
      kind: "package",
      name: "@typed/routes",
      packageName: "@typed/routes",
      packageVersion: "1.2.3",
      hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(second.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.hash).not.toBe(first.hash);
    expect(renamed.hash).not.toBe(first.hash);

    expect(createPluginPackageFingerprint("@typed/routes")).toEqual({
      kind: "package",
      name: "@typed/routes",
      packageName: "@typed/routes",
      unavailableReason: "Plugin package version is unavailable",
    });
  });

  it("hashes TypeScript version and full parsed tsconfig deterministically", () => {
    const compiler = createTypeScriptFingerprint(ts.version);
    const nextCompiler = createTypeScriptFingerprint("999.0.0");
    const parsedConfigA = createParsedTsconfigFingerprint({
      options: {
        module: ts.ModuleKind.NodeNext,
        strict: true,
      },
      fileNames: [join(dir, "src", "a.ts")],
      projectReferences: undefined,
    });
    const parsedConfigB = createParsedTsconfigFingerprint({
      fileNames: [join(dir, "src", "a.ts")],
      projectReferences: undefined,
      options: {
        strict: true,
        module: ts.ModuleKind.NodeNext,
      },
    });
    const parsedConfigC = createParsedTsconfigFingerprint({
      fileNames: [join(dir, "src", "a.ts")],
      options: {
        strict: false,
        module: ts.ModuleKind.NodeNext,
      },
    });

    expect(compiler).toEqual({
      kind: "typescript",
      name: "typescript",
      version: ts.version,
      hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(nextCompiler.hash).not.toBe(compiler.hash);
    expect(parsedConfigA).toEqual({
      kind: "tsconfig",
      name: "parsed-tsconfig",
      hash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(parsedConfigB.hash).toBe(parsedConfigA.hash);
    expect(parsedConfigC.hash).not.toBe(parsedConfigA.hash);
  });

  it("hashes generated source and reports unavailable fingerprints as cache blockers", () => {
    const missingSource = createSourceInputFingerprint(join(dir, "missing.ts"));
    const generatedHash = createGeneratedSourceHash("export const generated = true;\n");

    expect(generatedHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(getNonReusableFingerprintReasons([missingSource])).toEqual([
      expect.stringContaining("Unable to read source input"),
    ]);
  });
});
