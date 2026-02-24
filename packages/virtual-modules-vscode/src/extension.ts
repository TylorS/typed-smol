import * as vscode from "vscode";
import { VIRTUAL_MODULE_URI_SCHEME } from "@typed/virtual-modules";
import { createTypedVirtualFileSystemProvider } from "./TypedVirtualFileSystemProvider";
import {
  buildTypedVirtualUri,
  buildVirtualModuleUri,
  createVirtualModuleProvider,
} from "./VirtualModuleProvider";
import { writeVirtualPreviewAndGetPath } from "./virtualPreviewDisk";
import { createResolver, getProjectRootForFile } from "./resolver";
import {
  createVirtualModulesTreeProvider,
  type VirtualModulesTreeProvider,
} from "./VirtualModulesTreeProvider";

const SCHEME = "virtual-module";
const REFRESH_DEBOUNCE_MS = 150;

export function activate(context: vscode.ExtensionContext): void {
  const resolversByRoot = new Map<string, ReturnType<typeof createResolver>>();
  const virtualModuleRegistry = new Map<string, Set<string>>();
  const contentByVirtualPath = new Map<string, string>();
  const onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  let refreshDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingRefreshRoots = new Set<string>();

  function cacheVirtualModule(result: { virtualFileName: string; sourceText: string }): void {
    const path = result.virtualFileName.startsWith("/")
      ? result.virtualFileName
      : `/${result.virtualFileName}`;
    contentByVirtualPath.set(path.replace(/\\/g, "/").replace(/^\/+/, "/"), result.sourceText);
  }

  function getResolver(projectRoot: string): ReturnType<typeof createResolver> {
    let r = resolversByRoot.get(projectRoot);
    if (!r) {
      r = createResolver(projectRoot);
      resolversByRoot.set(projectRoot, r);
    }
    return r;
  }

  function registerVirtualModule(projectRoot: string, moduleId: string, importer: string): void {
    let set = virtualModuleRegistry.get(projectRoot);
    if (!set) {
      set = new Set();
      virtualModuleRegistry.set(projectRoot, set);
    }
    set.add(`${moduleId}::${importer}`);
  }

  function fireRefreshesForProject(
    projectRoot: string,
    fireTypedVirtualChanges: (uris: vscode.Uri[]) => void,
  ): void {
    const resolver = getResolver(projectRoot);
    resolver.clearProgramCache();

    const entries = virtualModuleRegistry.get(projectRoot);
    if (!entries?.size) return;

    const typedVirtualUris: vscode.Uri[] = [];
    for (const key of entries) {
      const idx = key.indexOf("::");
      if (idx < 0) continue;
      const moduleId = key.slice(0, idx);
      const importer = key.slice(idx + 2);
      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(moduleId, importer);
      if (result) {
        cacheVirtualModule(result);
        onDidChangeEmitter.fire(buildVirtualModuleUri(moduleId, importer, result));
        writeVirtualPreviewAndGetPath(
          projectRoot,
          importer,
          result.virtualFileName,
          result.sourceText,
        );
      } else {
        onDidChangeEmitter.fire(buildVirtualModuleUri(moduleId, importer));
      }
      typedVirtualUris.push(buildTypedVirtualUri(moduleId, importer));
    }
    fireTypedVirtualChanges(typedVirtualUris);
  }

  const provider = createVirtualModuleProvider({
    getResolver,
    onDidChangeEmitter,
    onResolved: (moduleId, importer) => {
      const path = importer.startsWith("file:") ? vscode.Uri.parse(importer).fsPath : importer;
      const root = getProjectRoot(path);
      if (root) registerVirtualModule(root, moduleId, importer);
    },
    getContentByVirtualPath: (virtualPath) => contentByVirtualPath.get(virtualPath),
  });

  const typedVirtualFs = createTypedVirtualFileSystemProvider({
    getResolver,
    getProjectRoot,
  });
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(VIRTUAL_MODULE_URI_SCHEME, typedVirtualFs, {
      isCaseSensitive: true,
      isReadonly: true,
    }),
  );

  function scheduleRefreshForFile(filePath: string): void {
    const projectRoot = getProjectRoot(filePath);
    if (!projectRoot) return;
    if (filePath.includes("node_modules")) return;

    pendingRefreshRoots.add(projectRoot);
    if (refreshDebounceTimer !== undefined) clearTimeout(refreshDebounceTimer);
    refreshDebounceTimer = setTimeout(() => {
      refreshDebounceTimer = undefined;
      for (const root of pendingRefreshRoots) {
        fireRefreshesForProject(root, (uris) => typedVirtualFs.fireVirtualModuleChanges(uris));
      }
      pendingRefreshRoots.clear();
    }, REFRESH_DEBOUNCE_MS);
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const uri = e.document.uri;
      if (uri.scheme !== "file") return;
      scheduleRefreshForFile(uri.fsPath);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.uri.scheme !== "file") return;
      scheduleRefreshForFile(doc.uri.fsPath);
    }),
  );

  const treeProvider: VirtualModulesTreeProvider = createVirtualModulesTreeProvider({
    getResolver,
    getProjectRoot,
    onResolved: (projectRoot, moduleId, importer) =>
      registerVirtualModule(projectRoot, moduleId, importer),
    onCache: cacheVirtualModule,
  });
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("typedVirtualModules", treeProvider),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("typed.virtualModules.refresh", () => {
      treeProvider.refresh();
    }),
  );

  context.subscriptions.push(onDidChangeEmitter);
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider),
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      const scheme = doc.uri.scheme;
      if (
        (scheme === SCHEME || scheme === VIRTUAL_MODULE_URI_SCHEME) &&
        doc.languageId !== "typescript"
      ) {
        void vscode.languages.setTextDocumentLanguage(doc, "typescript");
      }
    }),
  );

  const outputChannel = vscode.window.createOutputChannel("Typed Virtual Modules");
  const definitionProvider = createVirtualModuleDefinitionProvider(
    getResolver,
    getProjectRoot,
    (moduleId, importer) => {
      const root = getProjectRoot(importer);
      if (root) registerVirtualModule(root, moduleId, importer);
    },
    cacheVirtualModule,
    outputChannel,
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "typed.virtualModules.openFromTree",
      async (moduleId: string, importer: string, projectRoot: string) => {
        const resolver = getResolver(projectRoot);
        const result = resolver.resolve(moduleId, importer);
        if (!result) {
          vscode.window.showErrorMessage(`Could not resolve virtual module "${moduleId}"`);
          return;
        }
        registerVirtualModule(projectRoot, moduleId, importer);
        cacheVirtualModule(result);
        const absPath = writeVirtualPreviewAndGetPath(
          projectRoot,
          importer,
          result.virtualFileName,
          result.sourceText,
        );
        const doc = await vscode.workspace.openTextDocument(absPath);
        await vscode.window.showTextDocument(doc, { preview: false });
      },
    ),
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { language: "typescript", scheme: "file" },
      definitionProvider,
    ),
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { language: "javascript", scheme: "file" },
      definitionProvider,
    ),
  );

  const documentLinkProvider = createVirtualModuleDocumentLinkProvider(
    getResolver,
    getProjectRoot,
    (moduleId, importer) => {
      const root = getProjectRoot(importer);
      if (root) registerVirtualModule(root, moduleId, importer);
    },
    cacheVirtualModule,
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { language: "typescript", scheme: "file" },
      documentLinkProvider,
    ),
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { language: "javascript", scheme: "file" },
      documentLinkProvider,
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(
      [
        { language: "typescript", scheme: SCHEME },
        { language: "typescript", scheme: VIRTUAL_MODULE_URI_SCHEME },
        { language: "javascript", scheme: SCHEME },
        { language: "javascript", scheme: VIRTUAL_MODULE_URI_SCHEME },
      ],
      createVirtualModuleReferenceProvider(getProjectRoot),
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

      registerVirtualModule(projectRoot, moduleId.trim(), importer);
      cacheVirtualModule(result);
      const absPath = writeVirtualPreviewAndGetPath(
        projectRoot,
        importer,
        result.virtualFileName,
        result.sourceText,
      );
      const doc = await vscode.workspace.openTextDocument(absPath);
      await vscode.window.showTextDocument(doc, { preview: false });
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("typed.virtualModules.diagnoseDefinition", async () => {
      outputChannel.show();
      outputChannel.clear();
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        outputChannel.appendLine("No active editor.");
        return;
      }
      const doc = editor.document;
      const pos = editor.selection.active;
      const line = doc.lineAt(pos.line).text;
      outputChannel.appendLine(`Cursor: line ${pos.line} col ${pos.character}`);
      outputChannel.appendLine(`Line: "${line}"`);

      const extracted = extractVirtualImportAtPosition(doc, pos);
      if (!extracted) {
        outputChannel.appendLine(
          "FAIL: Cursor is not on a virtual import specifier. Place cursor inside the quoted part (e.g. 'api:./api').",
        );
        return;
      }
      outputChannel.appendLine(`Extracted moduleId: "${extracted.moduleId}"`);

      const importer = doc.uri.fsPath;
      const projectRoot = getProjectRoot(importer);
      if (!projectRoot) {
        outputChannel.appendLine(`FAIL: No project root for "${importer}"`);
        return;
      }
      outputChannel.appendLine(`Project root: "${projectRoot}"`);

      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(extracted.moduleId, importer);
      if (!result) {
        outputChannel.appendLine(
          `FAIL: resolver.resolve("${extracted.moduleId}", "${importer}") returned null. Check vmc.config.ts and plugin setup.`,
        );
        return;
      }
      outputChannel.appendLine(`Resolved: virtualFileName="${result.virtualFileName}"`);

      try {
        const absPath = writeVirtualPreviewAndGetPath(
          projectRoot,
          importer,
          result.virtualFileName,
          result.sourceText,
        );
        outputChannel.appendLine(`OK: would open "${absPath}"`);
      } catch (err) {
        outputChannel.appendLine(`FAIL: ${err}`);
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("typed.virtualModules.openFromImport", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const doc = editor.document;
      const pos = editor.selection.active;
      const line = doc.lineAt(pos.line).text;

      const match = line.match(/(?:from|import\s*\(?)\s*["']([^"']+:[^"']+)["']/);
      const moduleId = match?.[1];
      if (!moduleId) {
        vscode.window.showInformationMessage(
          "Place cursor on a virtual module import (e.g. import x from 'virtual:foo' or 'router:./routes')",
        );
        return;
      }

      const importer = doc.uri.fsPath;
      const projectRoot = getProjectRoot(importer);
      if (!projectRoot) return;

      const resolver = getResolver(projectRoot);
      const result = resolver.resolve(moduleId, importer);
      if (!result) {
        vscode.window.showErrorMessage(`Could not resolve virtual module "${moduleId}"`);
        return;
      }

      registerVirtualModule(projectRoot, moduleId, importer);
      cacheVirtualModule(result);
      const absPath = writeVirtualPreviewAndGetPath(
        projectRoot,
        importer,
        result.virtualFileName,
        result.sourceText,
      );
      const virtualDoc = await vscode.workspace.openTextDocument(absPath);
      await vscode.window.showTextDocument(virtualDoc, { preview: false });
    }),
  );
}

/** Matches virtual module specifiers (e.g. virtual:foo, router:./routes) in import/from. */
const VIRTUAL_IMPORT_SPECIFIER_REGEX = /(?:from|import\s*\(?)\s*["']([^"']+:[^"']+)["']/g;

function extractVirtualImportAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
): { moduleId: string; range: vscode.Range } | undefined {
  const line = document.lineAt(position.line).text;
  VIRTUAL_IMPORT_SPECIFIER_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VIRTUAL_IMPORT_SPECIFIER_REGEX.exec(line)) !== null) {
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
  onResolved?: (moduleId: string, importer: string) => void,
  onCache?: (result: { virtualFileName: string; sourceText: string }) => void,
  outputChannel?: vscode.OutputChannel,
): vscode.DefinitionProvider {
  const log = (msg: string) => outputChannel?.appendLine(`[go-to-def] ${msg}`);
  return {
    provideDefinition(
      document: vscode.TextDocument,
      position: vscode.Position,
    ): vscode.DefinitionLink[] | vscode.Location[] | null {
      log(`called doc=${document.uri.fsPath} pos=(${position.line},${position.character})`);
      const line = document.lineAt(position.line).text;
      log(`line: "${line}"`);

      const extracted = extractVirtualImportAtPosition(document, position);
      if (extracted) {
        log(`extracted moduleId="${extracted.moduleId}"`);
        const { moduleId } = extracted;
        const importer = document.uri.fsPath;
        const projectRoot = getProjectRoot(importer);
        if (!projectRoot) {
          log(`FAIL: getProjectRoot("${importer}") returned undefined`);
          return null;
        }
        log(`projectRoot="${projectRoot}"`);
        const resolver = getResolver(projectRoot);
        const result = resolver.resolve(moduleId, importer);
        if (!result) {
          log(`FAIL: resolver.resolve("${moduleId}", "${importer}") returned null`);
          return null;
        }
        log(`resolved virtualFileName="${result.virtualFileName}"`);
        try {
          onResolved?.(moduleId, importer);
          onCache?.(result);
          const absPath = writeVirtualPreviewAndGetPath(
            projectRoot,
            importer,
            result.virtualFileName,
            result.sourceText,
          );
          log(`OK returning Location(${absPath}) [import specifier]`);
          return [new vscode.Location(vscode.Uri.file(absPath), new vscode.Position(0, 0))];
        } catch (err) {
          log(`FAIL: writeVirtualPreviewAndGetPath threw: ${err}`);
          throw err;
        }
      }

      // Cursor not on import specifier (e.g. Api.serve()) - return null so tsserver's
      // DefinitionProvider handles it. The TS plugin patches the host so virtual
      // modules are in the program; tsserver will resolve definitions correctly.
      log("not on import specifier, delegating to tsserver");
      return null;
    },
  };
}

function createVirtualModuleDocumentLinkProvider(
  getResolver: (root: string) => ReturnType<typeof createResolver>,
  getProjectRoot: (path: string) => string | undefined,
  onResolved?: (moduleId: string, importer: string) => void,
  onCache?: (result: { virtualFileName: string; sourceText: string }) => void,
): vscode.DocumentLinkProvider {
  return {
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
      const links: vscode.DocumentLink[] = [];
      const importer = document.uri.fsPath;
      const projectRoot = getProjectRoot(importer);
      if (!projectRoot) return links;

      const resolver = getResolver(projectRoot);
      VIRTUAL_IMPORT_SPECIFIER_REGEX.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = VIRTUAL_IMPORT_SPECIFIER_REGEX.exec(document.getText())) !== null) {
        const moduleId = match[1];
        const result = resolver.resolve(moduleId, importer);
        if (!result) continue;

        onResolved?.(moduleId, importer);
        onCache?.(result);
        const position = document.positionAt(match.index + match[0].indexOf(moduleId));
        const range = new vscode.Range(
          position,
          new vscode.Position(position.line, position.character + moduleId.length),
        );
        const absPath = writeVirtualPreviewAndGetPath(
          projectRoot,
          importer,
          result.virtualFileName,
          result.sourceText,
        );
        links.push(new vscode.DocumentLink(range, vscode.Uri.file(absPath)));
      }
      return links;
    },
  };
}

