import { describe, expect, it } from "vitest";
import { rewriteSourceForPreviewLocation } from "./materializeVirtualFile.js";

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
});
