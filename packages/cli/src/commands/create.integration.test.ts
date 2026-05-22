import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
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
    expect(existsSync(join(target, "packages/app/src/.dependencies.ts"))).toBe(false);
    expect(existsSync(join(target, "packages/app/src/.layout.ts"))).toBe(false);
    expect(existsSync(join(target, "vmc.config.ts"))).toBe(true);
  });

  it("substitutes package names and uses framework virtual modules", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });
    const appPackage = readFileSync(join(target, "packages/app/package.json"), "utf8");
    const serverEntry = readFileSync(join(target, "packages/app/src/entry.server.ts"), "utf8");
    const browserEntry = readFileSync(join(target, "packages/app/src/entry.browser.ts"), "utf8");
    const indexHtml = readFileSync(join(target, "packages/app/src/index.html"), "utf8");
    const apiEntry = readFileSync(join(target, "packages/app/src/api/status.ts"), "utf8");
    const routeEntry = readFileSync(join(target, "packages/app/src/routes/index.ts"), "utf8");
    const typedConfig = readFileSync(join(target, "typed.config.ts"), "utf8");
    const vmcConfig = readFileSync(join(target, "vmc.config.ts"), "utf8");
    const tsconfig = readFileSync(join(target, "tsconfig.json"), "utf8");

    expect(appPackage).toContain('"name": "@demo-app/app"');
    expect(serverEntry).toContain(
      "typed:server?routes=./routes&api=./api&html=./index.html&client=./entry.browser.ts",
    );
    expect(serverEntry).toContain("typed:env");
    expect(serverEntry).toContain("typed:config");
    expect(serverEntry).toContain("export default handler");
    expect(serverEntry).toContain("export { run }");
    expect(browserEntry).toContain("typed:browser?routes=./routes");
    expect(browserEntry).toContain("Effect.runPromise");
    expect(browserEntry).toContain('from "effect/Effect"');
    expect(indexHtml).toContain('id="typed-root"');
    expect(indexHtml).not.toContain('id="app"');
    expect(routeEntry).toContain('from "@typed/fx"');
    expect(routeEntry).toContain('type { Handler } from "./$route-types"');
    expect(routeEntry).toContain("Fx.fn");
    expect(routeEntry).toContain("satisfies Handler");
    expect(routeEntry).toContain('from "@typed/template"');
    expect(routeEntry).toContain("html`");
    expect(apiEntry).toContain('type { RawHandler } from "./$api-types"');
    expect(apiEntry).toContain('from "effect/unstable/http/HttpServerResponse"');
    expect(apiEntry).toContain("Effect.fn");
    expect(apiEntry).toContain("satisfies RawHandler");
    expect(apiEntry).not.toContain('from "@typed/app/httpapi/ApiHandler"');
    expect(apiEntry).not.toContain('from "@typed/app"');
    expect(typedConfig).toContain('from "@typed/app/config/defineConfig"');
    expect(typedConfig).not.toContain('from "@typed/app"');
    expect(vmcConfig).toContain('from "@typed/app/BrowserVirtualModulePlugin"');
    expect(vmcConfig).toContain("createBrowserVirtualModulePlugin()");
    expect(vmcConfig).toContain("createConfigVirtualModulePlugin()");
    expect(vmcConfig).toContain("createEnvVirtualModulePlugin()");
    expect(vmcConfig).toContain("createHtmlVirtualModulePlugin()");
    expect(vmcConfig).toContain("createHttpApiVirtualModulePlugin()");
    expect(vmcConfig).not.toContain("createRouteHandlersVirtualModulePlugin");
    expect(vmcConfig).toContain("createRouterVirtualModulePlugin()");
    expect(vmcConfig).toContain("createServerVirtualModulePlugin()");
    expect(vmcConfig).not.toContain('from "@typed/app";');
    expect(tsconfig).toContain('"name": "@typed/virtual-modules-ts-plugin"');
    expect(tsconfig).toContain('"vmcConfigPath": "./vmc.config.ts"');
  });

  it("uses publishable package ranges for standalone installs", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });
    const rootPackage = readFileSync(join(target, "package.json"), "utf8");
    const appPackage = readFileSync(join(target, "packages/app/package.json"), "utf8");

    expect(rootPackage).not.toContain("catalog:");
    expect(rootPackage).not.toContain('"@typed/cli": "workspace:*"');
    expect(rootPackage).toContain('"@typed/app": "^1.0.0-beta.4"');
    expect(rootPackage).toContain('"@typed/cli": "^1.0.0-beta.4"');
    expect(rootPackage).toContain('"@typed/fx": "^2.0.0-beta.4"');
    expect(rootPackage).toContain('"@types/node": "^25.7.0"');
    expect(rootPackage).toContain('"@typed/router": "^1.0.0-beta.4"');
    expect(rootPackage).toContain('"@typed/tsconfig": "^1.0.0-beta.4"');
    expect(rootPackage).not.toContain('"@typed/ui"');
    expect(rootPackage).toContain('"@typed/virtual-modules-compiler": "^1.0.0-beta.4"');
    expect(rootPackage).toContain('"@typed/virtual-modules-ts-plugin": "^1.0.0-beta.4"');
    expect(rootPackage).toContain('"@typed/vite-plugin": "^1.0.0-beta.4"');
    expect(rootPackage).toContain('"effect": "4.0.0-beta.66"');
    expect(rootPackage).toContain('"vite": "8.0.12"');
    expect(appPackage).not.toContain("catalog:");
    expect(appPackage).not.toContain('"@typed/app": "workspace:*"');
    expect(appPackage).toContain('"@demo-app/shared": "workspace:*"');
    expect(appPackage).toContain('"@typed/fx": "^2.0.0-beta.4"');
    expect(appPackage).toContain('"@typed/router": "^1.0.0-beta.4"');
    expect(appPackage).not.toContain('"@typed/ui"');
    expect(appPackage).not.toContain('"@typed/vite-plugin"');
    expect(appPackage).not.toContain('"vite"');
    expect(appPackage).toContain('"build": "cd ../.. && pnpm build"');
  });

  it("uses the RealWorld-proven build commands", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });
    const rootPackage = readFileSync(join(target, "package.json"), "utf8");

    expect(rootPackage).toContain('"dev": "vite --host 127.0.0.1"');
    expect(rootPackage).toContain('"build": "vmc -p tsconfig.json && typed build"');
    expect(rootPackage).toContain('"preview": "typed preview"');
    expect(rootPackage).not.toContain("typed build --entry");
    expect(rootPackage).not.toContain("typed serve --entry");
  });

  it("does not copy generated install artifacts", () => {
    const root = tempRoot();
    const target = scaffoldTypedWorkspace({ cwd: root, name: "demo-app" });

    expect(existsSync(join(target, "node_modules"))).toBe(false);
    expect(existsSync(join(target, "pnpm-lock.yaml"))).toBe(false);
  });

  it("keeps generated install artifacts out of the source template", () => {
    const templateRoot = join(__dirname, "../../templates/starter");

    expect(readdirSync(templateRoot)).not.toContain("node_modules");
    expect(existsSync(join(templateRoot, "pnpm-lock.yaml"))).toBe(false);
  });
});
