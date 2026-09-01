import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const contentRoot = join(import.meta.dirname, "../../../content");

const markdownFiles = (directory: string): ReadonlyArray<string> =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? markdownFiles(path)
      : path.endsWith(".md")
        ? [path]
        : [];
  });

describe("authored Effect functions", () => {
  it("uses Effect.fn instead of arrow functions which return Effect.gen", () => {
    const offenders = markdownFiles(contentRoot).flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return /=>\s*Effect\.gen\s*\(/s.test(source) ? [path.slice(contentRoot.length + 1)] : [];
    });

    expect(offenders).toEqual([]);
  });
});
