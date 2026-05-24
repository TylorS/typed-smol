import type { TypeInfoFileSnapshot, TypeNode } from "@typed/virtual-modules";
import { describe, expect, it } from "vitest";
import type { HttpApiDescriptorTree } from "./httpapiDescriptorTree.js";
import { buildHttpApiOpenApiPlan } from "./httpapiOpenApiPlan.js";

describe("buildHttpApiOpenApiPlan", () => {
  it("uses configured OpenAPI defaults when no API root overrides them", () => {
    const plan = buildHttpApiOpenApiPlan({
      tree: emptyTree,
      snapshotsByRelativePath: new Map(),
      defaults: {
        annotations: { title: "Configured API" },
        generation: { additionalProperties: false },
        exposure: { jsonPath: "/openapi.json", scalar: { path: "/docs" } },
      },
    });

    expect(plan.api).toMatchInlineSnapshot(`
      {
        "annotations": {
          "title": "Configured API",
        },
        "exposure": {
          "jsonPath": "/openapi.json",
          "scalar": {
            "path": "/docs",
          },
        },
        "generation": {
          "additionalProperties": false,
        },
      }
    `);
    expect(plan.diagnostics).toEqual([]);
  });

  it("lets source OpenAPI config override configured defaults", () => {
    const plan = buildHttpApiOpenApiPlan({
      tree: {
        ...emptyTree,
        conventions: [{ kind: "api_root", path: "_api.ts" }],
      },
      snapshotsByRelativePath: new Map([["_api.ts", snapshot(openapiType)]]),
      defaults: {
        annotations: { title: "Configured API", version: "1.0.0" },
        generation: { additionalProperties: false },
        exposure: { jsonPath: "/openapi.json", scalar: { path: "/docs", source: "inline" } },
      },
    });

    expect(plan.api).toMatchInlineSnapshot(`
      {
        "annotations": {
          "title": "Source API",
          "version": "1.0.0",
        },
        "exposure": {
          "jsonPath": "/source-openapi.json",
          "scalar": {
            "path": "/source-docs",
            "source": "inline",
          },
        },
        "generation": {
          "additionalProperties": true,
        },
      }
    `);
    expect(plan.diagnostics).toEqual([]);
  });
});

const emptyTree: HttpApiDescriptorTree = {
  type: "api_root",
  dirPath: "",
  children: [],
  conventions: [],
  diagnostics: [],
};

const literal = (text: string): TypeNode => ({ kind: "literal", text });

const object = (properties: Record<string, TypeNode>): TypeNode => ({
  kind: "object",
  text: "{}",
  properties: Object.entries(properties).map(([name, type]) => ({
    name,
    optional: false,
    readonly: true,
    type,
  })),
});

const openapiType = object({
  annotations: object({ title: literal('"Source API"') }),
  generation: object({ additionalProperties: literal("true") }),
  exposure: object({
    jsonPath: literal('"/source-openapi.json"'),
    scalar: object({ path: literal('"/source-docs"') }),
  }),
});

function snapshot(type: TypeNode): TypeInfoFileSnapshot {
  return {
    filePath: "/project/src/api/_api.ts",
    exports: [{ name: "openapi", type }],
  };
}
