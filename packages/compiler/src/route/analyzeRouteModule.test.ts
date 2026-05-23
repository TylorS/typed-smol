import { describe, expect, it } from "vitest";
import ts from "typescript";
import { analyzeRouteModule } from "./analyzeRouteModule.js";

describe("analyzeRouteModule", () => {
  it("finds multiline RefSubject services, templates, and route closures", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        import { RefSubject } from "@typed/fx";
        import { html } from "@typed/template";

        const Count =
          RefSubject
            .Service<number>()
            ("@app/routes/counter/Count");

        export const route = () => {
          const increment = () => Count.onSuccess(1);
          return html\`<button onClick=\${increment}>Count</button>\`;
        };
      `,
    });

    expect(result.services).toEqual([
      {
        kind: "refsubject-service",
        localName: "Count",
        moduleId: "/src/routes/counter.ts",
        serviceId: "@app/routes/counter/Count",
      },
    ]);
    expect(result.templates).toEqual([
      {
        localName: undefined,
        moduleId: "/src/routes/counter.ts",
        tagName: "html",
      },
    ]);
    expect(result.closures.map((closure) => closure.name)).toEqual(["route", "increment"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("diagnoses inline RefSubject state and records the migration candidate", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        export const route = Effect.gen(function* route() {
          const count = yield* RefSubject.make(0);
          return html\`<p>\${count}</p>\`;
        });
      `,
    });

    expect(result.inlineRefSubjects).toEqual([
      {
        initializerSource: "0",
        localName: "count",
        moduleId: "/src/routes/counter.ts",
        serviceId: "/src/routes/counter.ts#count",
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: "anonymous-refsubject-state",
        message:
          "Inline RefSubject.make in /src/routes/counter.ts should migrate count to RefSubject.Service for resumable HMR",
        moduleId: "/src/routes/counter.ts",
      },
    ]);
  });

  it("uses TypeScript types to detect wrapped inline RefSubject state", () => {
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

    const result = analyzeRouteModule({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      refSubjectType: fixture.refSubjectType,
      sourceFile: fixture.sourceFile,
      sourceText: fixture.sourceFile.text,
      ts,
    });

    expect(result.inlineRefSubjects).toEqual([
      {
        initializerSource: "refSubjectToRefSubject(yield* makeRefSubject(0))",
        localName: "count",
        moduleId: fixture.moduleId,
        serviceId: `${fixture.moduleId}#count`,
      },
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: "anonymous-refsubject-state",
        message:
          `Inline RefSubject-producing initializer in ${fixture.moduleId} should migrate count to RefSubject.Service for resumable HMR`,
        moduleId: fixture.moduleId,
      },
    ]);
  });

  it("does not classify non-yielded RefSubject aliases as inline state", () => {
    const fixture = semanticFixture(`
      interface RefSubject<A> {
        readonly current: A;
      }

      declare const parentCount: RefSubject<number>;

      export const route = () => {
        const count = parentCount;
        return html\`<p>\${count}</p>\`;
      };
    `);

    const result = analyzeRouteModule({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      refSubjectType: fixture.refSubjectType,
      sourceFile: fixture.sourceFile,
      sourceText: fixture.sourceFile.text,
      ts,
    });

    expect(result.inlineRefSubjects).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it("fails closed for let and var RefSubject-producing state", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/counter.ts",
      sourceText: `
        export const route = Effect.gen(function* route() {
          let count = yield* RefSubject.make(0);
          var other = yield* RefSubject.make(1);
          return html\`<p>\${count}\${other}</p>\`;
        });
      `,
    });

    expect(result.inlineRefSubjects).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it("records Effect service captures used by closures", () => {
    const result = analyzeRouteModule({
      moduleId: "/src/routes/profile.ts",
      sourceText: `
        import * as Context from "effect/Context";
        import * as Effect from "effect/Effect";

        class ProfileClient extends Context.Service<
          ProfileClient,
          { readonly load: Effect.Effect<string> }
        >()("@app/ProfileClient") {}

        export const route = Effect.gen(function* route() {
          const client = yield* ProfileClient;
          const load = () => client.load;
          return html\`<section>\${yield* load()}</section>\`;
        });
      `,
    });

    expect(result.effectServices).toEqual([
      {
        kind: "effect-service",
        localName: "ProfileClient",
        moduleId: "/src/routes/profile.ts",
        serviceId: "@app/ProfileClient",
      },
    ]);
    expect(result.closures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captures: [
            {
              kind: "effect-service",
              name: "client",
              serviceId: "@app/ProfileClient",
            },
          ],
          name: "load",
        }),
      ]),
    );
  });
});

function semanticFixture(routeSource: string): {
  readonly checker: ts.TypeChecker;
  readonly moduleId: string;
  readonly refSubjectType: ts.Type;
  readonly sourceFile: ts.SourceFile;
} {
  const moduleId = "/src/routes/semantic.ts";
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
  const target = findTypeAlias(programSourceFile, "__TypedRefSubjectTarget");
  if (!target) throw new Error("Missing __TypedRefSubjectTarget fixture type alias");

  return {
    checker,
    moduleId,
    refSubjectType: checker.getTypeFromTypeNode(target.type),
    sourceFile: programSourceFile,
  };
}

function semanticCompilerHost(moduleId: string, sourceFile: ts.SourceFile): ts.CompilerHost {
  const defaultHost = ts.createCompilerHost(semanticCompilerOptions(), true);
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

function findTypeAlias(sourceFile: ts.SourceFile, name: string): ts.TypeAliasDeclaration | undefined {
  return sourceFile.statements.find(
    (statement): statement is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === name,
  );
}
