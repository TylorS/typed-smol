import * as vscode from "vscode";
import {
  buildVirtualModuleUri,
  createVirtualModuleProvider,
} from "./VirtualModuleProvider";
import { createResolver } from "./resolver";
import {
  createVirtualModulesTreeProvider,
  type VirtualModulesTreeProvider,
} from "./VirtualModulesTreeProvider";

const SCHEME = "virtual-module";

export function activate(context: vscode.ExtensionContext): void {
  const resolversByRoot = new Map<string, ReturnType<typeof createResolver>>();

  function getResolver(projectRoot: string): ReturnType<typeof createResolver> {
    let r = resolversByRoot.get(projectRoot);
    if (!r) {
      r = createResolver(projectRoot);
      resolversByRoot.set(projectRoot, r);
    }
    return r;
  }

  const provider = createVirtualModuleProvider({
    getResolver,
  });

  const treeProvider: VirtualModulesTreeProvider = createVirtualModulesTreeProvider({
    getResolver,
    getProjectRoot,
  });
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("typedVirtualModules", treeProvider),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("typed.virtualModules.refresh", () => {
      treeProvider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider),
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.uri.scheme === SCHEME && doc.languageId !== "typescript") {
        void vscode.languages.setTextDocumentLanguage(doc, "typescript");
      }
    }),
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { language: "typescript", scheme: "file" },
      createVirtualModuleDefinitionProvider(getResolver, getProjectRoot),
    ),
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { language: "javascript", scheme: "file" },
      createVirtualModuleDefinitionProvider(getResolver, getProjectRoot),
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { language: "typescript", scheme: "file" },
      createVirtualModuleDocumentLinkProvider(getResolver, getProjectRoot),
    ),
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { language: "javascript", scheme: "file" },
      createVirtualModuleDocumentLinkProvider(getResolver, getProjectRoot),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("typed.virtualModules.open", async () => {
      const editor = vscode.window.activeTextEditor;
      const importer = editor?.document.uri.fsPath;
      if (!importer) {
        vscode.window.showErrorMessage("No active editor to use as importer.");
        return;
      }

      const moduleId = await vscode.window.showInputBox({
        prompt: "Virtual module ID (e.g. virtual:foo)",
        placeHolder: "virtual:foo",
      });
      if (!moduleId?.trim()) return;

      const projectRoot = getProjectRoot(importer);
      if (!projectRoot) {
        vscode.window.showErrorMessage("Could not determine project root.");
        return;
      }

      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(moduleId.trim(), importer);
      if (!result) {
        vscode.window.showErrorMessage(
          `Virtual module "${moduleId}" could not be resolved for ${importer}`,
        );
        return;
      }

      const uri = buildVirtualModuleUri(moduleId.trim(), importer);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: false });
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("typed.virtualModules.openFromImport", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const doc = editor.document;
      const pos = editor.selection.active;
      const line = doc.lineAt(pos.line).text;

      const match = line.match(
        /(?:from|import\s*\(?)\s*["'](virtual:[^"']+)["']/,
      );
      const moduleId = match?.[1];
      if (!moduleId) {
        vscode.window.showInformationMessage(
          "Place cursor on a virtual module import (e.g. import x from 'virtual:foo')",
        );
        return;
      }

      const importer = doc.uri.fsPath;
      const projectRoot = getProjectRoot(importer);
      if (!projectRoot) return;

      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(moduleId, importer);
      if (!result) {
        vscode.window.showErrorMessage(
          `Could not resolve virtual module "${moduleId}"`,
        );
        return;
      }

      const uri = buildVirtualModuleUri(moduleId, importer);
      const virtualDoc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(virtualDoc, { preview: false });
    }),
  );

}

function extractVirtualImportAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
): { moduleId: string; range: vscode.Range } | undefined {
  const line = document.lineAt(position.line).text;
  const regex = /(?:from|import\s*\(?)\s*["'](virtual:[^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    const moduleId = match[1];
    const start = new vscode.Position(position.line, match.index + match[0].indexOf(moduleId));
    const end = new vscode.Position(position.line, start.character + moduleId.length);
    const range = new vscode.Range(start, end);
    if (range.contains(position)) {
      return { moduleId, range };
    }
  }
  return undefined;
}

function createVirtualModuleDefinitionProvider(
  getResolver: (root: string) => ReturnType<typeof createResolver>,
  getProjectRoot: (path: string) => string | undefined,
): vscode.DefinitionProvider {
  return {
    provideDefinition(
      document: vscode.TextDocument,
      position: vscode.Position,
    ): vscode.DefinitionLink[] | vscode.Location[] | null {
      const extracted = extractVirtualImportAtPosition(document, position);
      if (!extracted) return null;

      const { moduleId } = extracted;
      const importer = document.uri.fsPath;
      const projectRoot = getProjectRoot(importer);
      if (!projectRoot) return null;

      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(moduleId, importer);
      if (!result) return null;

      const uri = buildVirtualModuleUri(moduleId, importer);
      return [new vscode.Location(uri, new vscode.Position(0, 0))];
    },
  };
}

function createVirtualModuleDocumentLinkProvider(
  getResolver: (root: string) => ReturnType<typeof createResolver>,
  getProjectRoot: (path: string) => string | undefined,
): vscode.DocumentLinkProvider {
  return {
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
      const links: vscode.DocumentLink[] = [];
      const importer = document.uri.fsPath;
      const projectRoot = getProjectRoot(importer);
      if (!projectRoot) return links;

      const resolver = getResolver(projectRoot);
      const regex = /(?:from|import\s*\(?)\s*["'](virtual:[^"']+)["']/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(document.getText())) !== null) {
        const moduleId = match[1];
        const result = resolver.resolve(moduleId, importer);
        if (!result) continue;

        const position = document.positionAt(match.index + match[0].indexOf(moduleId));
        const range = new vscode.Range(
          position,
          new vscode.Position(position.line, position.character + moduleId.length),
        );
        const uri = buildVirtualModuleUri(moduleId, importer);
        links.push(new vscode.DocumentLink(range, uri));
      }
      return links;
    },
  };
}

function getProjectRoot(filePath: string): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return undefined;
  const normalized = filePath.replace(/\\/g, "/");
  for (const folder of folders) {
    const root = folder.uri.fsPath.replace(/\\/g, "/");
    if (normalized.startsWith(root + "/") || normalized === root) {
      return root;
    }
  }
  return folders[0]?.uri.fsPath;
}

export function deactivate(): void {}
