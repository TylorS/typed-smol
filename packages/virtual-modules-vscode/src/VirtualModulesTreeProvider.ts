import * as path from "node:path";
import * as vscode from "vscode";
import type { createResolver } from "./resolver";

/** Matches any virtual-style specifier (virtual:foo, router:./routes, etc.) in import/from. */
const VIRTUAL_IMPORT_REGEX = /(?:from|import\s*\(?)\s*["']([^"']+:[^"']+)["']/g;

export type VirtualModuleTreeItem = VirtualModuleFolderItem | VirtualModuleLeafItem;

export interface VirtualModuleFolderItem {
  type: "folder";
  folder: vscode.WorkspaceFolder;
  label: string;
}

export interface VirtualModuleLeafItem {
  type: "leaf";
  moduleId: string;
  importer: string;
  folder: vscode.WorkspaceFolder;
}

export interface VirtualModulesTreeProviderOptions {
  getResolver: (projectRoot: string) => ReturnType<typeof createResolver>;
  getProjectRoot: (filePath: string) => string | undefined;
  /** Called when a virtual module is discovered; use to register for refresh. */
  onResolved?: (projectRoot: string, moduleId: string, importer: string) => void;
  /** Called when resolved; use to cache for path-based preview. */
  onCache?: (result: { virtualFileName: string; sourceText: string }) => void;
}

export interface VirtualModulesTreeProvider
  extends vscode.TreeDataProvider<VirtualModuleTreeItem> {
  refresh(): void;
}

async function discoverVirtualImports(
  folder: vscode.WorkspaceFolder,
  getResolver: (projectRoot: string) => ReturnType<typeof createResolver>,
  onResolved?: (projectRoot: string, moduleId: string, importer: string) => void,
): Promise<Array<{ moduleId: string; importer: string }>> {
  const projectRoot = folder.uri.fsPath;
  const resolver = getResolver(projectRoot);

  const files = await vscode.workspace.findFiles(
    new vscode.RelativePattern(folder, "**/*.{ts,tsx,js,jsx,mts,cts}"),
    "{**/node_modules/**,**/.git/**}",
    1000,
  );

  const seen = new Set<string>();
  const items: Array<{ moduleId: string; importer: string }> = [];

  for (const uri of files) {
    const importer = uri.fsPath;
    let content: string;
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      content = doc.getText();
    } catch {
      continue;
    }

    let match: RegExpExecArray | null;
    VIRTUAL_IMPORT_REGEX.lastIndex = 0;
    while ((match = VIRTUAL_IMPORT_REGEX.exec(content)) !== null) {
      const moduleId = match[1];
      const key = `${moduleId}::${importer}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const result = resolver.resolve(moduleId, importer);
      if (result) {
        onResolved?.(projectRoot, moduleId, importer);
        items.push({ moduleId, importer });
      }
    }
  }

  return items;
}

export function createVirtualModulesTreeProvider(
  options: VirtualModulesTreeProviderOptions,
): VirtualModulesTreeProvider {
  const { getResolver, onResolved, onCache } = options;

  const _onDidChangeTreeData = new vscode.EventEmitter<
    VirtualModuleTreeItem | undefined
  >();
  const cache = new Map<
    string,
    Array<{ moduleId: string; importer: string }>
  >();

  async function loadCache(): Promise<void> {
    cache.clear();
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) return;

    for (const folder of folders) {
      const items = await discoverVirtualImports(folder, getResolver, onResolved);
      cache.set(folder.uri.fsPath, items);
    }
  }

  return {
    onDidChangeTreeData: _onDidChangeTreeData.event,

    async getChildren(element?: VirtualModuleTreeItem): Promise<VirtualModuleTreeItem[]> {
      if (!element) {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) return [];
        if (folders.length === 1) {
          await loadCache();
          const items = cache.get(folders[0].uri.fsPath) ?? [];
          return items.map(
            ({ moduleId, importer }): VirtualModuleLeafItem => ({
              type: "leaf",
              moduleId,
              importer,
              folder: folders[0],
            }),
          );
        }
        return folders.map(
          (f): VirtualModuleFolderItem => ({
            type: "folder",
            folder: f,
            label: f.name,
          }),
        );
      }

      if (element.type === "folder") {
        await loadCache();
        const items = cache.get(element.folder.uri.fsPath) ?? [];
        return items.map(
          ({ moduleId, importer }): VirtualModuleLeafItem => ({
            type: "leaf",
            moduleId,
            importer,
            folder: element.folder,
          }),
        );
      }

      return [];
    },

    getTreeItem(element: VirtualModuleTreeItem): vscode.TreeItem {
      if (element.type === "folder") {
        return {
          collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
          label: element.label,
          resourceUri: element.folder.uri,
        };
      }

      const projectRoot = element.folder.uri.fsPath;
      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(element.moduleId, element.importer);
      if (result) onCache?.(result);
      const importerBasename = path.basename(element.importer);
      return {
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        label: element.moduleId,
        description: importerBasename,
        command: {
          command: "typed.virtualModules.openFromTree",
          arguments: [element.moduleId, element.importer, projectRoot],
          title: "Open Virtual Module",
        },
      };
    },

    refresh(): void {
      cache.clear();
      _onDidChangeTreeData.fire(undefined);
    },
  };
}
