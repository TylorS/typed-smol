import { describe, expect, it } from "vitest";
import ts from "typescript";
import { classifyRouteCaptures } from "./classifyRouteCaptures.js";

describe("classifyRouteCaptures", () => {
  it("rejects captured let and var locals", () => {
    const fixture = semanticFixture(`
      export const route = () => {
        let count = 0;
        var other = 1;
        const render = () => count + other;
        return render;
      };
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captures: expect.arrayContaining([
            expect.objectContaining({ kind: "unsupported", name: "count" }),
            expect.objectContaining({ kind: "unsupported", name: "other" }),
          ]),
          name: "render",
        }),
      ]),
    );
  });

  it("classifies wrapped RefSubject-producing const locals by type", () => {
    const fixture = semanticFixture(`
      interface Effect<A> extends Iterable<A> {}
      interface RefSubject<A> {
        readonly current: A;
      }

      declare function makeRefSubject<A>(value: A): Effect<RefSubject<A>>;
      declare function refSubjectToRefSubject<A>(value: RefSubject<A>): RefSubject<A>;

      export const route = Effect.gen(function* route() {
        const count = refSubjectToRefSubject(yield* makeRefSubject(0));
        const render = () => count;
        return render;
      });
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      refSubjectType: fixture.refSubjectType,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captures: [
            expect.objectContaining({
              initializerSource: "refSubjectToRefSubject(yield* makeRefSubject(0))",
              kind: "inline-refsubject-migration",
              name: "count",
              serviceId: `${fixture.moduleId}#count`,
            }),
          ],
          name: "render",
        }),
      ]),
    );
  });

  it("classifies function parameters as generated context captures", () => {
    const fixture = semanticFixture(`
      export const route = (a: string, b: number) => a + ":" + b;
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toEqual([
      expect.objectContaining({
        captures: [
          expect.objectContaining({ kind: "generated-context", name: "a", typeText: "string" }),
          expect.objectContaining({ kind: "generated-context", name: "b", typeText: "number" }),
        ],
        name: "route",
      }),
    ]);
  });

  it("fails closed for hidden captures that are not imported or declared", () => {
    const fixture = semanticFixture(`
      export const route = () => {
        const render = () => missingValue;
        return render;
      };
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toMatchInlineSnapshot(`
      [
        {
          "captures": [],
          "moduleId": "/src/routes/semantic.ts",
          "name": "route",
        },
        {
          "captures": [
            {
              "kind": "unsupported",
              "name": "missingValue",
              "reason": "unknown-capture",
              "typeText": "unknown",
            },
          ],
          "moduleId": "/src/routes/semantic.ts",
          "name": "render",
        },
      ]
    `);
    expect(result.diagnostics).toMatchInlineSnapshot(`
      [
        {
          "code": "unsupported-closure-capture",
          "message": "Cannot rewrite closure in /src/routes/semantic.ts: missingValue is not an imported, top-level, service, serializable, template, or generated context value",
          "moduleId": "/src/routes/semantic.ts",
        },
      ]
    `);
  });

  it("ignores object literal property names while classifying captures", () => {
    const fixture = semanticFixture(`
      export const route = () => ({
        mode: "auto",
        open: false,
        user: {
          email: "typed@example.com",
        },
      });
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toEqual([
      expect.objectContaining({
        captures: [],
        name: "route",
      }),
    ]);
    expect(result.diagnostics).toEqual([]);
  });

  it("classifies EventHandler.action captures as resumable serializable values", () => {
    const fixture = semanticFixture(`
      declare const EventHandler: {
        readonly action: (
          id: string,
          event: string,
          handler: (event: Event) => unknown,
          options?: { readonly component?: string }
        ) => { readonly action: { readonly id: string; readonly event: string; readonly component?: string } };
      };

      const save = EventHandler.action(
        "profile.save",
        "submit",
        () => Effect.void,
        { component: "ProfileForm" }
      );

      export const route = () => html\`<form onsubmit=\${save}></form>\`;
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toMatchInlineSnapshot(`
      [
        {
          "captures": [],
          "moduleId": "/src/routes/semantic.ts",
          "name": "save",
        },
        {
          "captures": [
            {
              "descriptorName": "event-action:profile.save:submit:ProfileForm",
              "kind": "serializable-value",
              "name": "save",
              "typeText": "{ readonly action: { readonly id: string; readonly event: string; readonly component?: string | undefined; }; }",
            },
          ],
          "moduleId": "/src/routes/semantic.ts",
          "name": "route",
        },
      ]
    `);
    expect(result.diagnostics).toMatchInlineSnapshot(`[]`);
  });

  it("diagnoses non-resumable EventHandler.make captures used as route event handlers", () => {
    const fixture = semanticFixture(`
      declare const EventHandler: {
        readonly make: (handler: (event: Event) => unknown) => unknown;
      };

      const save = EventHandler.make(() => Effect.void);

      export const route = () => html\`<form onsubmit=\${save}></form>\`;
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toMatchInlineSnapshot(`
      [
        {
          "captures": [],
          "moduleId": "/src/routes/semantic.ts",
          "name": "save",
        },
        {
          "captures": [
            {
              "kind": "unsupported",
              "name": "save",
              "reason": "non-resumable-event-handler",
              "typeText": "unknown",
            },
          ],
          "moduleId": "/src/routes/semantic.ts",
          "name": "route",
        },
      ]
    `);
    expect(result.diagnostics).toMatchInlineSnapshot(`
      [
        {
          "code": "unsupported-closure-capture",
          "message": "Cannot rewrite closure in /src/routes/semantic.ts: save is a non-resumable event handler; use EventHandler.action(...)",
          "moduleId": "/src/routes/semantic.ts",
        },
      ]
    `);
  });

  it("diagnoses raw function captures used as route event handlers", () => {
    const fixture = semanticFixture(`
      const save = () => Effect.void;

      export const route = () => html\`<form onsubmit=\${save}></form>\`;
    `);

    const result = classifyRouteCaptures({
      checker: fixture.checker,
      moduleId: fixture.moduleId,
      sourceFile: fixture.sourceFile,
      ts,
    });

    expect(result.closures).toMatchInlineSnapshot(`
      [
        {
          "captures": [],
          "moduleId": "/src/routes/semantic.ts",
          "name": "save",
        },
        {
          "captures": [
            {
              "kind": "unsupported",
              "name": "save",
              "reason": "non-resumable-event-handler",
              "typeText": "() => any",
            },
          ],
          "moduleId": "/src/routes/semantic.ts",
          "name": "route",
        },
      ]
    `);
    expect(result.diagnostics).toMatchInlineSnapshot(`
      [
        {
          "code": "unsupported-closure-capture",
          "message": "Cannot rewrite closure in /src/routes/semantic.ts: save is a non-resumable event handler; use EventHandler.action(...)",
          "moduleId": "/src/routes/semantic.ts",
        },
      ]
    `);
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

    interface RefSubject<A> {
      readonly current: A;
    }
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
