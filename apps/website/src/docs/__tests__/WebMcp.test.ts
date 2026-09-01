import { beforeEach, describe, expect, it, vi } from "vitest";

const { symbol } = vi.hoisted(() => ({ symbol: vi.fn() }));

vi.mock("../../agent/Operations.js", () => ({
  operations: {
    search: vi.fn(),
    symbol,
  },
}));

import { registerWebMcp } from "../../agent/WebMcp.js";

describe("WebMCP", () => {
  beforeEach(() => symbol.mockReset());

  it("registers a document-lifetime current-symbol tool that reads the exact landmark ID", async () => {
    const tools = new Map<
      string,
      { readonly execute: (input: Record<string, unknown>) => unknown }
    >();
    const document = {
      documentElement: { dataset: { siteBase: "/typed-smol/" } },
      baseURI: "https://example.test/typed-smol/reference/example",
      modelContext: {
        registerTool(tool: {
          readonly name: string;
          readonly execute: (input: Record<string, unknown>) => unknown;
        }) {
          tools.set(tool.name, tool);
        },
      },
      querySelector: vi.fn(() => ({ dataset: { symbolId: "@typed/template/many#many" } })),
      querySelectorAll: vi.fn(() => []),
    } as unknown as Document;
    const payload = { id: "@typed/template/many#many", canonicalId: "@typed/template#many" };
    symbol.mockResolvedValue(payload);

    registerWebMcp(document);

    const current = tools.get("get_current_symbol");
    expect(current).toBeDefined();
    await expect(current!.execute({})).resolves.toEqual(payload);
    expect(symbol).toHaveBeenCalledWith("@typed/template/many#many", "/typed-smol/");
  });

  it("passes the static deployment base to an explicitly requested symbol", async () => {
    const tools = new Map<
      string,
      { readonly execute: (input: Record<string, unknown>) => unknown }
    >();
    const document = {
      documentElement: { dataset: { siteBase: "/typed-smol/" } },
      baseURI: "https://example.test/typed-smol/reference/example",
      modelContext: {
        registerTool(tool: {
          readonly name: string;
          readonly execute: (input: Record<string, unknown>) => unknown;
        }) {
          tools.set(tool.name, tool);
        },
      },
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
    } as unknown as Document;
    const payload = { id: "@typed/template/many#many", canonicalId: "@typed/template#many" };
    symbol.mockResolvedValue(payload);

    registerWebMcp(document);

    await expect(tools.get("get_symbol")!.execute({ id: payload.id })).resolves.toEqual(payload);
    expect(symbol).toHaveBeenCalledWith(payload.id, "/typed-smol/");
  });

  it("discovers related links below a static deployment base", () => {
    const tools = new Map<string, { readonly execute: () => unknown }>();
    const anchors = [
      { href: "https://example.test/typed-smol/explore/fx-push-reactivity", textContent: "Fx" },
      { href: "https://example.test/typed-smol/glossary#fx", textContent: "Glossary" },
      { href: "https://effect.website/docs", textContent: "Effect" },
    ];
    const document = {
      documentElement: { dataset: { siteBase: "/typed-smol/" } },
      baseURI: "https://example.test/typed-smol/",
      modelContext: {
        registerTool(tool: { readonly name: string; readonly execute: () => unknown }) {
          tools.set(tool.name, tool);
        },
      },
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => anchors),
    } as unknown as Document;

    registerWebMcp(document);

    expect(tools.get("get_related_docs")!.execute()).toEqual([
      { href: anchors[0]!.href, title: "Fx" },
      { href: anchors[1]!.href, title: "Glossary" },
    ]);
  });

  it("returns one cleanup that unregisters every document tool", () => {
    const unregister = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    let index = 0;
    const document = {
      documentElement: { dataset: { siteBase: "/" } },
      baseURI: "https://example.test/",
      modelContext: {
        registerTool() {
          return unregister[index++]!;
        },
      },
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
    } as unknown as Document;

    const cleanup = registerWebMcp(document);
    cleanup();
    cleanup();

    for (const unregisterTool of unregister) expect(unregisterTool).toHaveBeenCalledOnce();
  });
});
