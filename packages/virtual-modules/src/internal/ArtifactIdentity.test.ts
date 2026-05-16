import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createArtifactPaths,
  createVirtualLogicalIdentity,
  isVirtualLogicalIdentity,
} from "../index.js";
import { toPosixPath, VIRTUAL_NODE_MODULES_RELATIVE } from "./path.js";

describe("ArtifactIdentity", () => {
  it("creates a stable typed-virtual logical identity without physical path segments", () => {
    const params = {
      id: "virtual:routes",
      importer: "/workspace/app/src/root.ts",
    };

    const first = createVirtualLogicalIdentity(
      "typed/app",
      "virtual:routes::/workspace/app/src/root.ts",
      params,
    );
    const second = createVirtualLogicalIdentity(
      "typed/app",
      "virtual:routes::/workspace/app/src/root.ts",
      params,
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^typed-virtual:\/\/0\/typed-app\/[a-f0-9]{16}\.ts$/);
    expect(first).not.toContain("/workspace/app");
    expect(first).not.toContain("node_modules/.typed/virtual");
    expect(isVirtualLogicalIdentity(first)).toBe(true);
  });

  it("uses a safe plugin segment for empty or path-special plugin names", () => {
    const identity = createVirtualLogicalIdentity(".", "routes-key", {
      id: "virtual:routes",
      importer: "/workspace/app/src/root.ts",
    });

    expect(identity).toMatch(/^typed-virtual:\/\/0\/virtual\/[a-f0-9]{16}\.ts$/);
    expect(isVirtualLogicalIdentity(identity)).toBe(true);
    expect(() => createArtifactPaths("/workspace/app", identity)).not.toThrow();
  });

  it("maps a logical identity to deterministic source and manifest artifact paths", () => {
    const projectRoot = join("/workspace", "app");
    const logicalIdentity = createVirtualLogicalIdentity("typed/app", "routes-key", {
      id: "virtual:routes",
      importer: "/workspace/app/src/root.ts",
    });

    const first = createArtifactPaths(projectRoot, logicalIdentity);
    const second = createArtifactPaths(projectRoot, logicalIdentity);

    expect(first).toEqual(second);
    expect(first.logicalIdentity).toBe(logicalIdentity);
    expect(first.sourcePath).toMatch(
      /\/node_modules\/\.typed\/virtual\/typed-app\/[a-f0-9]{16}\.ts$/,
    );
    expect(
      first.sourcePath.startsWith(toPosixPath(resolve(projectRoot, VIRTUAL_NODE_MODULES_RELATIVE))),
    ).toBe(true);
    expect(first.manifestPath).toBe(first.sourcePath.replace(/\.ts$/, ".manifest.json"));
    expect(first.sourcePath).not.toBe(logicalIdentity);
    expect(first.manifestPath).not.toBe(logicalIdentity);
  });
});
