import { describe, expect, it } from "vitest";
import {
  createTemplatePlan,
  isTemplatePlan,
  templatePlanFingerprint,
  type TemplatePlan,
} from "./TemplatePlan.js";

describe("TemplatePlan", () => {
  it("creates a versioned template plan and preserves dynamic part order", () => {
    const plan = createTemplatePlan({
      templateHash: "hash:counter",
      nodes: [
        {
          kind: "element",
          tagName: "button",
          attributes: [{ kind: "event", name: "click", valueIndex: 1 }],
          children: [{ kind: "part", valueIndex: 0 }],
        },
      ],
      parts: [
        { kind: "node", valueIndex: 0, path: [0, 0] },
        { kind: "event", valueIndex: 1, path: [0], name: "click" },
      ],
    });

    expect(plan.version).toBe(1);
    expect(plan.parts.map((part) => part.valueIndex)).toEqual([0, 1]);
    expect(isTemplatePlan(plan)).toBe(true);
  });

  it("rejects values that only resemble a template plan", () => {
    expect(isTemplatePlan({ version: 1, templateHash: "x", nodes: [], parts: [] })).toBe(false);
  });

  it("computes stable fingerprints without depending on object key insertion order", () => {
    const first = createTemplatePlan({
      templateHash: "hash:stable",
      nodes: [
        {
          kind: "text",
          value: "hello",
        },
      ],
      parts: [],
    });
    const second: TemplatePlan = {
      parts: [],
      nodes: [{ value: "hello", kind: "text" }],
      templateHash: "hash:stable",
      version: 1,
      kind: "TemplatePlan",
    };

    expect(templatePlanFingerprint(first)).toBe(templatePlanFingerprint(second));
  });
});
