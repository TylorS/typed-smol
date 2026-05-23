import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import type { VirtualModuleResolver } from "@typed/virtual-modules";
import { compile } from "./compile.js";
import type { VmcCompilerExtension } from "./extensions.js";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("vmc compiler extensions", () => {
  it("applies source transforms before TypeScript checks the source file", () => {
    const root = createTempDir();
    const entry = join(root, "entry.ts");
    writeFileSync(entry, `export const value: string = 1;\n`);
    const diagnostics: ts.Diagnostic[] = [];
    const extension: VmcCompilerExtension = {
      name: "typed-transform-test",
      transformSource: ({ sourceText }) => ({
        sourceText: sourceText.replace("= 1", '= "ok"'),
      }),
    };

    const exitCode = compile({
      ts,
      commandLine: commandLine([entry, "--noEmit", "--strict"]),
      extensions: [extension],
      reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
      resolver: unresolvedResolver,
    });

    expect(exitCode).toBe(0);
    expect(diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error))
      .toHaveLength(0);
  });

  it("reports extension diagnostics and fails closed", () => {
    const root = createTempDir();
    const entry = join(root, "entry.ts");
    writeFileSync(entry, `export const value = "ok";\n`);
    const diagnostics: ts.Diagnostic[] = [];
    const extension: VmcCompilerExtension = {
      diagnostics: () => [
        {
          category: ts.DiagnosticCategory.Error,
          code: 990101,
          file: undefined,
          length: 0,
          messageText: "extension diagnostic",
          start: 0,
        },
      ],
      name: "typed-diagnostic-test",
    };

    const exitCode = compile({
      ts,
      commandLine: commandLine([entry, "--noEmit", "--strict"]),
      extensions: [extension],
      reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
      resolver: unresolvedResolver,
    });

    expect(exitCode).toBe(1);
    expect(diagnostics.map((diagnostic) => diagnostic.messageText)).toContain(
      "extension diagnostic",
    );
  });
});

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "vmc-extension-"));
  tempDirs.push(dir);
  return dir;
}

function commandLine(args: readonly string[]): ts.ParsedCommandLine {
  return ts.parseCommandLine([...args, "--target", "ESNext", "--module", "ESNext"]);
}

const unresolvedResolver: VirtualModuleResolver = {
  resolveModule: () => ({ status: "unresolved" }),
  resolvePluginName: () => ({ status: "unresolved" }),
};
