import * as path from "node:path";
import * as vscode from "vscode";
import { buildVirtualModuleUri } from "./VirtualModuleProvider";
import type { createResolver } from "./resolver";

const VIRTUAL_IMPORT_REGEX = /(?:from|import\s*\(?)\s*["'](virtual:[^"']+)["']/g;

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
}

export interface VirtualModulesTreeProvider
  extends vscode.TreeDataProvider<VirtualModuleTreeItem> {
  refresh(): void;
}

async function discoverVirtualImports(
  folder: vscode.WorkspaceFolder,
  getResolver: (projectRoot: string) => ReturnType<typeof createResolver>,
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
        items.push({ moduleId, importer });
      }
    }
  }

  return items;
}

export function createVirtualModulesTreeProvider(
  options: VirtualModulesTreeProviderOptions,
): VirtualModulesTreeProvider {
  const { getResolver } = options;

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
      const items = await discoverVirtualImports(folder, getResolver);
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

      const uri = buildVirtualModuleUri(element.moduleId, element.importer);
      const importerBasename = path.basename(element.importer);
      return {
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        label: element.moduleId,
        description: importerBasename,
        command: {
          command: "vscode.open",
          arguments: [uri],
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
