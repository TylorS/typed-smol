import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const guides = [
  {
    file: "forms-as-a-browser-contract.md",
    title: "Forms as a browser contract",
    order: 4.3,
    publicApis: ["@typed/ui/Form", "Form.make", "Form.Error"],
  },
  {
    file: "overlays-disclosure-and-transient-ui.md",
    title: "Overlays, disclosure, and transient UI",
    order: 4.4,
    publicApis: ["@typed/ui/Disclosure", "@typed/ui/Dialog", "@typed/ui/Popover"],
  },
  {
    file: "selection-autocomplete-and-command-surfaces.md",
    title: "Selection, autocomplete, and command surfaces",
    order: 4.5,
    publicApis: ["@typed/ui/Select", "@typed/ui/Combobox", "@typed/ui/Menu"],
  },
] as const;

const uiGuideFiles = [
  "building-ui-components.md",
  "choosing-ui-components.md",
  ...guides.map(({ file }) => file),
] as const;

describe("public UI guides", () => {
  it("adds hands-on guides with public APIs, standards, and explicit author obligations", () => {
    for (const guide of guides) {
      const file = path.join(websiteRoot, "content/guides", guide.file);
      expect(fs.existsSync(file), guide.file).toBe(true);
      const source = fs.readFileSync(file, "utf8");
      const parsed = parseGuideDocumentation(guide.file, source);

      expect(parsed).toMatchObject({
        title: guide.title,
        section: "UI",
        kind: "guide",
        order: guide.order,
      });
      expect(source).toMatch(/Authors must provide|author must provide/u);
      expect(source).toMatch(/Typed (?:verifies|provides)/u);
      expect(source).toMatch(
        /https:\/\/(?:www\.w3\.org|developer\.mozilla\.org|html\.spec\.whatwg\.org)\//u,
      );
      for (const api of guide.publicApis) expect(source).toContain(api);
    }
  });

  it("keeps every UI guide TypeScript fence independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".public-ui-guide-check-"));

    try {
      const files = uiGuideFiles.flatMap((file) => {
        const source = fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8");
        const guide = parseGuideDocumentation(file, source);
        return extractTypeScriptFences(guide.body).map((code, index) => {
          const example = path.join(staging, `${file}-${index}.ts`);
          fs.writeFileSync(example, code);
          return example;
        });
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
