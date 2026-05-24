import { describe, expect, it } from "vitest";
import ts from "typescript";
import { analyzeRouteDependencyGraph } from "./analyzeRouteDependencyGraph.js";

describe("analyzeRouteDependencyGraph", () => {
  it("discovers direct route dependencies from a TypeScript program", () => {
    const fixture = programFixture({
      "/src/routes/profile.ts": `
        import { client } from "./client";
        export const route = () => client.load();
      `,
      "/src/routes/client.ts": `
        export const Client = RefSubject.Service<number>()("@app/Client");
        export const client = { load: () => Client };
      `,
    });

    const result = analyzeRouteDependencyGraph({
      moduleResolutionHost: fixture.host,
      program: fixture.program,
      routeModuleId: "/src/routes/profile.ts",
      ts,
    });

    expect(result.participants.map((item) => item.moduleId)).toEqual([
      "/src/routes/client.ts",
    ]);
    expect(result.participants.flatMap((item) => item.serviceIds)).toEqual(["@app/Client"]);
    expect(result.dependencyFingerprints).toEqual([
      "/src/routes/client.ts:@app/Client",
    ]);
  });

  it("discovers nested route dependencies recursively", () => {
    const fixture = programFixture({
      "/src/routes/profile.ts": `import "./client";`,
      "/src/routes/client.ts": `
        import "./util";
        export const Client = RefSubject.Service<number>()("@app/Client");
      `,
      "/src/routes/util.ts": `
        export const Util = RefSubject.Service<number>()("@app/Util");
      `,
    });

    const result = analyzeRouteDependencyGraph({
      moduleResolutionHost: fixture.host,
      program: fixture.program,
      routeModuleId: "/src/routes/profile.ts",
      ts,
    });

    expect(result.participants.map((item) => item.moduleId)).toEqual([
      "/src/routes/client.ts",
      "/src/routes/util.ts",
    ]);
  });

  it("reports a stable cycle once", () => {
    const fixture = programFixture({
      "/src/routes/profile.ts": `import "./a";`,
      "/src/routes/a.ts": `
        import "./b";
        export const A = RefSubject.Service<number>()("@app/A");
      `,
      "/src/routes/b.ts": `
        import "./a";
        export const B = RefSubject.Service<number>()("@app/B");
      `,
    });

    const result = analyzeRouteDependencyGraph({
      moduleResolutionHost: fixture.host,
      program: fixture.program,
      routeModuleId: "/src/routes/profile.ts",
      ts,
    });

    expect(result.cycles).toEqual([
      {
        fromModuleId: "/src/routes/b.ts",
        toModuleId: "/src/routes/a.ts",
      },
    ]);
  });

  it("stops at the @typed-compiler-ignore boundary and records skipped imports", () => {
    const fixture = programFixture({
      "/src/routes/profile.ts": `import "./client";`,
      "/src/routes/client.ts": `
        /* @typed-compiler-ignore */
        import "./secret";
        export const Client = RefSubject.Service<number>()("@app/Client");
      `,
      "/src/routes/secret.ts": `
        export const Secret = RefSubject.Service<number>()("@app/Secret");
      `,
    });

    const result = analyzeRouteDependencyGraph({
      moduleResolutionHost: fixture.host,
      program: fixture.program,
      routeModuleId: "/src/routes/profile.ts",
      ts,
    });

    expect(result.participants).toEqual([]);
    expect(result.rejected).toEqual([
      {
        moduleId: "/src/routes/client.ts",
        reason: "explicit-opt-out",
      },
    ]);
    expect(result.boundaries).toEqual([
      {
        moduleId: "/src/routes/client.ts",
        reason: "explicit-opt-out",
        skippedImports: ["/src/routes/secret.ts"],
      },
    ]);
  });
});

function programFixture(files: Record<string, string>): {
  readonly host: ts.ModuleResolutionHost;
  readonly program: ts.Program;
} {
  const normalized = new Map(
    Object.entries(files).map(([fileName, source]) => [fileName, sourceFileText(source)]),
  );
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const host: ts.CompilerHost & ts.ModuleResolutionHost = {
    ...defaultHost,
    fileExists: (fileName) => normalized.has(fileName) || defaultHost.fileExists(fileName),
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      const sourceText = normalized.get(fileName);
      return sourceText === undefined
        ? defaultHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
        : ts.createSourceFile(fileName, sourceText, languageVersion, true);
    },
    readFile: (fileName) => normalized.get(fileName) ?? defaultHost.readFile(fileName),
  };

  return {
    host,
    program: ts.createProgram([...normalized.keys()], options, host),
  };
}

function sourceFileText(source: string): string {
  return `
    declare const RefSubject: {
      readonly Service: <A>() => (id: string) => unknown;
    };

    ${source}
  `;
}
