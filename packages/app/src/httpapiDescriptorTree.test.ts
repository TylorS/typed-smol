import { describe, expect, it } from "vitest";
import {
  buildHttpApiDescriptorTree,
  isPathlessDirectorySegment,
} from "./internal/httpapiDescriptorTree.js";
import { classifyHttpApiFileRole } from "./internal/httpapiFileRoles.js";

function rolesFromPaths(paths: string[]) {
  return paths.map((p) => classifyHttpApiFileRole(p));
}

describe("httpapiDescriptorTree", () => {
  describe("isPathlessDirectorySegment", () => {
    it("returns true for parenthesized segments", () => {
      expect(isPathlessDirectorySegment("(internal)")).toBe(true);
      expect(isPathlessDirectorySegment("(admin-internal)")).toBe(true);
    });
    it("returns false for normal segments", () => {
      expect(isPathlessDirectorySegment("users")).toBe(false);
      expect(isPathlessDirectorySegment("audits")).toBe(false);
    });
  });

  describe("buildHttpApiDescriptorTree", () => {
    it("builds empty root when no supported roles", () => {
      const tree = buildHttpApiDescriptorTree({
        roles: rolesFromPaths(["_api.ts"]),
      });
      expect(tree.type).toBe("api_root");
      expect(tree.dirPath).toBe("");
      expect(tree.children).toEqual([]);
      expect(tree.conventions).toHaveLength(1);
      expect(tree.conventions[0]).toEqual({ path: "_api.ts", kind: "api_root" });
      expect(tree.diagnostics).toHaveLength(0);
    });

    it("collects unsupported_reserved into diagnostics", () => {
      const tree = buildHttpApiDescriptorTree({
        roles: rolesFromPaths(["_api.ts", "list.d.ts"]),
      });
      expect(tree.diagnostics).toHaveLength(1);
      expect(tree.diagnostics[0].code).toBe("HTTPAPI-ROLE-001");
      expect(tree.diagnostics[0].path).toBe("list.d.ts");
    });

    it("builds one group with one endpoint", () => {
      const tree = buildHttpApiDescriptorTree({
        roles: rolesFromPaths(["_api.ts", "users/_group.ts", "users/list.ts"]),
      });
      expect(tree.children).toHaveLength(1);
      const group = tree.children[0];
      expect(group?.type).toBe("group");
      if (group?.type !== "group") return;
      expect(group.groupName).toBe("users");
      expect(group.dirPath).toBe("users");
      expect(group.children).toHaveLength(1);
      const ep = group.children[0];
      expect(ep?.type).toBe("endpoint");
      if (ep?.type !== "endpoint") return;
      expect(ep.path).toBe("users/list.ts");
      expect(ep.stem).toBe("list");
      expect(ep.companions).toHaveLength(0);
    });

    it("attaches endpoint companions to endpoint node", () => {
      const tree = buildHttpApiDescriptorTree({
        roles: rolesFromPaths([
          "users/list.ts",
          "users/list.openapi.ts",
          "users/list.dependencies.ts",
        ]),
      });
      const group = tree.children[0];
      expect(group?.type).toBe("group");
      if (group?.type !== "group") return;
      const ep = group.children[0];
      expect(ep?.type).toBe("endpoint");
      if (ep?.type !== "endpoint") return;
      expect(ep.companions).toHaveLength(2);
      const kinds = ep.companions.map((c) => c.kind).sort();
      expect(kinds).toEqual([".dependencies", ".openapi"]);
    });

    it("pathless directory does not create a named group", () => {
      const tree = buildHttpApiDescriptorTree({
        roles: rolesFromPaths([
          "(internal)/_prefix.ts",
          "(internal)/audits/_group.ts",
          "(internal)/audits/list.ts",
        ]),
      });
      expect(tree.children).toHaveLength(1);
      const pathless = tree.children[0];
      expect(pathless?.type).toBe("pathless_directory");
      if (pathless?.type !== "pathless_directory") return;
      expect(pathless.dirPath).toBe("(internal)");
      expect(pathless.conventions).toEqual([
        {
          path: "(internal)/_prefix.ts",
          kind: "_prefix.ts",
        },
      ]);
      expect(pathless.children).toHaveLength(1);
      const group = pathless.children[0];
      expect(group?.type).toBe("group");
      if (group?.type !== "group") return;
      expect(group.groupName).toBe("audits");
      expect(group.dirPath).toBe("(internal)/audits");
    });

    it("deterministic ordering of children", () => {
      const tree = buildHttpApiDescriptorTree({
        roles: rolesFromPaths(["z/z.ts", "a/a.ts", "users/list.ts"]),
      });
      const names = tree.children.map((c) =>
        c.type === "group" || c.type === "pathless_directory" ? c.dirPath : c.path,
      );
      expect(names).toEqual(["a", "users", "z"]);
    });
  });
});