function getModuleIdFromVirtualUri(uri: vscode.Uri): string | undefined {
  if (uri.scheme !== SCHEME && uri.scheme !== VIRTUAL_MODULE_URI_SCHEME) return undefined;
  const params = new URLSearchParams(uri.query);
  return params.get("id") ?? undefined;
}

function createVirtualModuleReferenceProvider(
  getProjectRoot: (path: string) => string | undefined,
): vscode.ReferenceProvider {
  return {
    async provideReferences(
      document: vscode.TextDocument,
      _position: vscode.Position,
      _context: vscode.ReferenceContext,
    ): Promise<vscode.Location[] | undefined> {
      const moduleId = getModuleIdFromVirtualUri(document.uri);
      if (!moduleId) return undefined;

      const params = new URLSearchParams(document.uri.query);
      const importer = params.get("importer");
      const projectRoot = importer
        ? getProjectRoot(
            importer.startsWith("file:") ? vscode.Uri.parse(importer).fsPath : importer,
          )
        : undefined;
      if (!projectRoot) return undefined;

      const pattern = new vscode.RelativePattern(projectRoot, "**/*.{ts,tsx,js,jsm,mjs,cjs}");
      const files = await vscode.workspace.findFiles(pattern, "**/node_modules/**", 1000);
      const locations: vscode.Location[] = [];
      const re = new RegExp(`(?:from|import\\s*\\(?)\\s*["'](${escapeRegex(moduleId)})["']`, "g");

      for (const fileUri of files) {
        const doc = await vscode.workspace.openTextDocument(fileUri);
        const text = doc.getText();
        let match: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((match = re.exec(text)) !== null) {
          const start = doc.positionAt(match.index + match[0].indexOf(moduleId));
          const end = new vscode.Position(start.line, start.character + moduleId.length);
          locations.push(new vscode.Location(fileUri, new vscode.Range(start, end)));
        }
      }
      return locations;
    },
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getProjectRoot(filePath: string): string | undefined {
  // Use the directory of the nearest tsconfig so we resolve with the right plugins
  // (e.g. sample-project when the workspace is the monorepo root).
  const tsconfigRoot = getProjectRootForFile(filePath);
  if (tsconfigRoot) return tsconfigRoot;

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
