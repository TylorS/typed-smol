import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scaffoldTypedWorkspace } from "../create/scaffold.js";

const tempDirs: string[] = [];

function tempRoot() {
  const root = mkdtempSync(join(process.cwd(), "tmp-typed-create-"));
  tempDirs.push(root);
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

describe("typed create", () => {
  it("scaffolds a minimal multi-package pnpm workspace", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });

    expect(existsSync(join(target, "pnpm-workspace.yaml"))).toBe(true);
    expect(existsSync(join(target, "packages/app/package.json"))).toBe(true);
    expect(existsSync(join(target, "packages/shared/package.json"))).toBe(true);
    expect(existsSync(join(target, "packages/app/src/entry.server.ts"))).toBe(true);
    expect(existsSync(join(target, "packages/app/src/entry.browser.ts"))).toBe(true);
  });

  it("substitutes package names and uses framework virtual modules", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });
    const appPackage = readFileSync(join(target, "packages/app/package.json"), "utf8");
    const serverEntry = readFileSync(join(target, "packages/app/src/entry.server.ts"), "utf8");
    const browserEntry = readFileSync(join(target, "packages/app/src/entry.browser.ts"), "utf8");

    expect(appPackage).toContain('"name": "@demo-app/app"');
    expect(serverEntry).toContain('typed:server?routes=./routes&api=./api&html=./index.html&client=./entry.browser.ts');
    expect(serverEntry).toContain('typed:env');
    expect(serverEntry).toContain('typed:config');
    expect(serverEntry).toContain("Effect.runPromise");
    expect(browserEntry).toContain('typed:browser?routes=*');
    expect(browserEntry).toContain("Effect.runPromise");
  });

  it("uses publishable package ranges for standalone installs", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });
    const rootPackage = readFileSync(join(target, "package.json"), "utf8");
    const appPackage = readFileSync(join(target, "packages/app/package.json"), "utf8");

    expect(rootPackage).not.toContain("catalog:");
    expect(rootPackage).not.toContain('"@typed/cli": "workspace:*"');
    expect(rootPackage).toContain('"@typed/cli": "^1.0.0-beta.4"');
    expect(appPackage).not.toContain("catalog:");
    expect(appPackage).not.toContain('"@typed/app": "workspace:*"');
    expect(appPackage).toContain('"@demo-app/shared": "workspace:*"');
    expect(appPackage).toContain('"@typed/router": "^1.0.0-beta.4"');
  });

  it("does not copy generated install artifacts", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });

    expect(existsSync(join(target, "node_modules"))).toBe(false);
    expect(existsSync(join(target, "pnpm-lock.yaml"))).toBe(false);
  });
});
