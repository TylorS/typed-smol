import { describe, expect, it } from "vitest";
import {
  classifyHttpApiFileRole,
  compareHttpApiPathOrder,
  HTTPAPI_DIRECTORY_COMPANION_FILES,
  HTTPAPI_ENDPOINT_COMPANION_SUFFIXES,
  HTTPAPI_SCRIPT_EXTENSION_SET,
  isHttpApiScriptExtension,
  normalizeHttpApiRelativePath,
  sortHttpApiPaths,
} from "./internal/httpapiFileRoles.js";

describe("httpapiFileRoles", () => {
  describe("normalizeHttpApiRelativePath", () => {
    it("strips leading ./ and normalizes slashes", () => {
      expect(normalizeHttpApiRelativePath("./users/list.ts")).toBe("users/list.ts");
      expect(normalizeHttpApiRelativePath("users\\list.ts")).toBe("users/list.ts");
    });
  });

  describe("isHttpApiScriptExtension", () => {
    it("accepts .ts, .tsx, .js, .jsx, .mts, .cts, .mjs, .cjs", () => {
      expect(isHttpApiScriptExtension(".ts")).toBe(true);
      expect(isHttpApiScriptExtension(".TS")).toBe(true);
      expect(isHttpApiScriptExtension(".js")).toBe(true);
      expect(isHttpApiScriptExtension(".mts")).toBe(true);
      expect(isHttpApiScriptExtension(".cjs")).toBe(true);
    });
    it("rejects .d.ts and others", () => {
      expect(isHttpApiScriptExtension(".d.ts")).toBe(false);
      expect(isHttpApiScriptExtension(".json")).toBe(false);
    });
  });

  describe("classifyHttpApiFileRole", () => {
    it("classifies _api.ts at root as api_root", () => {
      const r = classifyHttpApiFileRole("_api.ts");
      expect(r).toEqual({ role: "api_root", path: "_api.ts" });
    });
    it("classifies _api.ts in subdir as unsupported_reserved", () => {
      const r = classifyHttpApiFileRole("users/_api.ts");
      expect(r.role).toBe("unsupported_reserved");
      expect("diagnosticCode" in r && r.diagnosticCode).toBe("HTTPAPI-ROLE-004");
    });
    it("classifies _group.ts as group_override", () => {
      expect(classifyHttpApiFileRole("_group.ts")).toEqual({
        role: "group_override",
        path: "_group.ts",
      });
      expect(classifyHttpApiFileRole("users/_group.ts")).toEqual({
        role: "group_override",
        path: "users/_group.ts",
      });
    });
    it("classifies directory companions", () => {
      for (const f of HTTPAPI_DIRECTORY_COMPANION_FILES) {
        const r = classifyHttpApiFileRole(`users/${f}`);
        expect(r.role).toBe("directory_companion");
        expect("kind" in r && r.kind).toBe(f);
      }
    });
    it("classifies endpoint primary (no companion suffix)", () => {
      const r = classifyHttpApiFileRole("users/list.ts");
      expect(r).toEqual({ role: "endpoint_primary", path: "users/list.ts" });
    });
    it("classifies endpoint companions", () => {
      for (const suffix of HTTPAPI_ENDPOINT_COMPANION_SUFFIXES) {
        const r = classifyHttpApiFileRole(`users/list${suffix}.ts`);
        expect(r.role).toBe("endpoint_companion");
        expect("kind" in r && r.kind).toBe(suffix);
        expect("endpointStem" in r && r.endpointStem).toBe("list");
      }
    });
    it("rejects .d.ts as unsupported_reserved", () => {
      const r = classifyHttpApiFileRole("list.d.ts");
      expect(r.role).toBe("unsupported_reserved");
      expect("diagnosticCode" in r && r.diagnosticCode).toBe("HTTPAPI-ROLE-001");
    });
    it("rejects underscore-prefixed non-matrix files as unsupported_reserved", () => {
      const r = classifyHttpApiFileRole("_unknown.ts");
      expect(r.role).toBe("unsupported_reserved");
      expect("diagnosticCode" in r && r.diagnosticCode).toBe("HTTPAPI-ROLE-006");
    });
    it("rejects endpoint companion with empty base name", () => {
      const r = classifyHttpApiFileRole(".openapi.ts");
      expect(r.role).toBe("unsupported_reserved");
    });
  });

  describe("sortHttpApiPaths / compareHttpApiPathOrder", () => {
    it("sorts deterministically by normalized path", () => {
      const paths = ["z/endpoint.ts", "a/endpoint.ts", "users/list.ts", "_api.ts"];
      expect(sortHttpApiPaths(paths)).toEqual([
        "_api.ts",
        "a/endpoint.ts",
        "users/list.ts",
        "z/endpoint.ts",
      ]);
    });
    it("compareHttpApiPathOrder is stable", () => {
      expect(compareHttpApiPathOrder("a", "b")).toBeLessThan(0);
      expect(compareHttpApiPathOrder("b", "a")).toBeGreaterThan(0);
      expect(compareHttpApiPathOrder("a", "a")).toBe(0);
    });
  });
});
