import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";

const execFileAsync = promisify(execFile);
const websiteRoot = path.resolve(import.meta.dirname, "..");
const clientRoot = path.join(websiteRoot, "dist/client");

test("a client build leaves every production shell asset ready to serve", async () => {
  await execFileAsync("pnpm", ["build:client"], {
    cwd: websiteRoot,
    maxBuffer: 16 * 1024 * 1024,
  });

  for (const pathname of [
    "client.js",
    "styles.css",
    "styles/tokens.css",
    "styles/fx-marble.css",
    "typed.svg",
  ]) {
    await stat(path.join(clientRoot, pathname));
  }

  const styles = await readFile(path.join(clientRoot, "styles.css"), "utf8");
  assert.match(styles, /styles\/tokens\.css/);
  assert.match(styles, /styles\/fx-marble\.css/);
});
