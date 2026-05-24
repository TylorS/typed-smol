import { describe, expect, it } from "vitest";
import ts from "typescript";
import { deriveComponentResumabilityFacts } from "./componentFacts.js";

describe("component resumability facts", () => {
  it("derives component identities, DataAttr fields, and local action descriptors", () => {
    const moduleId = "/repo/packages/ui/src/Disclosure.ts";
    const sourceText = [
      'import * as Schema from "effect/Schema";',
      'import { EventHandler } from "@typed/template";',
      'import * as DataAttr from "./DataAttr.js";',
      'import type { Component } from "./Reactive.js";',
      "export const data = DataAttr.schema({",
      "  open: Schema.Boolean,",
      '  "active-id": Schema.String,',
      "});",
      "export function Button<const Opts>(options: Opts): Component<Opts> {",
      '  const onClick = EventHandler.action("toggle", "click", () => undefined);',
      "  return onClick as Component<Opts>;",
      "}",
      "export const Disclosure = Button;",
    ].join("\n");

    const facts = deriveComponentResumabilityFacts({ moduleId, sourceText });

    expect(facts).toMatchInlineSnapshot(`
      [
        {
          "actions": [
            {
              "bindingName": "onClick",
              "canonicalId": "cmp:/repo/packages/ui/src/Disclosure.ts#Button:action:toggle",
              "componentId": "cmp:/repo/packages/ui/src/Disclosure.ts#Button",
              "event": "click",
              "localName": "toggle",
              "source": {
                "endOffset": 391,
                "endPosition": {
                  "column": 47,
                  "line": 10,
                },
                "id": "src:/repo/packages/ui/src/Disclosure.ts:383",
                "moduleId": "/repo/packages/ui/src/Disclosure.ts",
                "startOffset": 383,
                "startPosition": {
                  "column": 39,
                  "line": 10,
                },
              },
            },
          ],
          "componentId": "cmp:/repo/packages/ui/src/Disclosure.ts#Button",
          "declarationKind": "function",
          "displayName": "Button",
          "exportName": "Button",
          "localName": "Button",
          "moduleId": "/repo/packages/ui/src/Disclosure.ts",
          "stateFields": [
            "active-id",
            "open",
          ],
        },
        {
          "actions": [
            {
              "bindingName": "onClick",
              "canonicalId": "cmp:/repo/packages/ui/src/Disclosure.ts#Disclosure:action:toggle",
              "componentId": "cmp:/repo/packages/ui/src/Disclosure.ts#Disclosure",
              "event": "click",
              "localName": "toggle",
              "source": {
                "endOffset": 391,
                "endPosition": {
                  "column": 47,
                  "line": 10,
                },
                "id": "src:/repo/packages/ui/src/Disclosure.ts:383",
                "moduleId": "/repo/packages/ui/src/Disclosure.ts",
                "startOffset": 383,
                "startPosition": {
                  "column": 39,
                  "line": 10,
                },
              },
            },
          ],
          "componentId": "cmp:/repo/packages/ui/src/Disclosure.ts#Disclosure",
          "declarationKind": "alias",
          "displayName": "Disclosure",
          "exportName": "Disclosure",
          "localName": "Button",
          "moduleId": "/repo/packages/ui/src/Disclosure.ts",
          "stateFields": [
            "active-id",
            "open",
          ],
        },
      ]
    `);
  });

  it("detects renamed and namespace EventHandler.action imports", () => {
    const sourceText = [
      'import * as Template from "@typed/template";',
      'import { action as makeAction } from "@typed/template/EventHandler";',
      'import type { Component } from "./Reactive.js";',
      "export function Root(): Component<{}> {",
      '  const onClick = Template.EventHandler.action("open", "click", () => undefined);',
      '  const onFocus = makeAction("focus", "focus", () => undefined);',
      "  return onClick as Component<{}>;",
      "}",
    ].join("\n");

    expect(deriveComponentResumabilityFacts({ moduleId: "/src/Root.ts", sourceText }))
      .toMatchInlineSnapshot(`
        [
          {
            "actions": [
              {
                "bindingName": "onClick",
                "canonicalId": "cmp:/src/Root.ts#Root:action:open",
                "componentId": "cmp:/src/Root.ts#Root",
                "event": "click",
                "localName": "open",
                "source": {
                  "endOffset": 255,
                  "endPosition": {
                    "column": 54,
                    "line": 5,
                  },
                  "id": "src:/src/Root.ts:249",
                  "moduleId": "/src/Root.ts",
                  "startOffset": 249,
                  "startPosition": {
                    "column": 48,
                    "line": 5,
                  },
                },
              },
              {
                "bindingName": "onFocus",
                "canonicalId": "cmp:/src/Root.ts#Root:action:focus",
                "componentId": "cmp:/src/Root.ts#Root",
                "event": "focus",
                "localName": "focus",
                "source": {
                  "endOffset": 320,
                  "endPosition": {
                    "column": 37,
                    "line": 6,
                  },
                  "id": "src:/src/Root.ts:313",
                  "moduleId": "/src/Root.ts",
                  "startOffset": 313,
                  "startPosition": {
                    "column": 30,
                    "line": 6,
                  },
                },
              },
            ],
            "componentId": "cmp:/src/Root.ts#Root",
            "declarationKind": "function",
            "displayName": "Root",
            "exportName": "Root",
            "localName": "Root",
            "moduleId": "/src/Root.ts",
            "stateFields": [],
          },
        ]
      `);
  });

  it("uses checker-first component detection for aliased Component return types", () => {
    const fixture = semanticFixture(`
      type View = Component<{ readonly content: unknown }>;

      export function Root(): View {
        return { readonlyBrand: "component" };
      }
    `);

    expect(
      deriveComponentResumabilityFacts({
        checker: fixture.checker,
        componentType: fixture.componentType,
        moduleId: fixture.moduleId,
        sourceFile: fixture.sourceFile,
      }).map((fact) => ({
        componentId: fact.componentId,
        exportName: fact.exportName,
        localName: fact.localName,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "componentId": "cmp:/src/semantic-component.ts#Root",
          "exportName": "Root",
          "localName": "Root",
        },
      ]
    `);
  });
});

function semanticFixture(source: string): {
  readonly checker: ts.TypeChecker;
  readonly componentType: ts.Type;
  readonly moduleId: string;
  readonly sourceFile: ts.SourceFile;
} {
  const moduleId = "/src/semantic-component.ts";
  const sourceText = `
    interface Component<Opts> {
      readonly readonlyBrand: "component";
    }
    type __TypedComponentTarget = Component<unknown>;

    ${source}
  `;
  const sourceFile = ts.createSourceFile(moduleId, sourceText, ts.ScriptTarget.Latest, true);
  const host = compilerHost(moduleId, sourceFile);
  const program = ts.createProgram([moduleId], compilerOptions(), host);
  const checker = program.getTypeChecker();
  const programSourceFile = program.getSourceFile(moduleId) ?? sourceFile;
  const target = programSourceFile.statements.find(
    (statement): statement is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === "__TypedComponentTarget",
  );
  if (!target) throw new Error("Missing __TypedComponentTarget");
  return {
    checker,
    componentType: checker.getTypeFromTypeNode(target.type),
    moduleId,
    sourceFile: programSourceFile,
  };
}

function compilerHost(moduleId: string, sourceFile: ts.SourceFile): ts.CompilerHost {
  const options = compilerOptions();
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

function compilerOptions(): ts.CompilerOptions {
  return {
    module: ts.ModuleKind.ESNext,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
}
