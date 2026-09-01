import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "template-references-and-element-access.md";

describe("Template references guide", () => {
  it("documents native element access, cleanup, and hydration without inventing a component ref API", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );

    expect(guide).toMatchObject({
      slug: "template-references-and-element-access",
      section: "Templates",
      kind: "guide",
      order: 3.35,
    });
    for (const term of [
      "ref=${handler}",
      "HTMLElement | SVGElement",
      "Effect.acquireRelease",
      "HydrationRef",
      "RefSubject.hydrate",
      "hydrateAll",
      "StaticHtmlRenderTemplate",
      "exact server-rendered element",
    ]) {
      expect(guide.body).toContain(term);
    }
    expect(extractTypeScriptFences(guide.body)).toHaveLength(4);
    expect(guide.body.split(/\s+/u).length).toBeLessThanOrEqual(1_400);
  });

  it("keeps every TypeScript example independently compilable", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-refs-guide-check-"));

    try {
      const examples = extractTypeScriptFences(guide.body).map((code, index) => {
        const file = path.join(staging, `example-${index}.ts`);
        fs.writeFileSync(file, code);
        return file;
      });
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
