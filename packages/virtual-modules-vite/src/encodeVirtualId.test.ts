import { describe, expect, it } from "vitest";
import {
  encodeVirtualId,
  decodeVirtualId,
  isVirtualId,
} from "./encodeVirtualId.js";

describe("encodeVirtualId / decodeVirtualId", () => {
  it("round-trips id and importer", () => {
    const id = "virtual:config";
    const importer = "/Users/app/src/main.ts";
    const encoded = encodeVirtualId(id, importer);
    expect(isVirtualId(encoded)).toBe(true);
    const decoded = decodeVirtualId(encoded);
    expect(decoded).toEqual({ id, importer });
  });

  it("returns null for non-virtual id", () => {
    expect(decodeVirtualId("/some/path.ts")).toBeNull();
    expect(isVirtualId("/some/path.ts")).toBe(false);
  });

  it("handles Windows-style paths", () => {
    const id = "virtual:env";
    const importer = "C:\\Users\\app\\src\\main.ts";
    const encoded = encodeVirtualId(id, importer);
    const decoded = decodeVirtualId(encoded);
    expect(decoded).toEqual({ id, importer });
  });
});
