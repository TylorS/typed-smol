/**
 * Tests for typedVitePlugin and createTypedViteResolver: plugin order and options pass-through.
 * See .docs/specs/httpapi-virtual-module-plugin/spec.md (Vite Plugin Integration Surface)
 * and testing-strategy.md (typedVitePlugin registration order and option wiring).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PluginManager } from "@typed/virtual-modules";
import type { VirtualModulePlugin } from "@typed/virtual-modules";
import {
  createTypedViteResolver,
  typedVitePlugin,
  type HttpApiVirtualModulePluginOptions,
} from "./index.js";
import { createSsrRunnableEnvironment } from "./vaviteIntegration.js";

function fakeHttpApiPlugin(opts: HttpApiVirtualModulePluginOptions): VirtualModulePlugin {
  return {
    name: "httpapi-virtual-module",
    shouldResolve: () => false,
    build: () => "",
    _testOpts: opts,
  } as VirtualModulePlugin & { _testOpts: HttpApiVirtualModulePluginOptions };
}

describe("createTypedViteResolver", () => {
  it("always registers all app VM plugins", () => {
    const resolver = createTypedViteResolver({});
    expect(resolver).toBeInstanceOf(PluginManager);
    const manager = resolver as PluginManager;
    expect(manager.plugins.map((plugin) => plugin.name)).toEqual([
      "router-virtual-module",
      "route-handlers-virtual-module",
      "httpapi-virtual-module",
      "typed-env-virtual-module",
      "typed-config-virtual-module",
      "typed-html-virtual-module",
      "typed-server-virtual-module",
      "typed-browser-virtual-module",
      "typed-storybook-virtual-module",
    ]);
  });

  it("uses DI override for HttpApi plugin when provided", () => {
    const resolver = createTypedViteResolver(
      { apiVmOptions: { prefix: "typed:custom-api" } },
      { createHttpApiVirtualModulePlugin: fakeHttpApiPlugin },
    );
    const manager = resolver as PluginManager;
    expect(manager.plugins).toHaveLength(9);
    expect(manager.plugins[0].name).toBe("router-virtual-module");
    expect(manager.plugins[1].name).toBe("route-handlers-virtual-module");
    expect(manager.plugins[2].name).toBe("httpapi-virtual-module");
    const apiPlugin = manager.plugins[2] as VirtualModulePlugin & {
      _testOpts: HttpApiVirtualModulePluginOptions;
    };
    expect(apiPlugin._testOpts).toEqual({ prefix: "typed:custom-api" });
  });

  it("passes apiVmOptions through to createHttpApiVirtualModulePlugin", () => {
    const opts: HttpApiVirtualModulePluginOptions = { custom: "value", count: 1 };
    const resolver = createTypedViteResolver(
      { apiVmOptions: opts },
      { createHttpApiVirtualModulePlugin: fakeHttpApiPlugin },
    );
    const manager = resolver as PluginManager;
    const apiPlugin = manager.plugins[2] as VirtualModulePlugin & {
      _testOpts: HttpApiVirtualModulePluginOptions;
    };
    expect(apiPlugin._testOpts).toEqual(opts);
  });

  it("uses routerVmOptions for the router plugin", () => {
    const resolver = createTypedViteResolver({
      routerVmOptions: { prefix: "routes:", name: "custom-router" },
    });
    const manager = resolver as PluginManager;
    expect(manager.plugins).toHaveLength(9);
    expect(manager.plugins[0].name).toBe("custom-router");
    expect(manager.plugins[1].name).toBe("route-handlers-virtual-module");
    expect(manager.plugins[2].name).toBe("httpapi-virtual-module");
  });
});

describe("typedVitePlugin", () => {
  it("imports @typed/app helpers through narrow subpaths", () => {
    const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    expect(source).not.toContain('from "@typed/app";');
    expect(source).not.toContain('from "@typed/app"');
  });

  it("returns a non-empty plugin array", () => {
    const plugins = typedVitePlugin();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it("enables Vite-native tsconfig path resolution without vite-tsconfig-paths", () => {
    const plugins = typedVitePlugin({ compression: false });
    const tsconfigPlugin = plugins.find(
      (plugin) => (plugin as { name?: string }).name === "typed-vite:native-tsconfig-paths",
    );
    const config = {};

    expect(
      plugins.some((plugin) => (plugin as { name?: string }).name === "vite-tsconfig-paths"),
    ).toBe(false);
    expect(tsconfigPlugin).toBeDefined();
    (tsconfigPlugin as { config: (config: Record<string, any>) => void }).config(config);
    expect(config).toEqual({ resolve: { tsconfigPaths: true } });
  });

  it("does not configure native tsconfig path resolution when disabled", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });

    expect(
      plugins.some(
        (plugin) => (plugin as { name?: string }).name === "typed-vite:native-tsconfig-paths",
      ),
    ).toBe(false);
  });

  it("returns virtual-modules plugin with resolveId and load", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });
    const virtualPlugin = plugins.find(
      (p) =>
        p &&
        typeof p === "object" &&
        "name" in p &&
        (p as { name?: string }).name === "virtual-modules",
    );
    expect(virtualPlugin).toBeDefined();
  });

  it("registers the template transform before virtual modules", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });
    const names = plugins.map((plugin) => (plugin as { name?: string }).name);

    expect(names.indexOf("typed-template")).toBeGreaterThanOrEqual(0);
    expect(names.indexOf("typed-template")).toBeLessThan(names.indexOf("virtual-modules"));
  });

  it("registers the route transform after templates and before virtual modules", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });
    const names = plugins.map((plugin) => (plugin as { name?: string }).name);

    expect(names.indexOf("typed-route")).toBeGreaterThan(names.indexOf("typed-template"));
    expect(names.indexOf("typed-route")).toBeLessThan(names.indexOf("virtual-modules"));
  });

  it("does not register the template transform when disabled", () => {
    const plugins = typedVitePlugin({
      compression: false,
      templates: false,
      tsconfigPaths: false,
    });

    expect(plugins.map((plugin) => (plugin as { name?: string }).name)).not.toContain(
      "typed-template",
    );
  });

  it("does not register the route transform when disabled", () => {
    const plugins = typedVitePlugin({
      compression: false,
      routes: false,
      tsconfigPaths: false,
    });

    expect(plugins.map((plugin) => (plugin as { name?: string }).name)).not.toContain(
      "typed-route",
    );
  });

  it("auto-creates LS-backed session when createTypeInfoApiSession is not provided", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });
    const virtualPlugin = plugins.find(
      (p) =>
        p &&
        typeof p === "object" &&
        "name" in p &&
        (p as { name?: string }).name === "virtual-modules",
    );
    expect(virtualPlugin).toBeDefined();
    expect(virtualPlugin).toHaveProperty("resolveId");
    expect(virtualPlugin).toHaveProperty("load");
  });

  it("does not add vavite when no server entry is configured", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });

    expect(plugins.some((plugin) => (plugin as { name?: string }).name === "vavite")).toBe(false);
  });

  it("adds vavite when serverEntry is configured", () => {
    const plugins = typedVitePlugin({
      tsconfigPaths: false,
      compression: false,
      serverEntry: "/src/entry.server.ts",
    });

    expect(plugins.some((plugin) => (plugin as { name?: string }).name === "vavite")).toBe(true);
  });

  it("configures the ssr environment as runnable for vavite dev entries", () => {
    const plugins = typedVitePlugin({
      tsconfigPaths: false,
      compression: false,
      serverEntry: "/src/entry.server.ts",
    });
    const runnablePlugin = plugins.find(
      (plugin) => (plugin as { name?: string }).name === "typed-vavite:ssr-runnable-environment",
    );
    const config = {};

    expect(runnablePlugin).toBeDefined();
    (runnablePlugin as { config: (config: Record<string, any>) => void }).config(config);

    expect(config).toEqual({
      environments: {
        ssr: {
          dev: {
            createEnvironment: createSsrRunnableEnvironment,
          },
        },
      },
    });
  });

  it("does not apply vavite while Vite is running tests", () => {
    const plugins = typedVitePlugin({
      tsconfigPaths: false,
      compression: false,
      serverEntry: "/src/entry.server.ts",
    });
    const vavitePlugin = plugins.find((plugin) => (plugin as { name?: string }).name === "vavite");
    const apply = (vavitePlugin as { apply?: unknown } | undefined)?.apply;

    expect(typeof apply).toBe("function");
    expect(
      (apply as (config: unknown, env: { readonly mode: string }) => boolean)({}, { mode: "test" }),
    ).toBe(false);
    expect(
      (apply as (config: unknown, env: { readonly mode: string }) => boolean)(
        {},
        { mode: "development" },
      ),
    ).toBe(true);
  });
});
