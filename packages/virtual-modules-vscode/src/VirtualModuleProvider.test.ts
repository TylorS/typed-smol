import { fileURLToPath } from "node:url";
import type * as vscode from "vscode";
import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  Uri: {
    parse: (input: string) => parseUri(input),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: "/workspace" } }],
  },
}));

describe("createVirtualModuleProvider", () => {
  it("resolves content with the nearest tsconfig project root for the importer", async () => {
    const { createVirtualModuleProvider } = await import("./VirtualModuleProvider.js");
    const roots: string[] = [];
    const provider = createVirtualModuleProvider({
      getProjectRoot: () => "/workspace/packages/app",
      getResolver: (projectRoot) => {
        roots.push(projectRoot);
        return {
          clearProgramCache: () => {},
          getPluginSpecifiers: () => [],
          resolve: (id: string, importer: string) => ({
            pluginName: "test-plugin",
            sourceText: `export const seen = ${JSON.stringify({ id, importer })};`,
            virtualFileName: "/workspace/packages/app/node_modules/.typed/virtual/test.ts",
          }),
        };
      },
    });

    const content = provider.provideTextDocumentContent(
      parseUri(
        "virtual-module:///module.ts?id=virtual%3Aroutes&importer=/workspace/packages/app/src/entry.ts",
      ),
      {} as never,
    );

    expect(roots).toEqual(["/workspace/packages/app"]);
    expect(content).toMatchInlineSnapshot(`"export const seen = {"id":"virtual:routes","importer":"/workspace/packages/app/src/entry.ts"};"`);
  });
});

function parseUri(input: string): vscode.Uri {
  const url = new URL(input);
  return {
    scheme: url.protocol.slice(0, -1),
    authority: url.host,
    path: url.pathname,
    query: url.search.slice(1),
    fragment: url.hash.slice(1),
    fsPath: url.protocol === "file:" ? fileURLToPath(input) : url.pathname,
    with: () => parseUri(input),
    toJSON: () => ({ $mid: 1, path: url.pathname, scheme: url.protocol.slice(0, -1) }),
    toString: () => input,
  };
}
