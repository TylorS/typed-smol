import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as Resumability from "./Resumability.js";

describe("typed/ui/Resumability", () => {
  it("diagnoses raw option closures and custom hosts from option objects", () => {
    const diagnostics = Resumability.diagnoseOptions("typed/ui/Dialog", {
      host: () => undefined,
      initialFocus: () => null,
      props: {
        onclick: () => undefined,
        ref: () => undefined,
      },
    });

    expect(diagnostics).toMatchInlineSnapshot(`
      [
        {
          "code": "ui-custom-host",
          "component": "typed/ui/Dialog",
          "option": "host",
          "reason": "custom host renderers are opaque functions and cannot be serialized for resume",
          "severity": "error",
        },
        {
          "code": "ui-raw-handler-closure",
          "component": "typed/ui/Dialog",
          "option": "props.onclick",
          "reason": "raw DOM handler closures cannot cross a resumability boundary; use EventHandler descriptors or component actions instead",
          "severity": "error",
        },
        {
          "code": "ui-raw-ref-callback",
          "component": "typed/ui/Dialog",
          "option": "props.ref",
          "reason": "raw ref callbacks close over runtime state; use declared resumability refs instead",
          "severity": "error",
        },
        {
          "code": "ui-function-focus-target",
          "component": "typed/ui/Dialog",
          "option": "initialFocus",
          "reason": "function focus targets are runtime closures; use a selector string or element id target",
          "severity": "error",
        },
      ]
    `);
  });

  it("formats strict diagnostics as stable compiler-facing strings", () => {
    expect(
      Resumability.formatDiagnostics([
        Resumability.rawRefCallback("typed/ui/Popover", "props.ref"),
        Resumability.functionFocusTarget("typed/ui/Dialog", "initialFocus"),
      ]),
    ).toMatchInlineSnapshot(`
      "[ui-raw-ref-callback] typed/ui/Popover props.ref: raw ref callbacks close over runtime state; use declared resumability refs instead
      [ui-function-focus-target] typed/ui/Dialog initialFocus: function focus targets are runtime closures; use a selector string or element id target"
    `);
  });

  it("does not allow primitive modules to hand-author runtime resumability descriptors", () => {
    expect(
      statefulModules.flatMap((fileName) => {
        const source = readUiSource(fileName);
        return [
          source.includes("export const resumability") ? `${fileName}:resumability` : undefined,
          source.includes('from "./Resumability.js"') ? `${fileName}:import` : undefined,
          source.includes("Resumability.defineComponent") ? `${fileName}:defineComponent` : undefined,
        ].filter((value): value is string => value !== undefined);
      }),
    ).toEqual([]);
  });

  it("derives resumability state from component source at compile time", () => {
    expect(statefulModules.map(deriveComponentSource)).toMatchInlineSnapshot(`
      [
        {
          "actions": [
            "setChecked",
            "toggle",
          ],
          "component": "typed/ui/Checkbox",
          "fields": [
            "checked",
          ],
        },
        {
          "actions": [
            "register",
            "unregister",
          ],
          "component": "typed/ui/Collection",
          "fields": [
            "size",
          ],
        },
        {
          "actions": [
            "setOpen",
            "setValue",
            "move",
            "selectActive",
          ],
          "component": "typed/ui/Combobox",
          "fields": [
            "id",
            "value",
            "open",
            "activeId",
            "active",
            "selected",
          ],
        },
        {
          "actions": [
            "move",
            "tabIndex",
            "activeDescendant",
          ],
          "component": "typed/ui/Composite",
          "fields": [
            "activeId",
            "orientation",
            "loop",
            "rtl",
            "virtualFocus",
          ],
        },
        {
          "actions": [
            "setOpen",
            "close",
          ],
          "component": "typed/ui/Dialog",
          "fields": [
            "open",
          ],
        },
        {
          "actions": [
            "setOpen",
            "toggle",
          ],
          "component": "typed/ui/Disclosure",
          "fields": [
            "open",
          ],
        },
        {
          "actions": [
            "setValue",
            "validate",
            "reset",
            "applyResult",
            "pushValue",
            "removeValue",
          ],
          "component": "typed/ui/Form",
          "fields": [
            "submitting",
          ],
        },
        {
          "actions": [
            "setOpen",
          ],
          "component": "typed/ui/Hovercard",
          "fields": [
            "id",
            "open",
          ],
        },
        {
          "actions": [
            "select",
            "move",
          ],
          "component": "typed/ui/Listbox",
          "fields": [
            "value",
            "activeId",
            "orientation",
            "loop",
            "rtl",
            "virtualFocus",
          ],
        },
        {
          "actions": [
            "setOpen",
            "setActive",
            "move",
          ],
          "component": "typed/ui/Menu",
          "fields": [
            "open",
            "mode",
            "activeId",
            "orientation",
            "loop",
            "rtl",
            "virtualFocus",
          ],
        },
        {
          "actions": [
            "move",
          ],
          "component": "typed/ui/Menubar",
          "fields": [
            "activeId",
            "orientation",
            "loop",
            "rtl",
            "virtualFocus",
          ],
        },
        {
          "actions": [
            "setOpen",
          ],
          "component": "typed/ui/Popover",
          "fields": [
            "open",
            "mode",
          ],
        },
        {
          "actions": [
            "setValue",
            "selectItem",
            "move",
          ],
          "component": "typed/ui/RadioGroup",
          "fields": [
            "value",
            "activeId",
            "orientation",
            "loop",
            "toolbar",
          ],
        },
        {
          "actions": [
            "setOpen",
            "select",
            "move",
          ],
          "component": "typed/ui/Select",
          "fields": [
            "open",
            "mode",
            "value",
            "activeId",
            "orientation",
            "loop",
            "rtl",
            "virtualFocus",
          ],
        },
        {
          "actions": [
            "select",
            "move",
          ],
          "component": "typed/ui/Tabs",
          "fields": [
            "selectedId",
            "activeId",
            "activationMode",
            "orientation",
            "loop",
            "rtl",
          ],
        },
        {
          "actions": [
            "move",
          ],
          "component": "typed/ui/Toolbar",
          "fields": [
            "activeId",
            "orientation",
            "loop",
            "rtl",
            "virtualFocus",
          ],
        },
        {
          "actions": [
            "setOpen",
          ],
          "component": "typed/ui/Tooltip",
          "fields": [
            "id",
            "open",
          ],
        },
      ]
    `);
  });
});

