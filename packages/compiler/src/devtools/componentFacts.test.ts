import {
  ComponentSummarySchema,
  decodeDevtoolsPayload,
  makeComponentId,
  makeFxNodeId,
  makeHmrBoundaryId,
  makeRefSubjectId,
  makeSourceLocationId,
  makeTemplateHash,
  makeTemplatePartId,
} from "@typed/devtools-protocol";
import * as Schema from "effect/Schema";
import { describe, expect, expectTypeOf, it } from "vitest";
import { analyzeTemplateModule } from "../template/analyzeTemplateModule.js";
import {
  createComponentDevtoolsFact,
  createComponentDevtoolsFacts,
  type ComponentDevtoolsFact,
} from "./componentFacts.js";

describe("component devtools facts", () => {
  it("creates deterministic compiler facts from analyzed template evidence", () => {
    const moduleId = "/src/Counter.tsx";
    const sourceText = [
      'import { html } from "@typed/template";',
      "const count = 1;",
      "export const Counter = html`<button @click=${increment}>${count}</button>`;",
    ].join("\n");
    const analysis = analyzeTemplateModule({ moduleId, sourceText });
    const template = analysis.templates[0];

    expect(analysis.diagnostics).toEqual([]);
    expect(template).toBeDefined();

    const fact = createComponentDevtoolsFact({
      displayName: "Counter",
      exportName: "Counter",
      fxRoots: [{ localName: "loadUser" }],
      hmrBoundary: `module:${moduleId}`,
      moduleId,
      refSubjects: [{ localName: "count", serviceId: "@app/Counter/Count" }],
      sourceText,
      template,
    });

    const decodedSummary = Schema.decodeUnknownSync(ComponentSummarySchema)(fact.summary);

    expect(fact).toEqual({
      componentId: makeComponentId(`${moduleId}#Counter`),
      displayName: "Counter",
      fxNodeIds: [makeFxNodeId(`${moduleId}#Counter#loadUser`)],
      hmrBoundaryId: makeHmrBoundaryId(`module:${moduleId}`),
      moduleId,
      refSubjectIds: [makeRefSubjectId("@app/Counter/Count")],
      source: sourceSpan(moduleId, sourceText, sourceText.indexOf("html`"), sourceText.length - 1),
      sourceLocationId: makeSourceLocationId(`${moduleId}:${sourceText.indexOf("html`")}`),
      summary: decodedSummary,
      template: {
        hash: makeTemplateHash(template!.plan.templateHash),
        parts: [
          {
            effectiveRuntimePath: [0],
            expression: sourceSpan(
              moduleId,
              sourceText,
              sourceText.indexOf("increment"),
              sourceText.indexOf("increment") + "increment".length,
            ),
            expressions: [
              sourceSpan(
                moduleId,
                sourceText,
                sourceText.indexOf("increment"),
                sourceText.indexOf("increment") + "increment".length,
              ),
            ],
            id: makeTemplatePartId(`${template!.plan.templateHash}#0#0`),
            kind: "event",
            name: "click",
            path: [0],
            valueIndex: 0,
          },
          {
            effectiveRuntimePath: [0, 0],
            expression: sourceSpan(
              moduleId,
              sourceText,
              sourceText.indexOf("count}</button>"),
              sourceText.indexOf("count}</button>") + "count".length,
            ),
            expressions: [
              sourceSpan(
                moduleId,
                sourceText,
                sourceText.indexOf("count}</button>"),
                sourceText.indexOf("count}</button>") + "count".length,
              ),
            ],
            id: makeTemplatePartId(`${template!.plan.templateHash}#0.0#1`),
            kind: "node",
            path: [0],
            valueIndex: 1,
          },
        ],
      },
      templateHash: makeTemplateHash(template!.plan.templateHash),
    });
    expect(fact.summary).toEqual({
      componentId: fact.componentId,
      displayName: "Counter",
      fxNodeIds: fact.fxNodeIds,
      hmrBoundaryId: fact.hmrBoundaryId,
      refSubjectIds: fact.refSubjectIds,
      sourceLocationId: fact.sourceLocationId,
      templateHash: fact.templateHash,
    });
    expect(() => decodeDevtoolsPayload(ComponentSummarySchema, fact)).toThrow();
  });

  it("keeps component ids stable across repeated planning", () => {
    const input = {
      displayName: "Counter",
      exportName: "Counter",
      moduleId: "/src/Counter.tsx",
    } as const;

    expect(createComponentDevtoolsFact(input)).toEqual(createComponentDevtoolsFact(input));
    expect(createComponentDevtoolsFacts([input, { ...input, exportName: "Profile" }])).toEqual([
      createComponentDevtoolsFact(input),
      createComponentDevtoolsFact({ ...input, exportName: "Profile" }),
    ]);
  });

  it("scopes fallback RefSubject ids by component and keeps sparse parts unique", () => {
    const moduleId = "src/Counter.tsx";
    const sourceText = [
      'import { html } from "@typed/template";',
      'export const Counter = html`<p class="count-${tone}" title="count-${label}">${count}</p>`;',
    ].join("\n");
    const template = analyzeTemplateModule({ moduleId, sourceText }).templates[0]!;
    const fact = createComponentDevtoolsFact({
      exportName: "Counter",
      moduleId,
      refSubjects: [{ localName: "count" }],
      sourceText,
      template,
    });
    const otherFact = createComponentDevtoolsFact({
      exportName: "Other",
      moduleId: "src/Other.tsx",
      refSubjects: [{ localName: "count" }],
    });

    expect(fact.refSubjectIds).toEqual([makeRefSubjectId("src/Counter.tsx#Counter#count")]);
    expect(otherFact.refSubjectIds).toEqual([makeRefSubjectId("src/Other.tsx#Other#count")]);
    expect(new Set(fact.template?.parts.map((part) => part.id))).toHaveLength(
      fact.template!.parts.length,
    );
    expect(fact.template?.parts).toEqual([
      {
        effectiveRuntimePath: [0],
        expression: sourceSpan(
          moduleId,
          sourceText,
          sourceText.indexOf("tone"),
          sourceText.indexOf("tone") + "tone".length,
        ),
        expressions: [
          sourceSpan(
            moduleId,
            sourceText,
            sourceText.indexOf("tone"),
            sourceText.indexOf("tone") + "tone".length,
          ),
        ],
        id: makeTemplatePartId(`${template.plan.templateHash}#sparseClassName#class#0#0`),
        kind: "sparseClassName",
        name: "class",
        path: [0],
        valueIndexes: [0],
      },
      {
        effectiveRuntimePath: [0],
        expression: sourceSpan(
          moduleId,
          sourceText,
          sourceText.indexOf("label"),
          sourceText.indexOf("label") + "label".length,
        ),
        expressions: [
          sourceSpan(
            moduleId,
            sourceText,
            sourceText.indexOf("label"),
            sourceText.indexOf("label") + "label".length,
          ),
        ],
        id: makeTemplatePartId(`${template.plan.templateHash}#sparseAttr#title#0#1`),
        kind: "sparseAttr",
        name: "title",
        path: [0],
        valueIndexes: [1],
      },
      {
        effectiveRuntimePath: [0, 0],
        expression: sourceSpan(
          moduleId,
          sourceText,
          sourceText.indexOf("count}</p>"),
          sourceText.indexOf("count}</p>") + "count".length,
        ),
        expressions: [
          sourceSpan(
            moduleId,
            sourceText,
            sourceText.indexOf("count}</p>"),
            sourceText.indexOf("count}</p>") + "count".length,
          ),
        ],
        id: makeTemplatePartId(`${template.plan.templateHash}#0.0#2`),
        kind: "node",
        path: [0],
        valueIndex: 2,
      },
    ]);
  });

  it("preserves protocol id brands on inferred fact fields", () => {
    const fact = createComponentDevtoolsFact({
      displayName: "Counter",
      exportName: "Counter",
      moduleId: "/src/Counter.tsx",
    });

    expectTypeOf(fact).toExtend<ComponentDevtoolsFact>();
    expectTypeOf(fact.componentId).toEqualTypeOf<ReturnType<typeof makeComponentId>>();
    expectTypeOf(fact.summary.componentId).toEqualTypeOf<ReturnType<typeof makeComponentId>>();
  });
});

function sourceSpan(moduleId: string, sourceText: string, start: number, end: number) {
  return {
    endOffset: end,
    endPosition: positionAt(sourceText, end),
    id: makeSourceLocationId(`${moduleId}:${start}`),
    moduleId,
    startOffset: start,
    startPosition: positionAt(sourceText, start),
  };
}

function positionAt(sourceText: string, offset: number) {
  const lines = sourceText.slice(0, offset).split("\n");
  return { column: lines.at(-1)!.length + 1, line: lines.length };
}
