import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import type { VirtualModuleResolver } from "@typed/virtual-modules";
import { runBuild } from "./build.js";
import { compile } from "./compile.js";
import { attachSourceTransformExtensions, type VmcCompilerExtension } from "./extensions.js";
import { runWatch } from "./watch.js";

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

  it("fails build mode when extension diagnostics contain errors", () => {
    const root = createTempDir();
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { composite: true, module: "ESNext", noEmit: true, target: "ESNext" },
        files: ["entry.ts"],
      }),
    );
    writeFileSync(join(root, "entry.ts"), `export const value = "ok";\n`);
    const diagnostics: ts.Diagnostic[] = [];

    const exitCode = runBuild({
      ts,
      buildCommand: ts.parseBuildCommand(["--build", join(root, "tsconfig.json"), "--force"]),
      extensions: [diagnosticExtension("build extension diagnostic")],
      reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
      resolver: unresolvedResolver,
    });

    expect(exitCode).toBe(1);
    expect(diagnostics.map((diagnostic) => diagnostic.messageText)).toContain(
      "build extension diagnostic",
    );
  });

  it("reports extension diagnostics in watch mode", () => {
    const root = createTempDir();
    const entry = join(root, "entry.ts");
    writeFileSync(entry, `export const value = "ok";\n`);
    const diagnostics: ts.Diagnostic[] = [];

    runWatch({
      ts: watchOnceTypeScript(),
      commandLine: commandLine([entry, "--noEmit", "--strict"]),
      extensions: [diagnosticExtension("watch extension diagnostic")],
      reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
      resolver: unresolvedResolver,
    });

    expect(diagnostics.map((diagnostic) => diagnostic.messageText)).toContain(
      "watch extension diagnostic",
    );
  });

  it("updates source transform context without stacking compiler host wrappers", () => {
    const root = createTempDir();
    const entry = join(root, "entry.ts");
    writeFileSync(entry, `export const value = "ok";\n`);
    const host = ts.createCompilerHost({
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
    });
    const extension: VmcCompilerExtension = {
      name: "append-marker",
      transformSource: ({ sourceText }) => ({
        sourceText: `${sourceText}\nexport const marker = 1;`,
      }),
    };
    const context = {
      options: {},
      projectRoot: root,
      rootNames: [entry],
      ts,
    };

    attachSourceTransformExtensions({
      ts,
      compilerHost: host,
      context,
      extensions: [extension],
      reportDiagnostic: () => undefined,
    });
    attachSourceTransformExtensions({
      ts,
      compilerHost: host,
      context,
      extensions: [extension],
      reportDiagnostic: () => undefined,
    });

    const sourceFile = host.getSourceFile(entry, ts.ScriptTarget.ESNext);

    expect(sourceFile?.text.match(/export const marker/g)).toHaveLength(1);
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

function diagnosticExtension(messageText: string): VmcCompilerExtension {
  return {
    diagnostics: () => [
      {
        category: ts.DiagnosticCategory.Error,
        code: 990101,
        file: undefined,
        length: 0,
        messageText,
        start: 0,
      },
    ],
    name: "typed-diagnostic-test",
  };
}

function watchOnceTypeScript(): typeof import("typescript") {
  return Object.create(ts, {
    createWatchCompilerHost: {
      value: (
        rootNames: readonly string[],
        options: ts.CompilerOptions,
        _system: ts.System,
        createProgram: ts.CreateProgram<ts.EmitAndSemanticDiagnosticsBuilderProgram>,
      ) => ({ createProgram, options, rootNames }),
    },
    createWatchProgram: {
      value: (host: {
        readonly createProgram: ts.CreateProgram<ts.EmitAndSemanticDiagnosticsBuilderProgram>;
        readonly options: ts.CompilerOptions;
        readonly rootNames: readonly string[];
      }) => {
        const compilerHost = ts.createCompilerHost(host.options);
        host.createProgram(host.rootNames, host.options, compilerHost);
        return { updateRootFileNames: () => undefined };
      },
    },
    createEmitAndSemanticDiagnosticsBuilderProgram: {
      value: () => ({ getProgram: () => ({}) }),
    },
  }) as typeof import("typescript");
}
