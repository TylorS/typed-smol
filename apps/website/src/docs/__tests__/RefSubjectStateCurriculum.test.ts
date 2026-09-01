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
    file: "refsubject-renderer-independent-state.md",
    section: "State",
    kind: "concept",
    order: 2,
    terms: ["RefSubject<A, E, R>", "RefSubject.make", "RefSubject.update", "Computed", "Filtered"],
  },
  {
    file: "refsubject-sources-equality-and-lifetime.md",
    section: "State",
    kind: "guide",
    order: 2.05,
    terms: [
      "fromEffect",
      "fromFx",
      "fromStream",
      "RefSubjectOptions",
      "subscriberCount",
      "interrupt",
    ],
  },
  {
    file: "derived-conditional-and-accumulated-state.md",
    section: "State",
    kind: "guide",
    order: 2.15,
    terms: ["Computed", "Filtered", "makeComputed", "makeFiltered", "scan", "scanEffect"],
  },
  {
    file: "state-transactions-and-bidirectional-views.md",
    section: "State",
    kind: "guide",
    order: 2.25,
    terms: ["modify", "runUpdates", "transform", "slice", "GetSetDelete"],
  },
  {
    file: "shared-state-contracts.md",
    section: "State",
    kind: "guide",
    order: 2.35,
    terms: ["RefSubject.Service", "computedFromService", "filteredFromService", "Layer"],
  },
] as const;

describe("RefSubject state curriculum", () => {
  it("covers the public state behaviors omitted by the introductory and specialized-state guides", () => {
    for (const expected of guides) {
      const guide = parseGuideDocumentation(
        expected.file,
        fs.readFileSync(path.join(websiteRoot, "content/guides", expected.file), "utf8"),
      );

      expect(guide).toMatchObject({
        slug: expected.file.replace(/\.md$/u, ""),
        section: expected.section,
        kind: expected.kind,
        order: expected.order,
      });
      expect(extractTypeScriptFences(guide.body).length).toBeGreaterThanOrEqual(2);
      for (const term of expected.terms) expect(guide.body).toContain(term);
    }
  });

  it("keeps every state curriculum example independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".refsubject-state-curriculum-check-"));

    try {
      const files = guides.flatMap(({ file }) => {
        const guide = parseGuideDocumentation(
          file,
          fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8"),
        );
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
