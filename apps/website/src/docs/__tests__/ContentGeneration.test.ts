import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import {
  loadGlossaryContent,
  parseFrontmatter,
  parseGuideDocumentation,
  parseGlossaryEntry,
  parseRecipeDocumentation,
} from "../Frontmatter.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const authoredMarkdownFiles = (): ReadonlyArray<string> => {
  const contentRoot = path.join(websiteRoot, "content");
  return fs
    .readdirSync(contentRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
};

const scriptFences = (markdown: string): ReadonlyArray<string> =>
  Array.from(
    markdown.matchAll(/^```(?:ts|tsx|typescript|js|jsx|javascript)\s*\r?\n([\s\S]*?)^```\s*$/gmu),
    ([, code]) => code!,
  );

const aliasedTypedImports = (code: string): ReadonlyArray<string> => {
  const source = ts.createSourceFile(
    "example.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  return source.statements.flatMap((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith("@typed/") ||
      statement.importClause?.namedBindings === undefined ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      return [];
    }
    const moduleSpecifier = statement.moduleSpecifier.text;
    return statement.importClause.namedBindings.elements
      .filter((element) => element.propertyName !== undefined)
      .map(
        (element) => `${moduleSpecifier}: ${element.propertyName!.text} as ${element.name.text}`,
      );
  });
};

