import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { renderGuideMarkdown } from "../RenderMarkdown.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const operatorGuides = [
  {
    file: "fx-dynamic-producers.md",
    order: 1.15,
    operators: ["Fx.gen", "Fx.unwrap", "Fx.unwrapScoped"],
  },
  {
    file: "fx-selection-and-cardinality.md",
    order: 1.6,
    operators: ["Fx.filterMap", "Fx.take", "Fx.slice", "Fx.takeUntil"],
  },
  {
    file: "fx-time-and-rate.md",
    order: 1.7,
    operators: ["Fx.periodic", "Fx.debounce", "Fx.throttle", "Fx.repeat"],
  },
  {
    file: "fx-higher-order-and-concurrency.md",
    order: 1.4,
    operators: ["Fx.flatMap", "Fx.switchMap", "Fx.concatMap", "Fx.flatMapConcurrently"],
  },
  {
    file: "fx-errors-and-recovery.md",
    order: 1.8,
    operators: ["Fx.catchTag", "Fx.catchCause", "Fx.retry", "Fx.result"],
  },
  {
    file: "fx-services-and-lifetime.md",
    order: 1.9,
    operators: ["Fx.provide", "Fx.genScoped", "Fx.drainLayer", "Fx.observeLayer"],
  },
  {
    file: "fx-stateful-transforms.md",
    order: 1.3,
    operators: ["Fx.scan", "Fx.pairwise", "Fx.grouped", "Fx.skipRepeats"],
  },
] as const;

const fxSectionFiles = [
  "fx-push-reactivity.md",
  "building-fx.md",
  "fx-dynamic-producers.md",
  "transforming-fx.md",
  "fx-stateful-transforms.md",
  "fx-higher-order-and-concurrency.md",
  "composing-fx.md",
  "fx-selection-and-cardinality.md",
  "fx-time-and-rate.md",
  "fx-errors-and-recovery.md",
  "fx-services-and-lifetime.md",
  "consuming-fx.md",
] as const;

describe("Fx operator curriculum", () => {
  it("teaches Fx as a complete reactive abstraction before any rendering layer", () => {
    for (const file of fxSectionFiles) {
      const source = fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8");
      expect(source, file).not.toMatch(/\b(?:template|renderer)\b/iu);
    }
  });

  it("organizes public operators by behavioral decision rather than API family", () => {
    for (const expected of operatorGuides) {
      const source = fs.readFileSync(
        path.join(websiteRoot, "content/guides", expected.file),
        "utf8",
      );
      const guide = parseGuideDocumentation(expected.file, source);

      expect(guide).toMatchObject({
        slug: expected.file.replace(/\.md$/u, ""),
        section: "Fx",
        kind: "guide",
        order: expected.order,
      });
      const examples = extractTypeScriptFences(source);
      expect(examples.join("\n")).not.toContain("declare ");
      expect(examples.length).toBeGreaterThan(0);
      for (const operator of expected.operators) expect(source).toContain(operator);
    }
  });

  it("keeps every operator example independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".fx-operator-curriculum-check-"));

    try {
      const files = operatorGuides.flatMap(({ file }) => {
        const source = fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8");
        return extractTypeScriptFences(source).map((code, index) => {
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

  it("renders every higher-order policy before the secondary Effect callback variants", () => {
    const source = fs.readFileSync(
      path.join(websiteRoot, "content/guides/fx-higher-order-and-concurrency.md"),
      "utf8",
    );
    const guide = parseGuideDocumentation("fx-higher-order-and-concurrency.md", source);
    const rendered = renderGuideMarkdown(guide.body).html;
    const operators = [
      "flatMap(load)",
      "flatMapConcurrently(load, 2)",
      "concatMap(save)",
      "switchMap(preview)",
      "exhaustMap(submit)",
      "exhaustLatestMap(index)",
      "if(condition, { onTrue, onFalse })",
      "race(slow, fast)",
      "raceAll(slow, fast, mid)",
    ] as const;

    expect(rendered.match(/class="fx-marble"/gu)).toHaveLength(operators.length);
    for (const operator of operators) expect(rendered).toContain(operator);

    const secondaryVariants = rendered.indexOf("Effect-returning convenience variants");
    expect(secondaryVariants).toBeGreaterThan(rendered.lastIndexOf('<figure class="fx-marble"'));
  });

  it("visibly covers every public stateful transform with a marble diagram", () => {
    const source = fs.readFileSync(
      path.join(websiteRoot, "content/guides/fx-stateful-transforms.md"),
      "utf8",
    );
    const guide = parseGuideDocumentation("fx-stateful-transforms.md", source);
    const rendered = renderGuideMarkdown(guide.body).html;
    const operators = [
      "filterMapLoop",
      "filterMapLoopCause",
      "filterMapLoopCauseEffect",
      "filterMapLoopEffect",
      "changesWithEffect",
      "grouped",
      "groupedWithin",
      "loop",
      "loopCause",
      "loopCauseEffect",
      "loopEffect",
      "pairwise",
      "scan",
      "scanEffect",
      "skipRepeats",
      "skipRepeatsWith",
    ] as const;

    for (const operator of operators) {
      expect(rendered).toContain(`<code>${operator}</code>`);
    }
  });
});
