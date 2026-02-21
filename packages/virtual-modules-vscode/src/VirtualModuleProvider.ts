import * as vscode from "vscode";
import type { createResolver } from "./resolver";

const SCHEME = "virtual-module";

export interface VirtualModuleProviderOptions {
  getResolver: (projectRoot: string) => ReturnType<typeof createResolver>;
}

function parseVirtualModuleUri(uri: vscode.Uri): { moduleId: string; importer: string } | undefined {
  const params = new URLSearchParams(uri.query);
  const moduleId = params.get("id");
  const importer = params.get("importer");
  if (!moduleId || !importer) return undefined;
  return { moduleId, importer };
}

/**
 * TextDocumentContentProvider for virtual-module: scheme.
 * URIs: virtual-module:?id=virtual%3Afoo&importer=file%3A%2F%2F%2Fpath%2Fto%2Fentry.ts
 */
export function createVirtualModuleProvider(
  options: VirtualModuleProviderOptions,
): vscode.TextDocumentContentProvider {
  const { getResolver } = options;

  return {
    provideTextDocumentContent(
      uri: vscode.Uri,
      _token: vscode.CancellationToken,
    ): string | undefined {
      const parsed = parseVirtualModuleUri(uri);
      if (!parsed) return undefined;
      const { moduleId, importer } = parsed;
      const projectRoot = getProjectRootFromFile(importer);
      if (!projectRoot) return undefined;

      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(moduleId, importer);
      return result?.sourceText;
    },
  };
}

function getProjectRootFromFile(filePathOrUri: string): string | undefined {
  const normalized = filePathOrUri.startsWith("file:")
    ? vscode.Uri.parse(filePathOrUri).fsPath
    : filePathOrUri;
  const { workspaceFolders } = vscode.workspace;
  if (!workspaceFolders?.length) return undefined;
  for (const folder of workspaceFolders) {
    const root = folder.uri.fsPath;
    if (normalized.startsWith(root + "/") || normalized === root) {
      return root;
    }
  }
  return workspaceFolders[0]?.uri.fsPath;
}

/**
 * Build a virtual-module URI. Uses a path with .d.ts so VS Code treats the
 * document as TypeScript for syntax highlighting and IntelliSense.
 */
export function buildVirtualModuleUri(moduleId: string, importer: string): vscode.Uri {
  const params = new URLSearchParams({ id: moduleId, importer });
  return vscode.Uri.parse(`${SCHEME}:///module.d.ts?${params.toString()}`);
}
