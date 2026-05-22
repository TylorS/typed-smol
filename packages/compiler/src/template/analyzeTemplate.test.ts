import { describe, expect, it } from "vitest";
import { analyzeTemplate } from "./analyzeTemplate.js";

const strings = (...values: readonly string[]): TemplateStringsArray =>
  Object.assign([...values], { raw: [...values] }) as unknown as TemplateStringsArray;

describe("analyzeTemplate", () => {
  it("converts static element structure into a TemplatePlan", () => {
    const plan = analyzeTemplate(strings("<main><h1>Hello</h1><input disabled /></main>"));

    expect(plan.nodes).toEqual([
      {
        kind: "element",
        tagName: "main",
        attributes: [],
        children: [
          {
            kind: "element",
            tagName: "h1",
            attributes: [],
            children: [{ kind: "text", value: "Hello" }],
          },
          {
            kind: "selfClosingElement",
            tagName: "input",
            attributes: [{ kind: "attribute", name: "disabled", value: "" }],
          },
        ],
      },
    ]);
  });

  it("records dynamic node, event, property, ref, and sparse attribute parts", () => {
    const plan = analyzeTemplate(
      strings('<button class="count-', '" .value=', " @click=", " ref=", ">Count: ", "</button>"),
    );

    expect(plan.nodes).toEqual([
      {
        kind: "element",
        tagName: "button",
        attributes: [
          {
            kind: "sparseClassName",
            name: "class",
            nodes: [
              { kind: "text", value: "count-" },
              { kind: "part", valueIndex: 0 },
            ],
          },
          { kind: "property", name: "value", valueIndex: 1 },
          { kind: "event", name: "click", valueIndex: 2 },
          { kind: "ref", valueIndex: 3 },
        ],
        children: [
          { kind: "text", value: "Count: " },
          {
            kind: "part",
            valueIndex: 4,
          },
        ],
      },
    ]);
    expect(plan.parts.map((part) => part.kind)).toEqual([
      "sparseClassName",
      "property",
      "event",
      "ref",
      "node",
    ]);
  });

  it("records comments, doctypes, text-only elements, and data/properties parts", () => {
    const plan = analyzeTemplate(
      strings(
        "<!doctype html><!--",
        '--><script type="module">',
        "</script><section .data=",
        " .props=",
        "></section>",
      ),
    );

    expect(plan.nodes.map((node) => node.kind)).toEqual([
      "doctype",
      "commentPart",
      "textOnlyElement",
      "element",
    ]);
    expect(plan.parts.map((part) => part.kind)).toEqual(["comment", "text", "data", "properties"]);
  });
});
