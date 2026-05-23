import { describe, expect, it } from "vitest";
import ts from "typescript";
import { analyzeComponentHmr } from "./analyzeComponentHmr.js";

describe("analyzeComponentHmr", () => {
  it("finds inline RefSubject.make calls in route components", () => {
    const result = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";
        import { html } from "@typed/template";

        export const route = () => Effect.gen(function* () {
          const count = yield* RefSubject.make(0);
          return html\`<button>\${count}</button>\`;
        });
      `,
    });

    expect(result).toEqual({
      boundary: "route-component",
      eligible: true,
      moduleId: "/src/routes/counter.ts",
      services: [
        {
          kind: "inline-refsubject",
          localName: "count",
          serviceId: "/src/routes/counter.ts#count",
          initializerSource: "0",
        },
      ],
    });
  });

  it("does not mark plain optimized html templates as stateful HMR boundaries", () => {
    const result = analyzeComponentHmr({
      boundary: "template",
      moduleId: "/src/components/button.ts",
      sourceText: `
        import { html } from "@typed/template";
        export const button = html\`<button>Save</button>\`;
      `,
    });

    expect(result).toEqual({
      boundary: "template",
      eligible: false,
      moduleId: "/src/components/button.ts",
      services: [],
    });
  });

  it("recognizes existing RefSubject.Service identities", () => {
    const result = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";
        const Count = RefSubject.Service<number>()("@app/routes/counter/Count");

        export const route = () => html\`<button>\${Count}</button>\`;
      `,
    });

    expect(result.services).toEqual([
      {
        kind: "refsubject-service",
        localName: "Count",
        serviceId: "@app/routes/counter/Count",
      },
    ]);
  });

  it("passes semantic route analysis through to HMR service discovery", () => {
    const fixture = semanticFixture(`
      interface Effect<A> extends Iterable<A> {}
      interface RefSubject<A> {
        readonly current: A;
      }

      declare function makeRefSubject<A>(value: A): Effect<RefSubject<A>>;
      declare function refSubjectToRefSubject<A>(value: RefSubject<A>): RefSubject<A>;

      export const route = Effect.gen(function* route() {
        const count = refSubjectToRefSubject(yield* makeRefSubject(0));
        return html\`<p>\${count}</p>\`;
      });
    `);

    const result = analyzeComponentHmr({
      boundary: "route-component",
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      refSubjectType: fixture.refSubjectType,
      sourceFile: fixture.sourceFile,
      sourceText: fixture.sourceFile.text,
      ts,
    });

    expect(result.services).toEqual([
      {
        initializerSource: "refSubjectToRefSubject(yield* makeRefSubject(0))",
        kind: "inline-refsubject",
        localName: "count",
        serviceId: `${fixture.moduleId}#count`,
      },
    ]);
  });

  it("recognizes multiline RefSubject.Service identities through route analysis", () => {
    const result = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";

        const Count =
          RefSubject
            .Service<number>()
            ("@app/routes/counter/Count");

        export const route = () => html\`<button>\${Count}</button>\`;
      `,
    });

    expect(result.services).toEqual([
      {
        kind: "refsubject-service",
        localName: "Count",
        serviceId: "@app/routes/counter/Count",
      },
    ]);
  });
});

function semanticFixture(routeSource: string): {
  readonly checker: ts.TypeChecker;
  readonly moduleId: string;
  readonly refSubjectType: ts.Type;
  readonly sourceFile: ts.SourceFile;
} {
  const moduleId = "/src/routes/semantic-hmr.ts";
  const sourceText = `
    declare const Effect: {
      readonly gen: <A>(body: () => Generator<unknown, A, unknown>) => A;
    };
    declare const html: (strings: TemplateStringsArray, ...values: readonly unknown[]) => unknown;

    ${routeSource}

    type __TypedRefSubjectTarget = RefSubject<unknown>;
  `;
  const sourceFile = ts.createSourceFile(moduleId, sourceText, ts.ScriptTarget.Latest, true);
  const host = semanticCompilerHost(moduleId, sourceFile);
  const program = ts.createProgram([moduleId], semanticCompilerOptions(), host);
  const checker = program.getTypeChecker();
  const programSourceFile = program.getSourceFile(moduleId) ?? sourceFile;
  const target = programSourceFile.statements.find(
    (statement): statement is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === "__TypedRefSubjectTarget",
  );
  if (!target) throw new Error("Missing __TypedRefSubjectTarget fixture type alias");

  return {
    checker,
    moduleId,
    refSubjectType: checker.getTypeFromTypeNode(target.type),
    sourceFile: programSourceFile,
  };
}

function semanticCompilerHost(moduleId: string, sourceFile: ts.SourceFile): ts.CompilerHost {
  const options = semanticCompilerOptions();
  const defaultHost = ts.createCompilerHost(options, true);
  return {
    ...defaultHost,
    fileExists: (fileName) => fileName === moduleId || defaultHost.fileExists(fileName),
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
      fileName === moduleId
        ? sourceFile
        : defaultHost.getSourceFile(
            fileName,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
          ),
    readFile: (fileName) => (fileName === moduleId ? sourceFile.text : defaultHost.readFile(fileName)),
  };
}

function semanticCompilerOptions(): ts.CompilerOptions {
  return {
    module: ts.ModuleKind.ESNext,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
}
