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

  it("maps exported Component declarations and aliases to compiler component facts", () => {
    const sourceText = [
      'import type { Component } from "./Reactive.js";',
      "export function Button<const Opts>(options: Opts): Component<Opts> {",
      "  return {} as Component<Opts>;",
      "}",
      "export { Button as Disclosure };",
    ].join("\n");
    const response = planSourceAnalyzerResponse({
      artifacts: [
        {
          moduleId: "src/Disclosure.ts",
          resource: "src/Disclosure.ts",
          sourceText,
        },
      ],
      request: {
        requestedAt: 105,
        resource: "src/Disclosure.ts",
      },
    });

    expect(response).toMatchInlineSnapshot(`
      {
        "_tag": "SourceFacts",
        "facts": [
          {
            "_tag": "ComponentDefinition",
            "componentId": "cmp:src/Disclosure.ts#Button",
            "displayName": "Button",
            "sourceLocationId": "src:src/Disclosure.ts:64",
          },
          {
            "_tag": "ComponentDefinition",
            "componentId": "cmp:src/Disclosure.ts#Disclosure",
            "displayName": "Disclosure",
            "sourceLocationId": "src:src/Disclosure.ts:170",
          },
        ],
        "requestedAt": 105,
        "resource": "src/Disclosure.ts",
      }
    `);
  });

  it("does not duplicate exported html component definitions", () => {
    const sourceText = [
      'import type { Component } from "./Reactive.js";',
      'import { html } from "@typed/template";',
      "export const Counter: Component = html`<button>${count}</button>`;",
    ].join("\n");
    const counterStart = sourceText.indexOf("Counter");
    const response = planSourceAnalyzerResponse({
      artifacts: [
        {
          moduleId: "src/Counter.ts",
          resource: "src/Counter.ts",
          sourceText,
        },
      ],
      request: {
        requestedAt: 106,
        resource: "src/Counter.ts",
      },
    });

    expect(response).toEqual({
      _tag: "SourceFacts",
      facts: [
        {
          _tag: "ComponentDefinition",
          componentId: makeComponentId("src/Counter.ts#Counter"),
          displayName: "Counter",
          sourceLocationId: makeSourceLocationId(`src/Counter.ts:${counterStart}`),
        },
      ],
      requestedAt: 106,
      resource: "src/Counter.ts",
    });
  });

  it("matches exported html components from the template token without duplicating facts", () => {
    const sourceText = [
      'import type { Component } from "./Reactive.js";',
      'import { html } from "@typed/template";',
      "export const Counter: Component = html`<button>${count}</button>`;",
    ].join("\n");
    const counterStart = sourceText.indexOf("Counter");
    const templateStart = sourceText.indexOf("html`");
    const templatePosition = devtoolsPositionAt(sourceText, templateStart);
    const response = planSourceAnalyzerResponse({
      artifacts: [
        {
          moduleId: "src/Counter.ts",
          resource: "src/Counter.ts",
          sourceText,
        },
      ],
      request: {
        column: templatePosition.column,
        line: templatePosition.line,
        requestedAt: 107,
        resource: "src/Counter.ts",
      },
    });

    expect(response).toEqual({
      _tag: "SourceFacts",
      facts: [
        {
          _tag: "ComponentDefinition",
          componentId: makeComponentId("src/Counter.ts#Counter"),
          displayName: "Counter",
          sourceLocationId: makeSourceLocationId(`src/Counter.ts:${counterStart}`),
        },
      ],
      requestedAt: 107,
      resource: "src/Counter.ts",
    });
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
