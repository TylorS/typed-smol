import { describe, expect, it } from "vitest";
import { curriculumDiff } from "../../tutorial/Diff.js";

describe("curriculumDiff", () => {
  it("marks additions and removals with both line-number spaces", () => {
    const lines = curriculumDiff(
      "const count = 0\nrender(count)",
      "const count = 1\nrender(count)",
    );

    expect(lines).toContainEqual({ kind: "remove", text: "const count = 0", oldLine: 1 });
    expect(lines).toContainEqual({ kind: "add", text: "const count = 1", newLine: 1 });
    expect(lines).toContainEqual({
      kind: "context",
      text: "render(count)",
      oldLine: 2,
      newLine: 2,
    });
  });

  it("collapses unchanged regions outside the requested context", () => {
    const before = Array.from({ length: 12 }, (_, index) => `line ${index}`).join("\n");
    const after = before.replace("line 6", "changed 6");
    const lines = curriculumDiff(before, after, 1);

    expect(lines.filter(({ kind }) => kind === "skip")).toHaveLength(2);
    expect(lines.some((line) => line.kind === "context" && line.text === "line 0")).toBe(false);
    expect(lines.some((line) => line.kind === "context" && line.text === "line 5")).toBe(true);
  });
});
