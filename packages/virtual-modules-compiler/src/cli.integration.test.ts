/// <reference types="node" />
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  parseVirtualArtifactIndex,
  parseVirtualArtifactManifest,
  type VirtualArtifactIndex,
  type VirtualArtifactManifest,
} from "@typed/virtual-modules";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, "..", "dist", "cli.js");

const tempDirs: string[] = [];
const watchProcesses: ChildProcessWithoutNullStreams[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "vmc-integration-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  while (watchProcesses.length > 0) {
    const child = watchProcesses.pop();
    if (child) {
      await stopWatchProcess(child);
    }
  }
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
});

function runVmc(
  cwd: string,
  args: string[] = [],
): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync("node", [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 15_000,
  });
  return {
    exitCode: result.status ?? (result.signal ? 1 : 0),
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

interface RunningWatchProcess {
  readonly child: ChildProcessWithoutNullStreams;
  readonly output: () => string;
}

function startVmcWatch(cwd: string): RunningWatchProcess {
  const child = spawn("node", [cliPath, "--watch", "--noEmit"], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });
  watchProcesses.push(child);

  let output = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    output += chunk;
  });

  return {
    child,
    output: () => output,
  };
}

function waitForOutput(
  running: RunningWatchProcess,
  pattern: RegExp,
  timeoutMs = 15_000,
): Promise<string> {
  if (pattern.test(running.output())) {
    return Promise.resolve(running.output());
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${pattern} in:\n${running.output()}`));
    }, timeoutMs);
    const check = () => {
      if (pattern.test(running.output())) {
        cleanup();
        resolve(running.output());
      }
    };
    const onClose = () => {
      cleanup();
      reject(new Error(`vmc --watch exited before ${pattern} appeared:\n${running.output()}`));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      running.child.stdout.off("data", check);
      running.child.stderr.off("data", check);
      running.child.off("close", onClose);
    };

    running.child.stdout.on("data", check);
    running.child.stderr.on("data", check);
    running.child.on("close", onClose);
  });
}

async function stopWatchProcess(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;

  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 1_000);
    child.once("close", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

interface VmcFixtureOptions {
  readonly vmcConfig: string;
  readonly entrySource?: string;
}

function writeVmcFixture(dir: string, options: VmcFixtureOptions): void {
  const srcDir = join(dir, "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "Bundler",
        noEmit: true,
        skipLibCheck: true,
      },
      include: ["src"],
    }),
    "utf8",
  );
  writeFileSync(join(dir, "vmc.config.ts"), options.vmcConfig, "utf8");
  writeFileSync(
    join(srcDir, "entry.ts"),
    options.entrySource ??
      'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
    "utf8",
  );
}

function readArtifactSourcePaths(dir: string): string[] {
  return Object.values(readArtifactIndex(dir).artifacts).map((entry) => entry.generatedSourcePath);
}

function readArtifactIndex(dir: string): VirtualArtifactIndex {
  const indexPath = join(dir, "node_modules", ".typed", "virtual", "index.json");
  const index = parseVirtualArtifactIndex(JSON.parse(readFileSync(indexPath, "utf8")));
  expect(index.ok, index.ok ? "" : index.reason).toBe(true);
  if (!index.ok) throw new Error(index.reason);
  return index.index;
}

function readArtifactManifests(dir: string): VirtualArtifactManifest[] {
  return Object.values(readArtifactIndex(dir).artifacts).map((entry) => {
    const manifest = parseVirtualArtifactManifest(
      JSON.parse(readFileSync(entry.manifestPath, "utf8")),
    );
    expect(manifest.ok, manifest.ok ? "" : manifest.reason).toBe(true);
    if (!manifest.ok) throw new Error(manifest.reason);
    return manifest.manifest;
  });
}

describe("vmc CLI integration", () => {
  it("vmc init creates vmc.config.ts in project root", () => {
    const dir = createTempDir();

    const { exitCode, stdout, stderr } = runVmc(dir, ["init"]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Created .*vmc\.config\.ts/);

    const configPath = join(dir, "vmc.config.ts");
    const config = readFileSync(configPath, "utf8");
    expect(config).toContain("export default");
    expect(config).toContain("plugins:");
    expect(config).toContain("shouldResolve");
    expect(config).toContain("build");
  });

  it("vmc init refuses to overwrite existing config without --force", () => {
    const dir = createTempDir();
    const configPath = join(dir, "vmc.config.ts");
    writeFileSync(configPath, "export default {};\n", "utf8");

    const { exitCode, stdout } = runVmc(dir, ["init"]);
    expect(exitCode).toBe(1);
    expect(stdout).toMatch(/already exists/);
    expect(stdout).toMatch(/--force/);

    const config = readFileSync(configPath, "utf8");
    expect(config).toBe("export default {};\n");
  });

  it("vmc init --force overwrites existing config", () => {
    const dir = createTempDir();
    const configPath = join(dir, "vmc.config.ts");
    writeFileSync(configPath, "export default {};\n", "utf8");

    const { exitCode, stdout } = runVmc(dir, ["init", "--force"]);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Created/);

    const config = readFileSync(configPath, "utf8");
    expect(config).toContain("plugins:");
    expect(config).not.toBe("export default {};\n");
  });

  it("compiles project with virtual modules via vmc.config.ts", () => {
    const dir = createTempDir();
    const srcDir = join(dir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["src"],
      }),
      "utf8",
    );
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `export default {
  plugins: [{
    name: "virtual",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => "export interface Foo { n: number }",
  }],
};
`,
      "utf8",
    );
    writeFileSync(
      join(srcDir, "entry.ts"),
      'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
      "utf8",
    );

    const { exitCode, stderr } = runVmc(dir, ["--noEmit"]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
  });

  it("writes virtual module artifacts during compile", () => {
    const dir = createTempDir();
    writeVmcFixture(dir, {
      vmcConfig: `export default {
  plugins: [{
    name: "artifact-virtual",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => "export interface Foo { n: number }\\nexport type ArtifactMarker = 'generated';",
  }],
};
`,
    });

    const { exitCode, stderr } = runVmc(dir, ["--noEmit"]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);

    const artifactSources = readArtifactSourcePaths(dir);
    expect(artifactSources).toHaveLength(1);
    expect(artifactSources[0]).toContain(join("node_modules", ".typed", "virtual"));
    expect(readFileSync(artifactSources[0]!, "utf8")).toContain("ArtifactMarker");

    const [manifest] = readArtifactManifests(dir);
    expect(manifest).toBeDefined();
    expect(manifest!.generatedSourcePath).toBe(artifactSources[0]);
    expect(manifest!.sourceInputFingerprints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "file",
          name: realpathSync(join(dir, "src", "entry.ts")),
          hash: expect.stringMatching(/^sha256:/),
        }),
      ]),
    );
    expect(manifest!.pluginFingerprints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "config",
          name: "vmc.config.ts",
          hash: expect.stringMatching(/^sha256:/),
        }),
        expect.objectContaining({
          kind: "config",
          name: "vmc-resolver",
          hash: expect.stringMatching(/^sha256:/),
        }),
      ]),
    );
    expect(manifest!.compilerFingerprints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "typescript",
          name: "typescript",
          hash: expect.stringMatching(/^sha256:/),
        }),
        expect.objectContaining({
          kind: "tsconfig",
          name: "parsed-tsconfig",
          hash: expect.stringMatching(/^sha256:/),
        }),
      ]),
    );
  });

  it("writes virtual module artifacts during build mode", () => {
    const dir = createTempDir();
    writeVmcFixture(dir, {
      vmcConfig: `export default {
  plugins: [{
    name: "build-artifact",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => "export interface Foo { n: number }\\nexport type BuildMarker = 'generated';",
  }],
};
`,
    });

    const { exitCode, stderr } = runVmc(dir, ["--build", "--force"]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);

    const artifactSources = readArtifactSourcePaths(dir);
    expect(artifactSources).toHaveLength(1);
    expect(readFileSync(artifactSources[0]!, "utf8")).toContain("BuildMarker");
  });

  it("reuses generated artifacts on restart when fingerprints match", () => {
    const dir = createTempDir();
    const countPath = join(dir, "build-count.txt");
    writeFileSync(countPath, "0", "utf8");
    writeVmcFixture(dir, {
      vmcConfig: `import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const countPath = join(process.cwd(), "build-count.txt");

export default {
  plugins: [{
    name: "restart-cache",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => {
      const count = Number(readFileSync(countPath, "utf8"));
      if (count > 0) {
        throw new Error("plugin build should not run when artifact fingerprints match");
      }
      writeFileSync(countPath, String(count + 1), "utf8");
      return "export interface Foo { n: number }";
    },
  }],
};
`,
    });

    const first = runVmc(dir, ["--noEmit"]);
    expect(first.stderr).toBe("");
    expect(first.exitCode).toBe(0);
    expect(readFileSync(countPath, "utf8")).toBe("1");

    const second = runVmc(dir, ["--noEmit"]);
    expect(second.stderr).toBe("");
    expect(second.exitCode).toBe(0);
    expect(readFileSync(countPath, "utf8")).toBe("1");
  });

  it("rebuilds generated artifacts when the cached source is corrupt", () => {
    const dir = createTempDir();
    const countPath = join(dir, "build-count.txt");
    writeFileSync(countPath, "0", "utf8");
    writeVmcFixture(dir, {
      vmcConfig: `import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const countPath = join(process.cwd(), "build-count.txt");

export default {
  plugins: [{
    name: "corrupt-cache",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => {
      const count = Number(readFileSync(countPath, "utf8"));
      writeFileSync(countPath, String(count + 1), "utf8");
      return "export interface Foo { n: number }";
    },
  }],
};
`,
    });

    const first = runVmc(dir, ["--noEmit"]);
    expect(first.stderr).toBe("");
    expect(first.exitCode).toBe(0);

    const [artifactSource] = readArtifactSourcePaths(dir);
    expect(artifactSource).toBeDefined();
    writeFileSync(artifactSource!, "export interface Foo { n: string }\n", "utf8");

    const second = runVmc(dir, ["--noEmit"]);
    expect(second.stderr).toBe("");
    expect(second.exitCode).toBe(0);
    expect(readFileSync(countPath, "utf8")).toBe("2");
    expect(readFileSync(artifactSource!, "utf8")).toContain("n: number");
  });

  it("rebuilds generated artifacts when a loaded plugin module changes", () => {
    const dir = createTempDir();
    writePluginModule(dir, "number");
    writeVmcFixture(dir, {
      vmcConfig: `export default {
  plugins: ["./plugin.cjs"],
};
`,
    });

    const first = runVmc(dir, ["--noEmit"]);
    expect(first.stderr).toBe("");
    expect(first.exitCode).toBe(0);

    const [artifactSource] = readArtifactSourcePaths(dir);
    expect(artifactSource).toBeDefined();
    expect(readFileSync(artifactSource!, "utf8")).toContain("n: number");

    writePluginModule(dir, "string");

    const second = runVmc(dir, ["--noEmit"]);
    expect(second.exitCode).toBe(1);
    expect(second.stdout + second.stderr).toMatch(/number|string/);
    expect(readFileSync(artifactSource!, "utf8")).toContain("n: string");
  });

  it("rebuilds generated artifacts when a plugin file dependency changes", () => {
    const dir = createTempDir();
    const shapePath = join(dir, "shape.txt");
    writeFileSync(shapePath, "number\n", "utf8");
    writeVmcFixture(dir, {
      vmcConfig: `import { readFileSync } from "node:fs";

export default {
  plugins: [{
    name: "file-dependency",
    shouldResolve: (id) => id === "virtual:foo",
    build: (_id, _importer, api) => {
      api.file("./shape.txt", { baseDir: process.cwd(), watch: true });
      const kind = readFileSync("./shape.txt", "utf8").trim();
      return "export interface Foo { n: " + kind + " }";
    },
  }],
};
`,
    });

    const first = runVmc(dir, ["--noEmit"]);
    expect(first.stderr).toBe("");
    expect(first.exitCode).toBe(0);

    const [artifactSource] = readArtifactSourcePaths(dir);
    expect(artifactSource).toBeDefined();
    expect(readFileSync(artifactSource!, "utf8")).toContain("n: number");

    writeFileSync(shapePath, "string\n", "utf8");

    const second = runVmc(dir, ["--noEmit"]);
    expect(second.exitCode).toBe(1);
    expect(second.stdout + second.stderr).toMatch(/number|string/);
    expect(readFileSync(artifactSource!, "utf8")).toContain("n: string");
  });

  it("rebuilds generated artifacts when a loaded plugin helper module changes", () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "helper.cjs"), `module.exports = { kind: "number" };\n`, "utf8");
    writeFileSync(
      join(dir, "plugin.cjs"),
      `const { kind } = require("./helper.cjs");

module.exports = {
  name: "helper-plugin",
  shouldResolve(id) {
    return id === "virtual:foo";
  },
  build() {
    return "export interface Foo { n: " + kind + " }";
  },
};
`,
      "utf8",
    );
    writeVmcFixture(dir, {
      vmcConfig: `export default {
  plugins: ["./plugin.cjs"],
};
`,
    });

    const first = runVmc(dir, ["--noEmit"]);
    expect(first.stderr).toBe("");
    expect(first.exitCode).toBe(0);

    const [artifactSource] = readArtifactSourcePaths(dir);
    expect(artifactSource).toBeDefined();
    expect(readFileSync(artifactSource!, "utf8")).toContain("n: number");

    writeFileSync(join(dir, "helper.cjs"), `module.exports = { kind: "string" };\n`, "utf8");

    const second = runVmc(dir, ["--noEmit"]);
    expect(second.exitCode).toBe(1);
    expect(second.stdout + second.stderr).toMatch(/number|string/);
    expect(readFileSync(artifactSource!, "utf8")).toContain("n: string");
  });

  it("watch recomputes artifact fingerprints after source input changes", async () => {
    const dir = createTempDir();
    writeVmcFixture(dir, {
      entrySource: 'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n',
      vmcConfig: `import { readFileSync } from "node:fs";
import { join } from "node:path";

export default {
  plugins: [{
    name: "watch-cache",
    shouldResolve: (id) => id === "virtual:foo",
    build: (_id, _importer, api) => {
      api.file("./shape.txt", { baseDir: process.cwd(), watch: true });
      const shape = readFileSync(join(process.cwd(), "shape.txt"), "utf8");
      const kind = shape.includes("string") ? "string" : "number";
      return "export interface Foo { n: " + kind + " }";
    },
  }],
};
`,
    });
    writeFileSync(join(dir, "shape.txt"), "number\n", "utf8");

    const watch = startVmcWatch(dir);
    try {
      await waitForOutput(watch, /Found 0 errors\. Watching for file changes\./);
      await delay(250);
      writeFileSync(join(dir, "shape.txt"), "string\n", "utf8");
      writeFileSync(
        join(dir, "src", "entry.ts"),
        'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: 1 };\n// trigger rebuild\n',
        "utf8",
      );
      await waitForOutput(watch, /File change detected\. Starting incremental compilation\./);
      const output = await waitForOutput(
        watch,
        /TS2322|Type 'number' is not assignable to type 'string'/,
      );
      expect(output).toMatch(/TS2322|Type 'number' is not assignable to type 'string'/);
    } finally {
      await stopWatchProcess(watch.child);
    }
  }, 25_000);

  it("watch reloads loaded plugin helper modules after helper changes", async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "helper.cjs"), `module.exports = { kind: "number" };\n`, "utf8");
    writeFileSync(
      join(dir, "plugin.cjs"),
      `const { kind } = require("./helper.cjs");

module.exports = {
  name: "watch-helper",
  shouldResolve(id) {
    return id === "virtual:foo";
  },
  build() {
    return "export interface Foo { n: " + kind + " }";
  },
};
`,
      "utf8",
    );
    writeVmcFixture(dir, {
      vmcConfig: `export default {
  plugins: ["./plugin.cjs"],
};
`,
    });

    const watch = startVmcWatch(dir);
    try {
      await waitForOutput(watch, /Found 0 errors\. Watching for file changes\./);
      await delay(250);
      writeFileSync(join(dir, "helper.cjs"), `module.exports = { kind: "string" };\n`, "utf8");
      await waitForOutput(watch, /File change detected\. Starting incremental compilation\./);
      const output = await waitForOutput(
        watch,
        /TS2322|Type 'number' is not assignable to type 'string'/,
      );
      expect(output).toMatch(/TS2322|Type 'number' is not assignable to type 'string'/);
    } finally {
      await stopWatchProcess(watch.child);
    }
  }, 25_000);

  it("watch reloads vmc config helper modules after helper changes", async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, "config-helper.cjs"), `module.exports = { kind: "number" };\n`, "utf8");
    writeVmcFixture(dir, {
      vmcConfig: `const { kind } = require("./config-helper.cjs");

export default {
  plugins: [{
    name: "config-helper",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => "export interface Foo { n: " + kind + " }",
  }],
};
`,
    });

    const watch = startVmcWatch(dir);
    try {
      await waitForOutput(watch, /Found 0 errors\. Watching for file changes\./);
      await delay(250);
      writeFileSync(
        join(dir, "config-helper.cjs"),
        `module.exports = { kind: "string" };\n`,
        "utf8",
      );
      await waitForOutput(watch, /File change detected\. Starting incremental compilation\./);
      const output = await waitForOutput(
        watch,
        /TS2322|Type 'number' is not assignable to type 'string'/,
      );
      expect(output).toMatch(/TS2322|Type 'number' is not assignable to type 'string'/);
    } finally {
      await stopWatchProcess(watch.child);
    }
  }, 25_000);

  it("reports diagnostics when virtual module type is wrong", () => {
    const dir = createTempDir();
    const srcDir = join(dir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["src"],
      }),
      "utf8",
    );
    writeFileSync(
      join(dir, "vmc.config.ts"),
      `export default {
  plugins: [{
    name: "virtual",
    shouldResolve: (id) => id === "virtual:foo",
    build: () => "export interface Foo { n: number }",
  }],
};
`,
      "utf8",
    );
    writeFileSync(
      join(srcDir, "entry.ts"),
      'import type { Foo } from "virtual:foo";\nexport const value: Foo = { n: "wrong" };\n',
      "utf8",
    );

    const { exitCode, stdout, stderr } = runVmc(dir, ["--noEmit"]);
    expect(exitCode).toBe(1);
    const output = stdout + stderr;
    expect(output).toMatch(/string|number/);
  });

  it("compiles without vmc.config when no virtual modules", () => {
    const dir = createTempDir();
    const srcDir = join(dir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["src"],
      }),
      "utf8",
    );
    writeFileSync(join(srcDir, "entry.ts"), "export const x = 1;\n", "utf8");

    const { exitCode, stderr } = runVmc(dir, ["--noEmit"]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(existsSync(join(dir, "node_modules", ".typed", "virtual", "index.json"))).toBe(false);
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function writePluginModule(dir: string, kind: "number" | "string"): void {
  writeFileSync(
    join(dir, "plugin.cjs"),
    `const kind = "${kind}";

module.exports = {
  name: "module-plugin",
  shouldResolve(id) {
    return id === "virtual:foo";
  },
  build() {
    return "export interface Foo { n: " + kind + " }";
  },
};
`,
    "utf8",
  );
}
