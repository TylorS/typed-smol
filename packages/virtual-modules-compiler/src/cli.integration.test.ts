/// <reference types="node" />
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, "..", "dist", "cli.js");

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "vmc-integration-"));
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

describe("vmc CLI integration", () => {
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
  });
});
