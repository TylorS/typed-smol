import { describe, expect, it } from "vitest";
import { parseCurriculumFiles } from "../../tutorial/Files.js";

describe("curriculum Markdown files", () => {
  it("reads described section and subsection fences while preserving prose and shell language", () => {
    const source = [
      "Introduce the component.",
      "",
      "## src/Counter.ts: reusable component",
      "",
      '```ts file="src/Counter.ts"',
      'export const label = "<Counter>"',
      "```",
      "",
      "Run it locally.",
      "",
      "### terminal: start the application",
      "",
      '```sh file="terminal"',
      "npm run dev",
      "```",
    ].join("\n");

    const parsed = parseCurriculumFiles("counter.md", source);
    expect(parsed.files).toEqual([
      { name: "src/Counter.ts", language: "ts", source: 'export const label = "<Counter>"' },
      { name: "terminal", language: "sh", source: "npm run dev" },
    ]);
    expect(parsed.body).toContain("Introduce the component.");
    expect(parsed.body).toContain("Run it locally.");
    expect(parsed.body).not.toContain("```ts");
    expect(parseCurriculumFiles("counter.md", source.replaceAll("\n", "\r\n"))).toEqual(parsed);
  });
});
