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
});
