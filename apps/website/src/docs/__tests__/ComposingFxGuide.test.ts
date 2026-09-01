import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/composing-fx.md");

describe("Composing Fx guide", () => {
  it("makes higher-order scheduling and lifetime policies explicit", () => {
    const guide = parseGuideDocumentation("composing-fx.md", fs.readFileSync(guidePath, "utf8"));

    expect(guide).toMatchObject({
      slug: "composing-fx",
      section: "Fx",
      kind: "guide",
      order: 1.5,
    });
    for (const operator of [
      "merge",
      "concat",
      "zipLatest",
      "flatMapConcurrently",
      "concatMap",
      "switchMap",
      "exhaustMap",
      "exhaustLatestMap",
    ]) {
      expect(guide.body).toContain(operator);
    }
    expect(guide.body).toMatch(/^Imagine a search screen\./);
    expect(guide.body).toContain("Data.TaggedError");
    expect(guide.body).toContain("Context.Service");
    expect(guide.body).toContain("Effect.scoped");
    expect(guide.body.split(/\s+/u).length).toBeLessThanOrEqual(1_400);
    expect(extractTypeScriptFences(guide.body)).toHaveLength(4);
  });

  it("keeps every TypeScript example independently compilable", () => {
    const guide = parseGuideDocumentation("composing-fx.md", fs.readFileSync(guidePath, "utf8"));
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".composing-fx-check-"));

    try {
      const files = extractTypeScriptFences(guide.body).map((code, index) => {
        const file = path.join(staging, `example-${index}.ts`);
        fs.writeFileSync(file, code);
        return file;
      });
      const program = ts.createProgram(files, {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);

      expect(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => websiteRoot,
          getNewLine: () => "\n",
        }),
      ).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
});
