import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { typedVitePlugin } from "./index.js";

const originalCwd = process.cwd();
const originalSmokeMode = process.env.VITE_TYPED_DEVTOOLS_SMOKE;

afterEach(() => {
  process.chdir(originalCwd);
  if (originalSmokeMode === undefined) {
    delete process.env.VITE_TYPED_DEVTOOLS_SMOKE;
  } else {
    process.env.VITE_TYPED_DEVTOOLS_SMOKE = originalSmokeMode;
  }
});

describe("Typed Vite DevTools smoke mode", () => {
  it("enables browser devtools defaults without requiring browser config", async () => {
    const root = mkdtempSync(join(tmpdir(), "typed-vite-devtools-smoke-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "typed.config.ts"), 'export default { entry: "src/server.ts" };');
    process.chdir(root);
    process.env.VITE_TYPED_DEVTOOLS_SMOKE = "1";

    try {
      const virtualPlugin = typedVitePlugin({ compression: false, tsconfigPaths: false }).find(
        (plugin) => plugin.name === "virtual-modules",
      ) as
        | {
            readonly load?: (
              id: string,
            ) =>
              | Promise<{ readonly code: string } | string | null>
              | { readonly code: string }
              | string
              | null;
            readonly resolveId?: (
              id: string,
              importer?: string,
            ) => Promise<string | null> | string | null;
          }
        | undefined;

      expect(virtualPlugin).toBeDefined();
      const id = "typed:browser?routes=./routes";
      const resolved = await virtualPlugin?.resolveId?.(id, join(root, "src/browser.ts"));
      const loaded = await virtualPlugin?.load?.(typeof resolved === "string" ? resolved : id);
      const source = typeof loaded === "string" ? loaded : loaded?.code;

      expect(source).toContain("installTypedDevtoolsBridge");
      expect(source).toContain("makeDomRegistry");
      expect(source).toContain("createAppDomTemplateRuntime({ devtools:");
      expect(source).toContain("enabled: true");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