const statefulModules = [
  "Checkbox.ts",
  "Collection.ts",
  "Combobox.ts",
  "Composite.ts",
  "Dialog.ts",
  "Disclosure.ts",
  "Form.ts",
  "Hovercard.ts",
  "Listbox.ts",
  "Menu.ts",
  "Menubar.ts",
  "Popover.ts",
  "RadioGroup.ts",
  "Select.ts",
  "Tabs.ts",
  "Toolbar.ts",
  "Tooltip.ts",
] as const;

interface DerivedComponentSource {
  readonly component: string;
  readonly fields: readonly string[];
  readonly actions: readonly string[];
}

function deriveComponentSource(fileName: string): DerivedComponentSource {
  const file = sourceFile(fileName);
  return {
    actions: exportedActionNames(file),
    component: exportedStringConst(file, "component"),
    fields: exportedDataFields(file),
  };
}

function sourceFile(fileName: string): ts.SourceFile {
  return ts.createSourceFile(fileName, readUiSource(fileName), ts.ScriptTarget.Latest, true);
}

function readUiSource(fileName: string): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(currentDir, fileName), "utf8");
}

function exportedStringConst(file: ts.SourceFile, name: string): string {
  for (const statement of file.statements) {
    if (!isExportedVariable(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!isIdentifierNamed(declaration.name, name)) continue;
      if (declaration.initializer && ts.isStringLiteral(declaration.initializer)) {
        return declaration.initializer.text;
      }
    }
  }
  throw new Error(`Missing exported string const ${name} in ${file.fileName}`);
}

function exportedDataFields(file: ts.SourceFile): readonly string[] {
  for (const statement of file.statements) {
    if (!isExportedVariable(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!isIdentifierNamed(declaration.name, "data")) continue;
      const fields = dataFieldsFromInitializer(declaration.initializer);
      if (fields.length > 0) return fields;
    }
  }
  throw new Error(`Missing exported data schema in ${file.fileName}`);
}

function dataFieldsFromInitializer(initializer: ts.Expression | undefined): readonly string[] {
  if (!initializer || !ts.isCallExpression(initializer)) return [];
  const [fields] = initializer.arguments;
  if (!fields || !ts.isObjectLiteralExpression(fields)) return [];
  return fields.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) ? propertyName(property.name) : [],
  );
}

function exportedActionNames(file: ts.SourceFile): readonly string[] {
  return file.statements.flatMap((statement) => {
    if (!ts.isFunctionDeclaration(statement) || !hasExportModifier(statement)) return [];
    const name = statement.name?.text;
    if (!name || !isActionFunction(statement)) return [];
    return [name];
  });
}

function isActionFunction(statement: ts.FunctionDeclaration): boolean {
  const returnType = statement.type?.getText() ?? "";
  const firstParameter = statement.parameters[0]?.type?.getText() ?? "";
  return (
    returnType.startsWith("Effect.Effect<") &&
    !returnType.includes("RefSubject.RefSubject") &&
    (returnType.includes("State") || firstParameter.includes("RefSubject.RefSubject"))
  );
}

function propertyName(name: ts.PropertyName): readonly string[] {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return [name.text];
  }
  return [];
}

function isExportedVariable(statement: ts.Statement): statement is ts.VariableStatement {
  return ts.isVariableStatement(statement) && hasExportModifier(statement);
}

function hasExportModifier(node: ts.Node): boolean {
  return ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true;
}

function isIdentifierNamed(name: ts.BindingName, expected: string): boolean {
  return ts.isIdentifier(name) && name.text === expected;
}
