import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "template-spreads-data.md";
const guidePath = path.join(websiteRoot, "content/guides", guideFile);

describe("Template spread and data guide", () => {
  it("documents the public spread surfaces and keeps every example compilable", () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const guide = parseGuideDocumentation(guideFile, source);

    expect(guide).toMatchObject({
      slug: "template-spreads-data",
      section: "Templates",
      kind: "guide",
      order: 3.25,
    });
    expect(guide.headings).toEqual(
      expect.arrayContaining([
        "Start with the surface you mean",
        "`.data` owns a dataset slice",
        "Spread a record when the shape is dynamic",
        "Ownership is local, including removal",
        "Server rendering has a smaller surface",
      ]),
    );
    for (const term of [
      "value=${...}",
      ".value=${...}",
      "?disabled=${false}",
      ".data",
      "className",
      "@click",
      "onclick",
      "ref",
      ".properties",
      "constructor",
      "__proto__",
      "Fx",
    ]) {
      expect(source).toContain(term);
    }

    const examples = extractTypeScriptFences(source);
    expect(examples).toHaveLength(3);
    expect(validateAuthoredExampleQuality([guide])).toEqual([]);

    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-spreads-data-check-"));
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