describe("Markdown content generation", () => {
  it("orders the Explore curriculum by learning layer instead of renderer implementation", () => {
    const guides = fs
      .readdirSync(path.join(websiteRoot, "content/guides"))
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) =>
        parseGuideDocumentation(
          fileName,
          fs.readFileSync(path.join(websiteRoot, "content/guides", fileName), "utf8"),
        ),
      )
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

    expect(
      guides.every(({ order }, index) => index === 0 || order! > guides[index - 1]!.order!),
    ).toBe(true);

    const bySection = Map.groupBy(guides, ({ section }) => section!);
    expect([...bySection.keys()]).toEqual([
      "Fx",
      "State",
      "Templates",
      "UI",
      "DOM and platform",
      "Applications",
      "Integration",
    ]);
    expect(
      Object.fromEntries(
        [...bySection].map(([section, entries]) => [section, entries.map(({ slug }) => slug)]),
      ),
    ).toEqual({
      Fx: [
        "fx-push-reactivity",
        "building-fx",
        "fx-dynamic-producers",
        "sink-writing-effects",
        "subject-event-publications",
        "transforming-fx",
        "fx-stateful-transforms",
        "fx-higher-order-and-concurrency",
        "composing-fx",
        "fx-selection-and-cardinality",
        "fx-time-and-rate",
        "fx-errors-and-recovery",
        "fx-services-and-lifetime",
        "consuming-fx",
      ],
      State: [
        "refsubject-renderer-independent-state",
        "refsubject-template-hydration",
        "refsubject-sources-equality-and-lifetime",
        "composing-refsubject-state",
        "derived-conditional-and-accumulated-state",
        "specialized-refsubject-state",
        "state-transactions-and-bidirectional-views",
        "shared-state-contracts",
      ],
      Templates: [
        "render-your-first-template",
        "authoring-typed-templates",
        "template-element-bindings",
        "renderable-normalization",
        "template-spreads-data",
        "template-text-only-contexts",
        "keyed-template-collections",
        "template-references-and-element-access",
        "template-namespaces-and-platform-markup",
        "native-events-with-effect",
      ],
      UI: [
        "building-ui-components",
        "choosing-ui-components",
        "ui-collections-and-focus",
        "forms-as-a-browser-contract",
        "overlays-disclosure-and-transient-ui",
        "selection-autocomplete-and-command-surfaces",
      ],
      "DOM and platform": [
        "dom-updates-and-reconciliation",
        "dom-parts-and-attributes",
        "dom-class-names",
        "dom-render-event",
        "wire-and-rendered-dom-output",
        "html-render-event",
        "render-scheduling",
        "cooperative-by-design",
        "mounting-dom-output",
        "rendering-html-on-the-server",
        "hydrating-typed-html",
      ],
      Applications: [
        "route-typed-url-inputs",
        "router-navigation-live-selection",
        "navigation-as-an-effect-service",
        "server-rendering-and-hydration",
        "testing-typed-systems",
      ],
      Integration: [
        "render-event-substrate",
        "template-compilation-pipeline",
        "implementing-render-template",
        "event-source-delegation",
        "integrating-matcher-with-effect-http",
      ],
    });
  });

  it("parses frontmatter arrays and preserves the Markdown body", () => {
    const parsed = parseFrontmatter(
      "example.md",
      '---\nid: fx\naliases: [stream, "push stream"]\n---\n\nA detail.',
    );

    expect(parsed.attributes).toEqual({ id: "fx", aliases: ["stream", "push stream"] });
    expect(parsed.body).toBe("A detail.");
  });

  it("loads one validated Markdown source per glossary term", () => {
    const entries = loadGlossaryContent(path.join(websiteRoot, "content/glossary"));

    expect(entries.find(({ id }) => id === "fx")).toMatchObject({
      term: "Fx",
      definition: "A push-based stream of values with typed errors and requirements.",
      related: ["effect", "render-event", "sink"],
    });
    expect(entries.find(({ id }) => id === "fx")?.details).toContain("producer decides");
    expect(new Set(entries.flatMap(({ aliases }) => aliases)).size).toBe(
      entries.flatMap(({ aliases }) => aliases).length,
    );
  });

  it("indexes the public vocabulary used across state, rendering, routing, and integration", () => {
    const entries = loadGlossaryContent(path.join(websiteRoot, "content/glossary"));

    expect(entries.map(({ id }) => id)).toEqual([
      "accessibility",
      "adapter-ownership",
      "computed",
      "cooperative-ownership",
      "dom-render-event",
      "dynamic-part",
      "dynamic-range",
      "effect-channels",
      "effect",
      "filtered",
      "fx",
      "html-render-event",
      "hydration",
      "keyed-identity",
      "local-reconciliation",
      "many",
      "matcher",
      "refsubject",
      "render-event",
      "render-template",
      "renderable",
      "route",
      "router",
      "scope",
      "service",
      "sink",
      "ssr",
      "subject",
      "template",
      "ui",
      "wire",
    ]);

    expect(Object.fromEntries(entries.map(({ id, related }) => [id, related]))).toMatchObject({
      "adapter-ownership": ["cooperative-ownership", "dom-render-event", "scope"],
      computed: ["refsubject", "filtered", "fx"],
      "dynamic-part": ["dynamic-range", "local-reconciliation", "template"],
      "effect-channels": ["effect", "service", "scope"],
      filtered: ["computed", "refsubject", "fx"],
      "local-reconciliation": ["dynamic-part", "dynamic-range", "many"],
      many: ["keyed-identity", "local-reconciliation", "template"],
      matcher: ["route", "router", "fx"],
      renderable: ["template", "render-event", "fx"],
      route: ["matcher", "router", "service"],
      router: ["route", "matcher", "scope"],
      service: ["effect", "effect-channels", "scope"],
      template: ["renderable", "render-event", "render-template"],
      ui: ["accessibility", "refsubject", "template"],
      accessibility: ["ui", "template", "cooperative-ownership"],
    });
  });

  it("keeps concepts and task guides in one ordered Explore curriculum", () => {
    expect(
      parseGuideDocumentation(
        "first-template.md",
        "---\ntitle: First template\nsummary: Render output.\nsection: Rendering\nkind: guide\norder: 4\n---\n## Mount",
      ),
    ).toMatchObject({
      slug: "first-template",
      section: "Rendering",
      kind: "guide",
      order: 4,
      headings: ["Mount"],
    });
  });

  it("rejects duplicate glossary ids and aliases", () => {
    const temp = fs.mkdtempSync(path.join(websiteRoot, ".content-test-"));
    try {
      fs.writeFileSync(path.join(temp, "a.md"), "---\nid: same\nterm: A\ndefinition: A\n---\nA");
      fs.writeFileSync(path.join(temp, "b.md"), "---\nid: same\nterm: B\ndefinition: B\n---\nB");
      expect(() => loadGlossaryContent(temp)).toThrow(/duplicate/i);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });

  it("rejects unknown frontmatter attributes instead of silently ignoring typos", () => {
    expect(() =>
      parseGlossaryEntry(
        "typo.md",
        "---\nid: typo\nterm: Typo\ndefinition: Bad\ndefintion: ignored\n---\nBody",
      ),
    ).toThrow(/unknown.*defintion|unrecognized.*defintion/i);
    expect(() =>
      parseRecipeDocumentation(
        "typo.md",
        "---\nslug: typo\ntitle: Typo\nsummary: Bad\nsummray: ignored\n---\n## Body",
      ),
    ).toThrow(/unknown.*summray|unrecognized.*summray/i);
    expect(() =>
      parseGuideDocumentation(
        "typo.md",
        "---\ntitle: Typo\nsummary: Bad\nsection: Rendering\nkind: guide\norder: 1\nsectoin: ignored\n---\nBody",
      ),
    ).toThrow(/unknown.*sectoin|unrecognized.*sectoin/i);
  });

  it("uses exact public API names for every @typed import in authored examples", () => {
    const offenders = authoredMarkdownFiles().flatMap((file) =>
      scriptFences(fs.readFileSync(file, "utf8")).flatMap((code, index) =>
        aliasedTypedImports(code).map(
          (alias) => `${path.relative(websiteRoot, file)} fence ${index + 1}: ${alias}`,
        ),
      ),
    );

    expect(offenders).toEqual([]);
  });
});
