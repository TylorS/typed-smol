import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { loadResolverFromVmcConfig } from "./VmcResolverLoader.js";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "typed-vmc-resolver-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore cleanup failures in test temp dirs
      }
    }
  }
});

describe("loadResolverFromVmcConfig", () => {
  it("returns not-found when vmc config is missing", () => {
    const dir = createTempDir();
    const result = loadResolverFromVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("not-found");
  });

  it("uses exported resolver directly when provided", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `const resolver = {
  resolveModule: () => ({ status: "unresolved" }),
};

export default {
  resolver,
  plugins: ["./missing-plugin.cjs"],
};
`,
      "utf8",
    );

    const result = loadResolverFromVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;

    expect(result.resolver).toBeDefined();
    expect(result.pluginSpecifiers).toEqual(["./missing-plugin.cjs"]);
    expect(result.pluginLoadErrors).toHaveLength(0);
  });

  it("collects typeTargetSpecs from plugins when they declare them", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "file-plugin.cjs"),
      `module.exports = {
  name: "file-plugin",
  typeTargetSpecs: [
    { id: "Route", module: "@typed/router", exportName: "Route" },
    { id: "Effect", module: "effect", exportName: "Effect" },
  ],
  shouldResolve(id) {
    return id === "virtual:file";
  },
  build() {
    return "export const fileValue = 1;";
  },
};
`,
      "utf8",
    );
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `export default {
  plugins: ["./file-plugin.cjs"],
};
`,
      "utf8",
    );

    const result = loadResolverFromVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;

    expect(result.typeTargetSpecs).toBeDefined();
    expect(result.typeTargetSpecs).toHaveLength(2);
    expect(result.typeTargetSpecs?.[0]).toEqual({
      id: "Route",
      module: "@typed/router",
      exportName: "Route",
    });
  });

  it("builds a plugin-manager resolver from plugin entries", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "file-plugin.cjs"),
      `module.exports = {
  name: "file-plugin",
  shouldResolve(id) {
    return id === "virtual:file";
  },
  build() {
    return "export const fileValue = 1;";
  },
};
`,
      "utf8",
    );
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `const inlinePlugin = {
  name: "inline-plugin",
  shouldResolve: (id) => id === "virtual:inline",
  build: () => "export const inlineValue = 2;",
};

export default {
  plugins: ["./file-plugin.cjs", inlinePlugin],
};
`,
      "utf8",
    );

    const result = loadResolverFromVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;

    expect(result.pluginSpecifiers).toEqual(["./file-plugin.cjs"]);
    expect(result.pluginLoadErrors).toHaveLength(0);
    expect(result.resolver).toBeDefined();

    const fileResolution = result.resolver?.resolveModule({
      id: "virtual:file",
      importer: join(dir, "entry.ts"),
    });
    expect(fileResolution?.status).toBe("resolved");
    if (fileResolution?.status === "resolved") {
      expect(fileResolution.pluginName).toBe("file-plugin");
    }

    const inlineResolution = result.resolver?.resolveModule({
      id: "virtual:inline",
      importer: join(dir, "entry.ts"),
    });
    expect(inlineResolution?.status).toBe("resolved");
    if (inlineResolution?.status === "resolved") {
      expect(inlineResolution.pluginName).toBe("inline-plugin");
    }
  });

  it("collects plugin load errors and returns no resolver when all fail", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `export default {
  plugins: ["./missing-plugin.cjs"],
};
`,
      "utf8",
    );

    const result = loadResolverFromVmcConfig({ projectRoot: dir, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") return;

    expect(result.resolver).toBeUndefined();
    expect(result.pluginSpecifiers).toEqual(["./missing-plugin.cjs"]);
    expect(result.pluginLoadErrors).toHaveLength(1);
    expect(result.pluginLoadErrors[0]?.code).toBe("module-not-found");
  });
});
