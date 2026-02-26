/**
 * Tests for typedVitePlugin and createTypedViteResolver: plugin order and options pass-through.
 * See .docs/specs/httpapi-virtual-module-plugin/spec.md (Vite Plugin Integration Surface)
 * and testing-strategy.md (typedVitePlugin registration order and option wiring).
 */
import { describe, expect, it } from "vitest";
import { PluginManager } from "@typed/virtual-modules";
import type { VirtualModulePlugin } from "@typed/virtual-modules";
import {
  createTypedViteResolver,
  typedVitePlugin,
  type HttpApiVirtualModulePluginOptions,
} from "./index.js";

function fakeHttpApiPlugin(opts: HttpApiVirtualModulePluginOptions): VirtualModulePlugin {
  return {
    name: "httpapi-virtual-module",
    shouldResolve: () => false,
    build: () => "",
    _testOpts: opts,
  } as VirtualModulePlugin & { _testOpts: HttpApiVirtualModulePluginOptions };
}

describe("createTypedViteResolver", () => {
  it("always registers router and HttpApi VM plugins", () => {
    const resolver = createTypedViteResolver({});
    expect(resolver).toBeInstanceOf(PluginManager);
    const manager = resolver as PluginManager;
    expect(manager.plugins).toHaveLength(2);
    expect(manager.plugins[0].name).toBe("router-virtual-module");
    expect(manager.plugins[1].name).toBe("httpapi-virtual-module");
  });

  it("uses DI override for HttpApi plugin when provided", () => {
    const resolver = createTypedViteResolver(
      { apiVmOptions: { prefix: "api:" } },
      { createHttpApiVirtualModulePlugin: fakeHttpApiPlugin },
    );
    const manager = resolver as PluginManager;
    expect(manager.plugins).toHaveLength(2);
    expect(manager.plugins[0].name).toBe("router-virtual-module");
    expect(manager.plugins[1].name).toBe("httpapi-virtual-module");
    const apiPlugin = manager.plugins[1] as VirtualModulePlugin & {
      _testOpts: HttpApiVirtualModulePluginOptions;
    };
    expect(apiPlugin._testOpts).toEqual({ prefix: "api:" });
  });

  it("passes apiVmOptions through to createHttpApiVirtualModulePlugin", () => {
    const opts: HttpApiVirtualModulePluginOptions = { custom: "value", count: 1 };
    const resolver = createTypedViteResolver(
      { apiVmOptions: opts },
      { createHttpApiVirtualModulePlugin: fakeHttpApiPlugin },
    );
    const manager = resolver as PluginManager;
    const apiPlugin = manager.plugins[1] as VirtualModulePlugin & {
      _testOpts: HttpApiVirtualModulePluginOptions;
    };
    expect(apiPlugin._testOpts).toEqual(opts);
  });

  it("uses routerVmOptions for the router plugin", () => {
    const resolver = createTypedViteResolver({
      routerVmOptions: { prefix: "routes:", name: "custom-router" },
    });
    const manager = resolver as PluginManager;
    expect(manager.plugins).toHaveLength(2);
    expect(manager.plugins[0].name).toBe("custom-router");
    expect(manager.plugins[1].name).toBe("httpapi-virtual-module");
  });
});

describe("typedVitePlugin", () => {
  it("returns a non-empty plugin array", () => {
    const plugins = typedVitePlugin();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
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
});
