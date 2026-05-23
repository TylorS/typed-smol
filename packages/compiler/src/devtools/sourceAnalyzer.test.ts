import {
  SourceAnalyzerResponseSchema,
  decodeDevtoolsPayload,
  makeComponentId,
  makeFxNodeId,
  makeRefSubjectId,
  makeSourceLocationId,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  planSourceAnalyzerResponse,
  type CompilerSourceAnalyzerResponse,
} from "./sourceAnalyzer.js";

describe("compiler source analyzer planning", () => {
  it("maps source-map resource aliases to compiler component facts", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "export const Counter = html`<button>${count}</button>`;",
    ].join("\n");
    const componentStart = sourceText.indexOf("html`");
    const componentPosition = devtoolsPositionAt(sourceText, componentStart);
    const response = planSourceAnalyzerResponse({
      artifacts: [
        {
          moduleId: "src/Counter.tsx",
          resource: "/@fs/workspace/src/Counter.tsx",
          resourceAliases: ["file:///workspace/src/Counter.tsx"],
          sourceText,
        },
      ],
      request: {
        column: componentPosition.column,
        line: componentPosition.line,
        requestedAt: 100,
        resource: "file:///workspace/src/Counter.tsx",
      },
    });

    expect(response).toEqual({
      _tag: "SourceFacts",
      facts: [
        {
          _tag: "ComponentDefinition",
          componentId: makeComponentId("src/Counter.tsx#Counter"),
          displayName: "Counter",
          sourceLocationId: makeSourceLocationId(`src/Counter.tsx:${componentStart}`),
        },
      ],
      requestedAt: 100,
      resource: "file:///workspace/src/Counter.tsx",
    });
    expect(decodeDevtoolsPayload(SourceAnalyzerResponseSchema, response)).toEqual(response);
  });

  it("returns explicit unavailable state when no compiler artifact matches", () => {
    const response = planSourceAnalyzerResponse({
      artifacts: [],
      request: {
        requestedAt: 101,
        resource: "file:///workspace/src/Missing.tsx",
      },
    });

    expect(response).toEqual({
      _tag: "Unavailable",
      reason: "No compiler artifact matched file:///workspace/src/Missing.tsx.",
      requestedAt: 101,
    });
  });

  it("maps selected route services and closures to protocol source facts", () => {
    const sourceText = [
      "// Count appears before the declaration and should not win source mapping.",
      'const Count = RefSubject.Service<number>()("@app/Count");',
      "export const route = () => html`<button>${Count}</button>`;",
    ].join("\n");
    const countStart = sourceText.indexOf("Count =");
    const routeStart = sourceText.indexOf("route =");
    const response = planSourceAnalyzerResponse({
      artifacts: [
        {
          moduleId: "src/routes/counter.ts",
          resource: "src/routes/counter.ts",
          sourceText,
        },
      ],
      range: {
        end: devtoolsPositionAt(sourceText, routeStart + "route".length),
        start: devtoolsPositionAt(sourceText, countStart),
      },
      request: {
        requestedAt: 102,
        resource: "src/routes/counter.ts",
      },
    });

    expect(response).toEqual({
      _tag: "SourceFacts",
      facts: [
        {
          _tag: "RefSubjectDefinition",
          refSubjectId: makeRefSubjectId("@app/Count"),
          sourceLocationId: makeSourceLocationId(`src/routes/counter.ts:${countStart}`),
        },
        {
          _tag: "FxDefinition",
          fxNodeId: makeFxNodeId("src/routes/counter.ts#closure:route"),
          sourceLocationId: makeSourceLocationId(`src/routes/counter.ts:${routeStart}`),
        },
      ],
      requestedAt: 102,
      resource: "src/routes/counter.ts",
    });
  });

  it("can convert one-based compiler/editor positions at the planner boundary", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "export const Counter = html`<button>${count}</button>`;",
    ].join("\n");
    const componentStart = sourceText.indexOf("html`");
    const componentPosition = oneBasedPositionAt(sourceText, componentStart);
    const response = planSourceAnalyzerResponse({
      artifacts: [
        {
          moduleId: "src/Counter.tsx",
          resource: "src/Counter.tsx",
          sourceText,
        },
      ],
      positionBase: "one-based",
      request: {
        column: componentPosition.column,
        line: componentPosition.line,
        requestedAt: 103,
        resource: "src/Counter.tsx",
      },
    });

    expect(response).toMatchObject({
      _tag: "SourceFacts",
      facts: [
        {
          sourceLocationId: makeSourceLocationId(`src/Counter.tsx:${componentStart}`),
        },
      ],
    });
  });

  it("preserves protocol response inference", () => {
    const response = planSourceAnalyzerResponse({
      artifacts: [],
      request: { requestedAt: 104, resource: "typed:missing" },
    });

    expectTypeOf(response).toExtend<CompilerSourceAnalyzerResponse>();
  });
});

function oneBasedPositionAt(sourceText: string, offset: number) {
  const lines = sourceText.slice(0, offset).split("\n");
  return { column: lines.at(-1)!.length + 1, line: lines.length };
}

function devtoolsPositionAt(sourceText: string, offset: number) {
  const position = oneBasedPositionAt(sourceText, offset);
  return { column: position.column - 1, line: position.line - 1 };
}
