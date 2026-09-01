import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "specialized-refsubject-state.md";

describe("Versioned guide", () => {
  it("documents the public Versioned contract with independently compilable examples", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );

    expect(guide).toMatchObject({
      slug: "specialized-refsubject-state",
      section: "State",
      kind: "guide",
    });
    for (const term of [
      "Versioned.make",
      "Versioned.of",
      "Versioned.Service",
      "Versioned.provide",
      "Versioned.hold",
      "Fx.collectAll",
      "version",
      "does not define a write operation",
    ]) {
      expect(guide.body).toContain(term);
    }

    const staging = fs.mkdtempSync(path.join(websiteRoot, ".versioned-guide-check-"));
    try {
      const examples = extractTypeScriptFences(guide.body).map((code, index) => {
        const file = path.join(staging, `example-${index}.ts`);
        fs.writeFileSync(file, code);
        return file;
      });
      expect(examples.length).toBeGreaterThanOrEqual(3);

      const program = ts.createProgram(examples, {
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
