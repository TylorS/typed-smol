import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createTypeScriptPluginConfiguration,
  TYPED_TYPESCRIPT_PLUGIN_NAME,
} from "./typescriptPlugin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("typescript plugin configuration", () => {
  it("uses the shared virtual-modules TypeScript plugin name", () => {
    expect(TYPED_TYPESCRIPT_PLUGIN_NAME).toBe("@typed/virtual-modules-ts-plugin");
  });

  it("creates config that keeps template diagnostics enabled by default", () => {
    expect(createTypeScriptPluginConfiguration()).toEqual({
      routeDiagnostics: true,
      templateDiagnostics: true,
    });
  });

  it("declares the TypeScript server plugin contribution", () => {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf8"),
    ) as {
      readonly contributes?: {
        readonly typescriptServerPlugins?: readonly { readonly name?: string }[];
      };
    };

    expect(packageJson.contributes?.typescriptServerPlugins).toContainEqual({
      enableForWorkspaceTypeScriptVersions: true,
      name: TYPED_TYPESCRIPT_PLUGIN_NAME,
    });
  });
});
