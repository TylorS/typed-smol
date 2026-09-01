import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "template-compilation-pipeline.md";
const guidePath = path.join(websiteRoot, "content/guides", guideFile);

describe("Template compilation pipeline guide", () => {
  it("documents the public renderer-author pipeline with compilable examples", () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const guide = parseGuideDocumentation(guideFile, source);

    expect(guide).toMatchObject({
      slug: "template-compilation-pipeline",
      section: "Integration",
      kind: "deep-dive",
      order: 10.05,
    });
    expect(guide.headings).toEqual(
      expect.arrayContaining([
        "The public pipeline",
        "Parse once, retain part paths",
        "Compile for DOM or HTML",
        "Emit the RenderEvent your target owns",
      ]),
    );
    expect(source).toContain("TemplateStringsArray");
    expect(source).toContain("templateToHtmlChunks");
    expect(source).toContain("addTemplateHash");
    expect(source).toContain("DomRenderEvent");
    expect(source).toContain("HtmlRenderEvent");
    expect(source).toContain("@typed/template/internal");
    expect(source).toContain("not a public extension point");

    const examples = extractTypeScriptFences(source);
    expect(examples.length).toBeGreaterThanOrEqual(4);
    expect(examples.some((example) => example.includes("@typed/template/internal"))).toBe(false);
    expect(validateAuthoredExampleQuality([guide])).toEqual([]);

    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-compilation-pipeline-check-"));
    try {
      const files = examples.map((code, index) => {
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
