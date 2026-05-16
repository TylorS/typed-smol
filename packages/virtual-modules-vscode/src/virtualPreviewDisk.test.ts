import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getVirtualPreviewPath, VIRTUAL_PREVIEW_RELATIVE } from "./virtualPreviewDisk.js";

describe("virtualPreviewDisk", () => {
  it("preserves absolute virtual artifact paths already under the shared preview root", () => {
    const projectRoot = resolve("/workspace/app");
    const artifactPath = join(projectRoot, VIRTUAL_PREVIEW_RELATIVE, "plugin", "artifact.ts");

    expect(getVirtualPreviewPath(projectRoot, artifactPath)).toBe(resolve(artifactPath));
  });

  it("keeps legacy virtual filenames under the shared preview root", () => {
    const projectRoot = resolve("/workspace/app");

    expect(getVirtualPreviewPath(projectRoot, "/workspace/app/src/__virtual_plugin_hash.ts")).toBe(
      join(projectRoot, VIRTUAL_PREVIEW_RELATIVE, "__virtual_plugin_hash.ts"),
    );
  });
});
