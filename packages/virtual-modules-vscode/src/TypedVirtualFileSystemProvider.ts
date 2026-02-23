import * as vscode from "vscode";
import { VIRTUAL_MODULE_URI_SCHEME } from "@typed/virtual-modules";
import type { createResolver } from "./resolver";

function parseTypedVirtualUri(uri: vscode.Uri): { id: string; importer: string } | undefined {
  if (uri.scheme !== VIRTUAL_MODULE_URI_SCHEME) return undefined;
  const params = new URLSearchParams(uri.query);
  const id = params.get("id");
  const importer = params.get("importer");
  if (!id || !importer) return undefined;
  return { id, importer };
}

export interface TypedVirtualFileSystemProviderOptions {
  getResolver: (projectRoot: string) => ReturnType<typeof createResolver>;
  getProjectRoot: (filePath: string) => string | undefined;
}

/**
 * FileSystemProvider for typed-virtual:// URIs so that Go to Definition
 * (from the TypeScript language service) opens virtual module content without
 * writing anything to disk.
 */
export function createTypedVirtualFileSystemProvider(
  options: TypedVirtualFileSystemProviderOptions,
): vscode.FileSystemProvider & {
  fireVirtualModuleChanges: (uris: vscode.Uri[]) => void;
} {
  const { getResolver, getProjectRoot } = options;
  const changeEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

  function fireVirtualModuleChanges(uris: vscode.Uri[]): void {
    if (uris.length > 0) {
      changeEmitter.fire(uris.map((uri) => ({ type: vscode.FileChangeType.Changed, uri })));
    }
  }

  const provider: vscode.FileSystemProvider = {
    onDidChangeFile: changeEmitter.event,

    readFile(uri: vscode.Uri): Uint8Array {
      const parsed = parseTypedVirtualUri(uri);
      if (!parsed) throw vscode.FileSystemError.FileNotFound(uri);
      const importerPath = parsed.importer.startsWith("file:")
        ? vscode.Uri.parse(parsed.importer).fsPath
        : parsed.importer;
      const projectRoot = getProjectRoot(importerPath);
      if (!projectRoot) throw vscode.FileSystemError.FileNotFound(uri);
      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(parsed.id, importerPath);
      if (!result) throw vscode.FileSystemError.FileNotFound(uri);
      return Buffer.from(result.sourceText, "utf8");
    },

    stat(uri: vscode.Uri): vscode.FileStat {
      const parsed = parseTypedVirtualUri(uri);
      if (!parsed) throw vscode.FileSystemError.FileNotFound(uri);
      const importerPath = parsed.importer.startsWith("file:")
        ? vscode.Uri.parse(parsed.importer).fsPath
        : parsed.importer;
      const projectRoot = getProjectRoot(importerPath);
      if (!projectRoot) throw vscode.FileSystemError.FileNotFound(uri);
      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(parsed.id, importerPath);
      if (!result) throw vscode.FileSystemError.FileNotFound(uri);
      const size = Buffer.byteLength(result.sourceText, "utf8");
      return { type: vscode.FileType.File, size, ctime: 0, mtime: 0 };
    },

    readDirectory(): [string, vscode.FileType][] {
      return [];
    },

    createDirectory(): void {
      throw vscode.FileSystemError.NoPermissions();
    },

    writeFile(): void {
      throw vscode.FileSystemError.NoPermissions();
    },

    delete(): void {
      throw vscode.FileSystemError.NoPermissions();
    },

    rename(): void {
      throw vscode.FileSystemError.NoPermissions();
    },

    watch(): vscode.Disposable {
      return new vscode.Disposable(() => {});
    },
  };

  return Object.assign(provider, { fireVirtualModuleChanges });
}
