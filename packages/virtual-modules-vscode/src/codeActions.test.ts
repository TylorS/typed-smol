import { describe, expect, it } from "vitest";
import { getTypedCompilerFix } from "./codeActions.js";

describe("typed compiler code actions", () => {
  it("ignores diagnostics without compiler fix metadata", () => {
    expect(getTypedCompilerFix({ code: "TYPED-TEMPLATE-ANALYZE-001" })).toBeUndefined();
  });

  it("extracts compiler fix metadata from diagnostic code payloads", () => {
    expect(
      getTypedCompilerFix({
        code: {
          fix: {
            edits: [
              {
                fileName: "/src/view.ts",
                span: { end: 2, start: 1 },
                text: "x",
              },
            ],
            title: "Apply template fix",
          },
          value: "TYPED-TEMPLATE-001",
        },
      }),
    ).toEqual({
      edits: [
        {
          fileName: "/src/view.ts",
          span: { end: 2, start: 1 },
          text: "x",
        },
      ],
      title: "Apply template fix",
    });
  });
});
