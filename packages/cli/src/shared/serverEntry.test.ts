import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Option } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { resolveServerEntry } from "./serverEntry.js";

const tempDirs: string[] = [];

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), "typed-server-entry-"));
  tempDirs.push(root);
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("resolveServerEntry", () => {
  it("uses typed config entry when no CLI entry is provided", async () => {
    const root = fixtureRoot();
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src/server.ts"), "export {};\n");

    await expect(
      Effect.runPromise(resolveServerEntry(Option.none(), root, "src/server.ts")),
    ).resolves.toBe(join(root, "src/server.ts"));
  });

  it("lets the CLI entry override typed config entry", async () => {
    const root = fixtureRoot();
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src/from-config.ts"), "export {};\n");
    writeFileSync(join(root, "src/from-cli.ts"), "export {};\n");

    await expect(
      Effect.runPromise(
        resolveServerEntry(Option.some("src/from-cli.ts"), root, "src/from-config.ts"),
      ),
    ).resolves.toBe(join(root, "src/from-cli.ts"));
  });
});
