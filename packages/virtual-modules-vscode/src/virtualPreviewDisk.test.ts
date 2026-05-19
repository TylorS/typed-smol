import { existsSync, readFileSync, rmSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getVirtualPreviewPath,
  getVirtualPreviewSource,
  VIRTUAL_PREVIEW_RELATIVE,
  writeVirtualPreviewAndGetPath,
} from "./virtualPreviewDisk.js";

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

  it("normalizes preview source imports relative to the preview file path", () => {
    const projectRoot = resolve("/workspace/app");
    const source = getVirtualPreviewSource(
      projectRoot,
      "/workspace/app/src/routes/entry.ts",
      "/workspace/app/src/__virtual_router_hash.ts",
      'import { route } from "./route";\nexport { route };',
    );

    expect(source).toContain('from "../../../src/routes/route"');
  });

  it("materializes nested virtual imports next to the parent preview artifact", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "typed-vscode-preview-"));
    try {
      const importer = join(projectRoot, "src", "browser.ts");
      const parentVirtualFile = join(
        projectRoot,
        VIRTUAL_PREVIEW_RELATIVE,
        "typed-browser",
        "browser.ts",
      );
      const routesVirtualFile = join(projectRoot, VIRTUAL_PREVIEW_RELATIVE, "router", "routes.ts");

      const parentPath = writeVirtualPreviewAndGetPath(
        projectRoot,
        importer,
        parentVirtualFile,
        'import Routes0 from "router:./routes";\nexport const Routes = Routes0;\n',
        (moduleId) =>
          moduleId === "router:./routes"
            ? {
                virtualFileName: routesVirtualFile,
                sourceText: 'import { route } from "./routes/index.js";\nexport default route;\n',
              }
            : undefined,
      );

      const parentSource = readFileSync(parentPath, "utf8");
      const nestedPath = join(dirname(parentPath), "../router/routes.ts");
      expect(parentSource).toContain('from "../router/routes.js"');
      expect(existsSync(nestedPath)).toBe(true);
      expect(readFileSync(nestedPath, "utf8")).toContain('from "../../../../src/routes/index.js"');
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
