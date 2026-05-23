import { describe, expect, it } from "vitest";
import type { TypeNode } from "@typed/virtual-modules";
import {
  emitSerializableDescriptorSource,
  planSchemaFromTypeNode,
  schemaPlanFingerprint,
} from "./schemaPlan.js";

describe("schemaPlan", () => {
  it("plans primitive and literal TypeNodes", () => {
    const stringPlan = planSchemaFromTypeNode({
      typeId: "Name",
      node: primitive("string"),
    });
    const literalPlan = planSchemaFromTypeNode({
      typeId: "Role",
      node: literal('"admin"'),
    });

    expect(stringPlan).toMatchObject({
      ok: true,
      plan: {
        version: 1,
        typeId: "Name",
        root: { kind: "primitive", name: "string" },
      },
    });
    expect(literalPlan).toMatchObject({
      ok: true,
      plan: {
        version: 1,
        typeId: "Role",
        root: { kind: "literal", value: "admin" },
      },
    });
  });

  it("plans objects, optional fields, arrays, tuples, unions, and index signatures", () => {
    const user = planSchemaFromTypeNode({
      typeId: "User",
      node: {
        kind: "object",
        text: "User",
        properties: [
          property("roles", array(literal('"user"'))),
          property("id", primitive("string")),
          property("flags", tuple([primitive("boolean"), literal("1")])),
          property("status", union([literal('"pending"'), literal('"active"')]), {
            optional: true,
          }),
        ],
        indexSignature: {
          keyType: primitive("string"),
          readonly: true,
          valueType: primitive("number"),
        },
      },
    });

    expect(user).toMatchObject({
      ok: true,
      plan: {
        root: {
          kind: "object",
          properties: [
            { name: "flags", optional: false, node: { kind: "tuple" } },
            { name: "id", optional: false, node: { kind: "primitive", name: "string" } },
            { name: "roles", optional: false, node: { kind: "array" } },
            { name: "status", optional: true, node: { kind: "union" } },
          ],
          indexSignature: {
            key: "string",
            readonly: true,
            value: { kind: "primitive", name: "number" },
          },
        },
      },
    });
  });

  it("creates deterministic fingerprints independent of input property order", () => {
    const left = planSchemaFromTypeNode({
      typeId: "User",
      node: object([property("b", primitive("number")), property("a", primitive("string"))]),
    });
    const right = planSchemaFromTypeNode({
      typeId: "User",
      node: object([property("a", primitive("string")), property("b", primitive("number"))]),
    });

    expect(left.ok).toBe(true);
    expect(right.ok).toBe(true);
    if (!left.ok || !right.ok) return;

    expect(schemaPlanFingerprint(left.plan)).toBe(schemaPlanFingerprint(right.plan));
    expect(left.plan).toEqual(right.plan);
  });

  it("fails closed with diagnostics for unsupported TypeNode shapes", () => {
    const result = planSchemaFromTypeNode({
      typeId: "User",
      fileName: "/app/routes/users.ts",
      node: object([property("onClick", fn())]),
      span: { start: 10, end: 17 },
    });

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        {
          code: "TYPED-SERIALIZATION-001",
          fileName: "/app/routes/users.ts",
          message: "Cannot generate Schema for User.onClick: function types are not serializable",
          severity: "error",
          source: "compiler",
          span: { start: 10, end: 17 },
        },
      ],
    });
  });

  it("emits generated descriptor source that references the public app API", () => {
    const result = planSchemaFromTypeNode({
      typeId: "User",
      node: object([property("id", primitive("string"))]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(emitSerializableDescriptorSource(result.plan, "UserSerializable")).toBe(
      [
        'import { Serializable } from "@typed/app";',
        "",
        "export const UserSerializable = Serializable.generated(",
        '  "User",',
        "  {",
        "    version: 1,",
        '    typeId: "User",',
        `    fingerprint: ${JSON.stringify(result.plan.fingerprint)},`,
        "  },",
        ");",
      ].join("\n"),
    );
  });
});

function primitive(text: string): TypeNode {
  return { kind: "primitive", text };
}

function literal(text: string): TypeNode {
  return { kind: "literal", text };
}

function array(element: TypeNode): TypeNode {
  return { kind: "array", text: `${element.text}[]`, elements: [element] };
}

function tuple(elements: readonly TypeNode[]): TypeNode {
  return { kind: "tuple", text: "tuple", elements };
}

function union(elements: readonly TypeNode[]): TypeNode {
  return { kind: "union", text: "union", elements };
}

function object(properties: readonly TypeNodeProperty[]): TypeNode {
  return { kind: "object", text: "object", properties };
}

function property(
  name: string,
  type: TypeNode,
  options: { readonly optional?: boolean } = {},
): TypeNodeProperty {
  return {
    name,
    optional: options.optional ?? false,
    readonly: true,
    type,
  };
}

function fn(): TypeNode {
  return {
    kind: "function",
    text: "() => void",
    parameters: [],
    returnType: primitive("void"),
  };
}

type TypeNodeProperty = Extract<TypeNode, { kind: "object" }>["properties"][number];
