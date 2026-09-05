import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { quickStartSections, tutorialSteps } from "../../tutorial/Content.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

describe("Authored curriculum examples", () => {
  it("typechecks every cumulative milestone against the public packages", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".curriculum-examples-"));

    try {
      const files: Array<string> = [];
      const curricula = [quickStartSections, tutorialSteps];
      for (const [curriculumIndex, entries] of curricula.entries()) {
        const snapshots = new Map<string, string>();
        for (const [stepIndex, entry] of entries.entries()) {
          for (const file of entry.files) {
            if (file.language === "ts") snapshots.set(file.name, file.source);
          }
          for (const [name, source] of snapshots) {
            const file = path.join(staging, String(curriculumIndex), String(stepIndex), name);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, source);
            files.push(file);
          }
        }
      }
      const program = ts.createProgram(files, {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });

      expect(
        ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), {
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
