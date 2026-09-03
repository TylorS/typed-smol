import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { test } from "node:test";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const siteRoot = path.join(websiteRoot, "dist/site");

test("every generated search link resolves inside the deployed static site", async () => {
  const artifact = JSON.parse(
    await fs.readFile(path.join(websiteRoot, "src/generated/search-index.json"), "utf8"),
  );
  const missing = [];

  for (const entry of artifact.entries) {
    if (entry.kind === "exposure" || entry.kind === "resource") {
      assert.match(
        entry.href,
        /^\/reference\/symbols\/[A-Za-z0-9_-]+$/u,
        `${entry.id} must use a filesystem-safe symbol route`,
      );
    }
    const url = new URL(entry.href, "https://example.test");
    const segments = decodeURIComponent(url.pathname).split("/").filter(Boolean);
    const target = path.join(siteRoot, ...segments, "index.html");
    try {
      await fs.access(target);
    } catch {
      missing.push(`${entry.id}: ${entry.href}`);
    }
  }

  assert.deepEqual(missing, []);

  for (const route of [
    "explore/quick-start",
    "explore/tutorial",
    "explore/tutorial/model-the-domain",
  ]) {
    const output = await fs.readFile(path.join(siteRoot, route, "index.html"), "utf8");
    assert.match(output, /data-site-base="\/typed-smol\/"/u, route);
    assert.doesNotMatch(output, /(?:href|src)="\/(?!typed-smol\/)/u, route);
  }
});
