import * as vscode from "vscode";
import { VIRTUAL_MODULE_URI_SCHEME } from "@typed/virtual-modules";
import type { createResolver } from "./resolver";

const SCHEME = "virtual-module";

/** Prefix VSCode uses when converting non-file URIs to tsserver paths. Query params are dropped. */
export const IN_MEMORY_RESOURCE_PREFIX = "^";
export const EMPTY_AUTHORITY = "ts-nul-authority";

export interface VirtualModuleProviderOptions {
  getResolver: (projectRoot: string) => ReturnType<typeof createResolver>;
  /** Emitter for onDidChange; extension owns it and fires when virtual module content may have changed. */
  onDidChangeEmitter?: vscode.EventEmitter<vscode.Uri>;
  /** Called when a virtual module is successfully resolved; use to register for refresh. */
  onResolved?: (moduleId: string, importer: string) => void;
  /** Lookup content by virtual file path (for path-based URIs that survive tsserver's toTsFilePath). */
  getContentByVirtualPath?: (virtualPath: string) => string | undefined;
}

function parseVirtualModuleUri(
  uri: vscode.Uri,
): { moduleId: string; importer: string } | { virtualPath: string } | undefined {
  const pathBased = tryParsePathBasedUri(uri);
  if (pathBased) return pathBased;

  const params = new URLSearchParams(uri.query);
  const moduleId = params.get("id");
  const importer = params.get("importer");
  if (!moduleId || !importer) return undefined;
  return { moduleId, importer };
}

/** Path-based: virtual-module:///path/to/__virtual_plugin_hash.ts (path survives toTsFilePath). */
function tryParsePathBasedUri(uri: vscode.Uri): { virtualPath: string } | undefined {
  if (uri.scheme !== SCHEME) return undefined;
  const path = uri.path;
  if (!path || !path.includes("__virtual_")) return undefined;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return { virtualPath: normalized.replace(/^\/+/, "/") };
}

/**
 * TextDocumentContentProvider for virtual-module: scheme.
 * URIs: virtual-module:?id=virtual%3Afoo&importer=file%3A%2F%2F%2Fpath%2Fto%2Fentry.ts
 */
export function createVirtualModuleProvider(
  options: VirtualModuleProviderOptions,
): vscode.TextDocumentContentProvider {
  const { getResolver, onDidChangeEmitter, onResolved } = options;

  return {
    ...(onDidChangeEmitter && { onDidChange: onDidChangeEmitter.event }),
    provideTextDocumentContent(
      uri: vscode.Uri,
      _token: vscode.CancellationToken,
    ): string | undefined {
      const parsed = parseVirtualModuleUri(uri);
      if (!parsed) return undefined;

      if ("virtualPath" in parsed) {
        return options.getContentByVirtualPath?.(parsed.virtualPath);
      }

      const { moduleId, importer } = parsed;
      const projectRoot = getProjectRootFromFile(importer);
      if (!projectRoot) return undefined;

      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(moduleId, importer);
      if (result) onResolved?.(moduleId, importer);
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
 * Build a virtual-module URI. Uses virtualFileName in the path so VSCode's
 * toTsFilePath preserves it when sending to tsserver (query params are dropped).
 */
export function buildVirtualModuleUri(
  moduleId: string,
  importer: string,
  resolverResult?: { virtualFileName: string },
): vscode.Uri {
  if (resolverResult) {
    const path = resolverResult.virtualFileName.startsWith("/")
      ? resolverResult.virtualFileName
      : `/${resolverResult.virtualFileName}`;
    return vscode.Uri.parse(`${SCHEME}:/${path}`);
  }
  const params = new URLSearchParams({ id: moduleId, importer });
  return vscode.Uri.parse(`${SCHEME}:///module.ts?${params.toString()}`);
}

/** Build typed-virtual:// URI with id and importer in query (for FileSystemProvider refresh). */
export function buildTypedVirtualUri(moduleId: string, importer: string): vscode.Uri {
  const params = new URLSearchParams({ id: moduleId, importer });
  return vscode.Uri.parse(`${VIRTUAL_MODULE_URI_SCHEME}://0/module.ts?${params.toString()}`);
}
