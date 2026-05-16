import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { rewriteSourceForPreviewLocation } from "./materializeVirtualFile.js";
import { materializeVirtualFile as materializePublicVirtualFile } from "../index.js";

describe("materializeVirtualFile", () => {
  it("rewrites relative module specifiers in generated source", () => {
    const sourceText = [
      'import { x } from "./x";',
      'import type { LocalType } from "../types";',
      'import type { PackageType } from "pkg";',
      'export { y } from "./y";',
      'export * from "../shared";',
      'import "./setup";',
      'const lazy = await import("./lazy");',
      "const templateLazy = await import(`./template-lazy`);",
      'const packageModule = await import("pkg");',
      "const dynamicPackage = await import(`pkg`);",
      'type LocalImportType = import("./local-type").LocalType;',
      'type PackageImportType = import("pkg").PackageType;',
    ].join("\n");

    const rewritten = rewriteSourceForPreviewLocation(
      sourceText,
      "/workspace/app/src/features/root.ts",
      "/workspace/app/node_modules/.typed/virtual/plugin/artifact.ts",
    );

    expect(rewritten).toContain('import { x } from "../../../../src/features/x";');
    expect(rewritten).toContain('import type { LocalType } from "../../../../src/types";');
    expect(rewritten).toContain('import type { PackageType } from "pkg";');
    expect(rewritten).toContain('export { y } from "../../../../src/features/y";');
    expect(rewritten).toContain('export * from "../../../../src/shared";');
    expect(rewritten).toContain('import "../../../../src/features/setup";');
    expect(rewritten).toContain('const lazy = await import("../../../../src/features/lazy");');
    expect(rewritten).toContain(
      "const templateLazy = await import(`../../../../src/features/template-lazy`);",
    );
    expect(rewritten).toContain('const packageModule = await import("pkg");');
    expect(rewritten).toContain("const dynamicPackage = await import(`pkg`);");
    expect(rewritten).toContain(
      'type LocalImportType = import("../../../../src/features/local-type").LocalType;',
    );
    expect(rewritten).toContain('type PackageImportType = import("pkg").PackageType;');
  });

  it("preserves TSX while rewriting relative module specifiers", () => {
    const rewritten = rewriteSourceForPreviewLocation(
      ['import { View } from "./view";', 'export const element = <View label="ok" />;'].join("\n"),
      "/workspace/app/src/features/root.tsx",
      "/workspace/app/node_modules/.typed/virtual/plugin/artifact.tsx",
    );

    expect(rewritten).toContain('import { View } from "../../../../src/features/view";');
    expect(rewritten).toContain('export const element = <View label="ok" />;');
  });

  it("exposes shared disk materialization for VS Code preview files", () => {
    const dir = mkdtempSync(join(tmpdir(), "typed-vm-materialize-"));
    try {
      const importer = join(dir, "src", "feature", "entry.ts");
      const virtualFilePath = join(
        dir,
        "node_modules",
        ".typed",
        "virtual",
        "__virtual_plugin_1234.ts",
      );
      materializePublicVirtualFile(
        virtualFilePath,
        importer,
        [
          'import { value } from "./local";',
          'import "./setup";',
          'const lazy = await import("../lazy");',
        ].join("\n"),
      );

      const materialized = readFileSync(virtualFilePath, "utf8");
      expect(materialized).toContain('from "../../../src/feature/local"');
      expect(materialized).toContain('import "../../../src/feature/setup";');
      expect(materialized).toContain('await import("../../../src/lazy")');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
