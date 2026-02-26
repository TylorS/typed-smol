/**
 * Unit tests for extractHttpApiLiterals.
 */
import { describe, expect, it } from "vitest";
import {
  extractPrefixFromConvention,
  getPathFromRouteType,
} from "./extractHttpApiLiterals.js";

describe("getPathFromRouteType", () => {
  it("extracts from literal type", () => {
    const type = { kind: "literal", text: "/api" };
    expect(getPathFromRouteType(type as never)).toBe("/api");
  });

  it("extracts from literal without leading slash", () => {
    const type = { kind: "literal", text: "api" };
    expect(getPathFromRouteType(type as never)).toBe("/api");
  });

  it("extracts from object with path property", () => {
    const type = {
      kind: "object",
      properties: [{ name: "path", type: { kind: "literal", text: "/users" } }],
    };
    expect(getPathFromRouteType(type as never)).toBe("/users");
  });

  it("extracts from reference with type args (Route<P>)", () => {
    const type = {
      kind: "reference",
      typeArguments: [{ kind: "literal", text: "/status" }],
    };
    expect(getPathFromRouteType(type as never)).toBe("/status");
  });

  it("returns null for unknown shape", () => {
    expect(getPathFromRouteType({ kind: "unknown" } as never)).toBeNull();
  });
});

describe("extractPrefixFromConvention", () => {
  it("returns ok with empty path when export absent", () => {
    const snapshot = {
      filePath: "/x/_api.ts",
      exports: [],
    };
    const api = {
      isAssignableTo: () => true,
    };
    const result = extractPrefixFromConvention(
      snapshot as never,
      api as never,
      "prefix",
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.path).toBe("");
  });

  it("returns ok with path when export present and assignable", () => {
    const snapshot = {
      filePath: "/x/_api.ts",
      exports: [
        {
          name: "prefix",
          type: { kind: "literal", text: "/api" },
        },
      ],
    };
    const api = {
      isAssignableTo: () => true,
    };
    const result = extractPrefixFromConvention(
      snapshot as never,
      api as never,
      "prefix",
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.path).toBe("/api");
  });

  it("returns not ok when not assignable to Route", () => {
    const snapshot = {
      filePath: "/x/_api.ts",
      exports: [
        {
          name: "prefix",
          type: { kind: "literal", text: "/api" },
        },
      ],
    };
    const api = {
      isAssignableTo: () => false,
    };
    const result = extractPrefixFromConvention(
      snapshot as never,
      api as never,
      "prefix",
    );
    expect(result.ok).toBe(false);
  });
});
