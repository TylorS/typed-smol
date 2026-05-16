import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inferClientHtmlEntries } from "./serverEntryClientInputs.js";

const tempDirs: string[] = [];

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), "typed-client-inputs-"));
  tempDirs.push(root);
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("inferClientHtmlEntries", () => {
  it("infers a single html entry from a typed:server import", () => {
    const root = fixtureRoot();
    const src = join(root, "packages/app/src");
    mkdirSync(src, { recursive: true });
    const entry = join(src, "entry.server.ts");
    writeFileSync(
      entry,
      'import handler from "typed:server?routes=./routes&html=./index.html&client=./entry.browser.ts";\nexport default handler;\n',
    );

    expect(inferClientHtmlEntries(entry)).toEqual({
      root: src,
      entries: [{ name: "default", html: "./index.html" }],
    });
  });

  it("infers multi-page html entries from typed:server page pairings", () => {
    const root = fixtureRoot();
    const src = join(root, "packages/app/src");
    mkdirSync(src, { recursive: true });
    const entry = join(src, "entry.server.ts");
    writeFileSync(
      entry,
      [
        'import handler from "typed:server?',
        'page=home:./index.html:./entry.browser.ts',
        '&page=admin:./admin/index.html:./admin.ts";\n',
        "export default handler;\n",
      ].join(""),
    );

    expect(inferClientHtmlEntries(entry)).toEqual({
      root: src,
      entries: [
        { name: "home", html: "./index.html" },
        { name: "admin", html: "./admin/index.html" },
      ],
    });
  });

  it("returns no entries when the server entry has no typed:server html convention", () => {
    const root = fixtureRoot();
    const src = join(root, "src");
    mkdirSync(src, { recursive: true });
    const entry = join(src, "entry.server.ts");
    writeFileSync(entry, 'import { run } from "typed:server?routes=./routes";\n');

    expect(inferClientHtmlEntries(entry)).toEqual({ root: src, entries: [] });
  });
});
