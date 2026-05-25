import type * as vscode from "vscode";
import { describe, expect, it, vi } from "vitest";

interface MockDocument {
  readonly getText: () => string;
}

const workspaceFolders: vscode.WorkspaceFolder[] = [
  { uri: { fsPath: "/repo" } as vscode.Uri, name: "repo", index: 0 },
];
let foundFiles: vscode.Uri[] = [];
const documentTextByPath = new Map<string, string>();

vi.mock("vscode", () => ({
  EventEmitter: class EventEmitter<T> {
    readonly event = vi.fn();
    fire = vi.fn<(value: T | undefined) => void>();
  },
  RelativePattern: class RelativePattern {
    constructor(
      readonly base: vscode.WorkspaceFolder,
      readonly pattern: string,
    ) {}
  },
  TreeItemCollapsibleState: {
    Expanded: 2,
    None: 0,
  },
  workspace: {
    findFiles: vi.fn(async () => foundFiles),
    openTextDocument: vi.fn(async (uri: vscode.Uri): Promise<MockDocument> => ({
      getText: () => documentTextByPath.get(uri.fsPath) ?? "",
    })),
    workspaceFolders,
  },
}));

describe("createVirtualModulesTreeProvider", () => {
  it("resolves discovered imports with the importer's nearest project root", async () => {
    const { createVirtualModulesTreeProvider } = await import("./VirtualModulesTreeProvider.js");
    const importer = "/repo/examples/realworld/src/browser.ts";
    const resolverRoots: string[] = [];
    const resolved: Array<readonly [string, string, string]> = [];
    foundFiles = [uri(importer)];
    documentTextByPath.set(
      importer,
      'import { hydrate } from "typed:browser?routes=./routes";',
    );

    const provider = createVirtualModulesTreeProvider({
      getProjectRoot: (filePath) =>
        filePath.startsWith("/repo/examples/realworld/")
          ? "/repo/examples/realworld"
          : "/repo",
      getResolver: (projectRoot) => {
        resolverRoots.push(projectRoot);
        return {
          clearProgramCache: () => undefined,
          getPluginSpecifiers: () => [],
          resolve: (id: string, importerPath: string) =>
            projectRoot === "/repo/examples/realworld"
              ? {
                  pluginName: "typed-browser-virtual-module",
                  sourceText: `export const id = ${JSON.stringify(id)};`,
                  virtualFileName:
                    "/repo/examples/realworld/node_modules/.typed/virtual/browser.ts",
                }
              : undefined,
        };
      },
      onResolved: (projectRoot, moduleId, importerPath) => {
        resolved.push([projectRoot, moduleId, importerPath]);
      },
    });

    const children = await provider.getChildren();

    expect(resolverRoots).toContain("/repo/examples/realworld");
    expect(children).toEqual([
      {
        type: "leaf",
        moduleId: "typed:browser?routes=./routes",
        importer,
        folder: workspaceFolders[0],
      },
    ]);
    expect(resolved).toEqual([
      ["/repo/examples/realworld", "typed:browser?routes=./routes", importer],
    ]);
  });
});

function uri(fsPath: string): vscode.Uri {
  return {
    scheme: "file",
    authority: "",
    path: fsPath,
    query: "",
    fragment: "",
    fsPath,
    with: () => uri(fsPath),
    toJSON: () => ({ $mid: 1, fsPath, path: fsPath, scheme: "file" }),
    toString: () => `file://${fsPath}`,
  } as vscode.Uri;
}
