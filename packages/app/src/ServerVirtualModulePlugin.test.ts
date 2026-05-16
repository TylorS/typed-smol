import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createServerVirtualModulePlugin } from "./index.js";

const tempDirs: string[] = [];

function createFixture(files: Readonly<Record<string, string>> = {}) {
  const root = mkdtempSync(join(process.cwd(), "tmp-server-vm-"));
  tempDirs.push(root);
  const src = join(root, "src");
  mkdirSync(src, { recursive: true });
  const importer = join(src, "entry.server.ts");
  writeFileSync(importer, "export {};", "utf8");
  for (const [path, text] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, text, "utf8");
  }
  return { root, importer };
}

const buildServer = (id: string, importer = createFixture().importer) =>
  createServerVirtualModulePlugin().build(id, importer, {} as never);

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

describe("ServerVirtualModulePlugin", () => {
  it("resolves valid typed:server ids", () => {
    const plugin = createServerVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:server?api=./api", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:server?name=app", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:browser?routes=*", "/project/src/entry.ts")).toBe(false);
  });

  it("emits run, handler, and ServerLayer exports for APIs and routes", () => {
    const source = buildServer("typed:server?api=./api&routes=./routes1&routes=./routes2") as string;

    expect(source).toContain('import * as Api0 from "api:./api";');
    expect(source).toContain('import * as Routes0 from "router:./routes1";');
    expect(source).toContain('import * as Routes1 from "router:./routes2";');
    expect(source).toContain("export const ServerLayer =");
    expect(source).toContain("export const handler =");
    expect(source).toContain("export async function run");
  });

  it("preserves source order for repeated api and routes parameters", () => {
    const source = buildServer("typed:server?routes=./routes&api=./api1&api=./api2") as string;

    expect(source.indexOf('import * as Routes0 from "router:./routes";')).toBeLessThan(
      source.indexOf('import * as Api0 from "api:./api1";'),
    );
    expect(source.indexOf('import * as Api0 from "api:./api1";')).toBeLessThan(
      source.indexOf('import * as Api1 from "api:./api2";'),
    );
  });

  it("emits a default html and client pairing", () => {
    const source = buildServer(
      "typed:server?routes=./routes&html=./index.html&client=./client.ts",
    ) as string;

    expect(source).toContain('import * as Html0 from "typed:html?path=./index.html";');
    expect(source).toContain('client: "./client.ts"');
    expect(source).toContain('name: "default"');
  });

  it("emits repeated MPA page pairings", () => {
    const source = buildServer(
      "typed:server?routes=./routes&page=home:./home.html:./home.ts&page=admin:./admin.html:./admin.ts",
    ) as string;

    expect(source).toContain('import * as Html0 from "typed:html?path=./home.html";');
    expect(source).toContain('import * as Html1 from "typed:html?path=./admin.html";');
    expect(source).toContain('name: "home"');
    expect(source).toContain('client: "./admin.ts"');
  });

  it("imports entry-adjacent named server companions when present", () => {
    const fixture = createFixture({
      "src/.dependencies.ts": "export const layers = [];",
      "src/.html.ts": "export const pages = [];",
    });
    const source = buildServer("typed:server?routes=./routes", fixture.importer) as string;

    expect(source).toContain('import * as ServerDependenciesCompanion from "./.dependencies";');
    expect(source).toContain('import * as ServerHtmlCompanion from "./.html";');
    expect(source).toContain("ServerDependenciesCompanion.layers");
    expect(source).toContain("ServerHtmlCompanion.pages");
    expect(source).not.toContain("_server");
  });

  it("returns parser diagnostics with the server plugin name", () => {
    const result = buildServer(
      "typed:server?routes=./routes&html=./index.html&page=home:./home.html:./home.ts",
    ) as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-SERVER-005",
        message: "typed:server cannot combine page pairings with top-level html or client options",
        pluginName: "typed-server-virtual-module",
      },
    ]);
  });
});
