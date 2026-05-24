import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import { Serializable } from "./Serializable.js";

describe("Serializable", () => {
  it("wraps explicit Effect Schema descriptors without changing the schema", () => {
    const User = Schema.Struct({ name: Schema.String });
    const descriptor = Serializable.schema(User, { id: "User" });

    expect(descriptor).toEqual({
      _tag: "Schema",
      id: "User",
      schema: User,
    });
  });

  it("creates generated descriptors for compiler-owned schema plans", () => {
    const plan = {
      version: 1,
      typeId: "User",
      source: {
        fileName: "/app/routes/users.ts",
        exportName: "User",
      },
      fingerprint: "schema:user:v1",
    } as const satisfies Serializable.GeneratedSchemaPlan;

    const descriptor = Serializable.generated("User", plan);

    expect(descriptor).toEqual({
      _tag: "Generated",
      id: "User",
      plan,
    });
  });

  it("prefers a user-provided schema over generated schema work", () => {
    const User = Schema.Struct({ name: Schema.String });
    const plan = {
      version: 1,
      typeId: "GeneratedUser",
    } as const satisfies Serializable.GeneratedSchemaPlan;

    expect(Serializable.fromSchemaOrGenerated(User, "User", plan)).toEqual({
      _tag: "Schema",
      id: "User",
      schema: User,
    });
  });

  it("falls back to a generated descriptor when no user schema is provided", () => {
    const plan = {
      version: 1,
      typeId: "GeneratedUser",
    } as const satisfies Serializable.GeneratedSchemaPlan;

    expect(Serializable.fromSchemaOrGenerated(undefined, "User", plan)).toEqual({
      _tag: "Generated",
      id: "User",
      plan,
    });
  });

  it("wraps continuation descriptors without changing capture descriptors", () => {
    const descriptor = Serializable.generated("User", {
      version: 1,
      typeId: "User",
      fingerprint: "schema:user",
    });

    expect(
      Serializable.continuation({
        _tag: "Continuation",
        captures: [{ descriptor, id: "user", kind: "serializable-value" }],
        fingerprint: "continuation:user",
        id: "/src/routes/profile.ts#closure:route",
      }),
    ).toEqual({
      _tag: "Continuation",
      captures: [{ descriptor, id: "user", kind: "serializable-value" }],
      fingerprint: "continuation:user",
      id: "/src/routes/profile.ts#closure:route",
    });
  });

  it("keeps continuation descriptors compatible with data-attribute object serialization", () => {
    const descriptor = Serializable.continuation({
      _tag: "Continuation",
      captures: [
        {
          descriptor: Serializable.generated("Count", {
            version: 1,
            typeId: "Count",
            fingerprint: "schema:count",
          }),
          id: "count",
          kind: "inline-refsubject-migration",
        },
      ],
      fingerprint: "continuation:count",
      id: "/src/routes/counter.ts#closure:render",
    });

    expect(JSON.parse(JSON.stringify(descriptor))).toEqual(descriptor);
  });

  it("builds serializable continuation descriptors from capture descriptors", () => {
    const descriptor = Serializable.continuation(
      "/src/routes/profile.ts#closure:route",
      [
        Serializable.capture(
          "user",
          "serializable-value",
          Serializable.generated("User", {
            version: 1,
            typeId: "User",
            fingerprint: "schema:user",
          }),
        ),
      ],
      { fingerprint: "continuation:user" },
    );

    expect(JSON.stringify(descriptor, null, 2)).toMatchInlineSnapshot(`
      "{
        "_tag": "Continuation",
        "id": "/src/routes/profile.ts#closure:route",
        "captures": [
          {
            "id": "user",
            "kind": "serializable-value",
            "descriptor": {
              "_tag": "Generated",
              "id": "User",
              "plan": {
                "version": 1,
                "typeId": "User",
                "fingerprint": "schema:user"
              }
            }
          }
        ],
        "fingerprint": "continuation:user"
      }"
    `);
  });
});
