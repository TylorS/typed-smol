import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deriveUiComponentResumabilityFact } from "./uiComponentFacts.js";

describe("UI component resumability source facts", () => {
  it("derives resumability facts from actual @typed/ui primitive source modules", () => {
    expect(
      ["Checkbox", "Disclosure", "Dialog", "Popover", "Select", "Form"].map((name) =>
        deriveUiComponentResumabilityFact({
          moduleId: `@typed/ui/${name}`,
          sourceText: readUiSource(`${name}.ts`),
        }),
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "actions": [
            "setChecked",
            "toggle",
          ],
          "component": "typed/ui/Checkbox",
          "componentExports": [
            "Input",
            "InputView",
            "Label",
            "Check",
          ],
          "moduleId": "@typed/ui/Checkbox",
          "startupState": true,
          "stateFields": [
            "checked",
          ],
        },
        {
          "actions": [
            "setOpen",
            "toggle",
          ],
          "component": "typed/ui/Disclosure",
          "componentExports": [
            "Button",
            "Content",
          ],
          "moduleId": "@typed/ui/Disclosure",
          "startupState": true,
          "stateFields": [
            "open",
          ],
        },
        {
          "actions": [
            "setOpen",
            "close",
          ],
          "component": "typed/ui/Dialog",
          "componentExports": [
            "Trigger",
            "Close",
            "Content",
            "Heading",
            "Description",
          ],
          "moduleId": "@typed/ui/Dialog",
          "startupState": true,
          "stateFields": [
            "open",
          ],
        },
        {
          "actions": [
            "setOpen",
          ],
          "component": "typed/ui/Popover",
          "componentExports": [
            "Trigger",
            "Anchor",
            "Content",
            "Dismiss",
            "Arrow",
            "Heading",
            "Description",
          ],
          "moduleId": "@typed/ui/Popover",
          "startupState": true,
          "stateFields": [
            "open",
            "mode",
          ],
        },
        {
          "actions": [
            "setOpen",
            "select",
            "move",
          ],
          "component": "typed/ui/Select",
          "componentExports": [
            "Trigger",
            "Content",
            "Option",
            "Label",
            "Value",
            "HiddenInput",
            "Arrow",
            "Dismiss",
            "Group",
            "GroupLabel",
            "Heading",
            "ItemCheck",
            "Row",
            "Separator",
          ],
          "moduleId": "@typed/ui/Select",
          "startupState": true,
          "stateFields": [
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
            "setValue",
            "validate",
            "reset",
            "applyResult",
            "pushValue",
            "removeValue",
          ],
          "component": "typed/ui/Form",
          "componentExports": [
            "Form",
            "Input",
            "Checkbox",
            "Select",
            "Label",
            "Description",
            "Error",
            "Submit",
            "Reset",
            "Push",
            "Remove",
            "Group",
          ],
          "moduleId": "@typed/ui/Form",
          "startupState": true,
          "stateFields": [
            "submitting",
          ],
        },
      ]
    `);
  });

  it("derives the same facts from a source file provided by the compiler", () => {
    const sourceText = [
      'import * as Effect from "effect/Effect";',
      'import { RefSubject } from "@typed/fx";',
      'import * as DataAttr from "./DataAttr.js";',
      'import type { Component } from "./Reactive.js";',
      "export interface State { readonly open: boolean }",
      "export const data = DataAttr.schema({ open: Schema.Boolean });",
      'export const component = "typed/ui/Disclosure";',
      "export function setOpen<E, R>(state: RefSubject.RefSubject<State, E, R>, open: boolean): Effect.Effect<State, E, R> {",
      "  return RefSubject.update(state, (current) => ({ ...current, open }));",
      "}",
      "export function Button<const Opts>(options: Opts): Component<Opts> {",
      "  return options as Component<Opts>;",
      "}",
    ].join("\n");

    expect(deriveUiComponentResumabilityFact({ moduleId: "virtual:Disclosure", sourceText }))
      .toMatchInlineSnapshot(`
        {
          "actions": [
            "setOpen",
          ],
          "component": "typed/ui/Disclosure",
          "componentExports": [
            "Button",
          ],
          "moduleId": "virtual:Disclosure",
          "startupState": true,
          "stateFields": [
            "open",
          ],
        }
      `);
  });
});

function readUiSource(fileName: string): string {
  return readFileSync(join(uiSourceDir(), fileName), "utf8");
}

function uiSourceDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../../../ui/src");
}
