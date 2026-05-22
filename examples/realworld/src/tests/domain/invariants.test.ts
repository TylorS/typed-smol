import { Option } from "effect";
import { describe, expect, it } from "vitest";
import { applyTagUpdate, canEditArticle, normalizeTagList } from "../../domain/Article.js";
import { parseAuthorizationHeader } from "../../domain/Auth.js";
import { toSlugBase, uniqueSlug } from "../../domain/Ids.js";
import { toOffset } from "../../domain/Pagination.js";
import { normalizeNullableProfileField } from "../../domain/User.js";

const unwrap = <A>(option: Option.Option<A>): A => {
  if (Option.isSome(option)) return option.value;
  throw new Error("Expected Some");
};

describe("RealWorld domain invariants", () => {
  it("generates stable unique slug candidates from article titles", () => {
    expect(toSlugBase(" Typed RealWorld: Effect + SQLite! ")).toBe("typed-realworld-effect-sqlite");
    expect(toSlugBase("!!!")).toBe("article");
    expect(uniqueSlug("Typed RealWorld", [])).toBe("typed-realworld");
    expect(uniqueSlug("Typed RealWorld", ["typed-realworld", "typed-realworld-2"])).toBe(
      "typed-realworld-3",
    );
  });

  it("preserves tag order and distinguishes preserve vs removal updates", () => {
    expect(normalizeTagList([" typed ", "", "effect", "typed", "sqlite"])).toEqual([
      "typed",
      "effect",
      "sqlite",
    ]);
    expect(applyTagUpdate(["typed", "effect"], undefined)).toEqual(["typed", "effect"]);
    expect(applyTagUpdate(["typed", "effect"], [])).toEqual([]);
  });

  it("normalizes nullable profile fields", () => {
    expect(normalizeNullableProfileField(undefined)).toBeNull();
    expect(normalizeNullableProfileField(null)).toBeNull();
    expect(normalizeNullableProfileField("")).toBeNull();
    expect(normalizeNullableProfileField("   ")).toBeNull();
    expect(normalizeNullableProfileField("  reader bio  ")).toBe("reader bio");
  });

  it("parses only RealWorld Token authorization headers", () => {
    expect(unwrap(parseAuthorizationHeader("Token abc123"))).toBe("abc123");
    expect(Option.isNone(parseAuthorizationHeader(undefined))).toBe(true);
    expect(Option.isNone(parseAuthorizationHeader("Bearer abc123"))).toBe(true);
    expect(Option.isNone(parseAuthorizationHeader("Token "))).toBe(true);
  });

  it("maps UI pages to zero-based API offsets", () => {
    expect(toOffset(1)).toBe(0);
    expect(toOffset(2)).toBe(10);
    expect(toOffset(5, 20)).toBe(80);
  });

  it("checks author ownership for article mutations", () => {
    expect(canEditArticle("author", "author")).toBe(true);
    expect(canEditArticle("reader", "author")).toBe(false);
    expect(canEditArticle(null, "author")).toBe(false);
  });
});
