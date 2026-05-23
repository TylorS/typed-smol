import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createResolver } from "./resolver.js";

describe("createResolver", () => {
  it("requires vmc config instead of tsconfig plugin-specifier fallback", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "typed-vscode-resolver-"));
    try {
      writeFileSync(
        join(projectRoot, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            plugins: [
              {
                name: "@typed/virtual-modules-ts-plugin",
                plugins: ["./typed.virtual-plugin.js"],
              },
            ],
          },
        }),
      );

      const resolver = createResolver(projectRoot);

      expect(resolver.getPluginSpecifiers()).toEqual([]);
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
