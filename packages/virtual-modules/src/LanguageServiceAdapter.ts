import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type * as ts from "typescript";
import {
  type LanguageServiceAdapterOptions,
  type LanguageServiceWatchHost,
  type VirtualModuleAdapterHandle,
} from "./types.js";
import { unlinkSync } from "node:fs";
import {
  materializeVirtualFile,
  rewriteSourceForPreviewLocation,
} from "./internal/materializeVirtualFile.js";
import {
  createVirtualRecordStore,
  toResolvedModule,
  type MutableVirtualRecord,
  type ResolveRecordResult,
} from "./internal/VirtualRecordStore.js";
import {
  VIRTUAL_MODULE_URI_SCHEME,
  VIRTUAL_NODE_MODULES_RELATIVE,
} from "./internal/path.js";
import { Mutable } from "effect/Types";

/** Prefix VSCode uses when sending non-file URIs to tsserver (query params are dropped). */
const IN_MEMORY_RESOURCE_PREFIX = "^";

/** Schemes used by VSCode extension for virtual module preview docs. */
const PREVIEW_SCHEMES = ["virtual-module", VIRTUAL_MODULE_URI_SCHEME] as const;

/**
 * Parse a fileName that may be:
 * 1) Full URI: virtual-module:///module.ts?id=x&importer=y (query may be dropped by VSCode)
 * 2) tsserver path: ^/virtual-module/ts-nul-authority/path/to/__virtual_plugin_hash.ts
 */
function parsePreviewUri(
  fileName: string,
): { id: string; importer: string } | { virtualPath: string } | undefined {
  const pathBased = tryParsePathBasedFromTsServer(fileName);
  if (pathBased) return pathBased;

  if (!fileName.includes("://")) return undefined;
  try {
    const url = new URL(fileName);
    if (
      !PREVIEW_SCHEMES.includes(url.protocol.replace(":", "") as (typeof PREVIEW_SCHEMES)[number])
    )
      return undefined;
    const id = url.searchParams.get("id");
    const importerRaw = url.searchParams.get("importer");
    if (!id || !importerRaw) return undefined;
    const importer = importerRaw.startsWith("file:")
      ? (() => {
          try {
            return fileURLToPath(importerRaw);
          } catch {
            return importerRaw;
          }
        })()
      : importerRaw;
    return { id, importer };
  } catch {
    return undefined;
  }
}

function tryParsePathBasedFromTsServer(fileName: string): { virtualPath: string } | undefined {
  if (!fileName.startsWith(IN_MEMORY_RESOURCE_PREFIX + "/")) return undefined;
  const rest = fileName.slice(IN_MEMORY_RESOURCE_PREFIX.length);
  const parts = rest.split("/");
  if (parts.length < 4) return undefined;
  const [scheme] = [parts[1], parts[2]];
  if (!PREVIEW_SCHEMES.includes(scheme as (typeof PREVIEW_SCHEMES)[number])) return undefined;
  const path = "/" + parts.slice(3).join("/");
  if (!path.includes("__virtual_")) return undefined;
  return { virtualPath: path };
}

interface ProjectServiceLike {
  getOrCreateOpenScriptInfo?(
    fileName: string,
    fileContent: string | undefined,
    scriptKind: ts.ScriptKind,
    hasMixedContent: boolean,
    projectRootPath: string | undefined,
  ): unknown;
}

const ADAPTER_DIAGNOSTIC_CODE = 99001;

const toTsDiagnostic = (
  tsMod: typeof import("typescript"),
  message: string,
  file?: ts.SourceFile,
): ts.Diagnostic => ({
  category: tsMod.DiagnosticCategory.Error,
  code: ADAPTER_DIAGNOSTIC_CODE,
  file,
  start: 0,
  length: 0,
  messageText: message,
});

export const attachLanguageServiceAdapter = (
  options: LanguageServiceAdapterOptions,
): VirtualModuleAdapterHandle => {
  if (typeof options.projectRoot !== "string" || options.projectRoot.trim() === "") {
    throw new Error("projectRoot must be a non-empty string");
  }

  const host = options.languageServiceHost as ts.LanguageServiceHost & Record<string, unknown>;
  const watchHost = (options.watchHost ??
    (options.languageServiceHost as unknown as LanguageServiceWatchHost)) as
    | LanguageServiceWatchHost
    | undefined;

  const diagnosticsByFile = new Map<string, ts.Diagnostic[]>();
  let epoch = 0;
  let inResolution = false;
  let inResolveRecord = false;
  let pendingRetry = false;

  const originalGetScriptFileNames = host.getScriptFileNames?.bind(host);
  const originalResolveModuleNameLiterals = host.resolveModuleNameLiterals?.bind(host);
  const originalResolveModuleNames = host.resolveModuleNames?.bind(host);
  const originalGetScriptSnapshot = host.getScriptSnapshot?.bind(host);
  const originalGetScriptVersion = host.getScriptVersion?.bind(host);
  const originalGetProjectVersion = host.getProjectVersion?.bind(host);
  const originalFileExists = host.fileExists?.bind(host);
  const originalReadFile = host.readFile?.bind(host);
  const originalGetSemanticDiagnostics = options.languageService.getSemanticDiagnostics.bind(
    options.languageService,
  );
  const originalGetSyntacticDiagnostics = options.languageService.getSyntacticDiagnostics.bind(
    options.languageService,
  );

  const addDiagnosticForFile = (filePath: string, message: string): void => {
    const diagnostic = toTsDiagnostic(options.ts, message);
    const diagnostics = diagnosticsByFile.get(filePath) ?? [];
    diagnostics.push(diagnostic);
    diagnosticsByFile.set(filePath, diagnostics);
  };

  const clearDiagnosticsForFile = (filePath: string): void => {
    diagnosticsByFile.delete(filePath);
  };

  const store = createVirtualRecordStore({
    projectRoot: options.projectRoot,
    resolver: options.resolver,
    createTypeInfoApiSession: options.createTypeInfoApiSession,
    debounceMs: options.debounceMs,
    watchHost,
    shouldEvictRecord: (record) => {
      const currentFiles = new Set(originalGetScriptFileNames ? originalGetScriptFileNames() : []);
      return !currentFiles.has(record.importer);
    },
    onFlushStale: () => {
      epoch += 1;
    },
    onBeforeResolve: () => {
      inResolveRecord = true;
    },
    onAfterResolve: () => {
      inResolveRecord = false;
    },
    onRecordResolved: (record) => {
      clearDiagnosticsForFile(record.importer);
    },
    onEvictRecord: (record) => {
      clearDiagnosticsForFile(record.importer);
      if (record.virtualFileName.includes(VIRTUAL_NODE_MODULES_RELATIVE)) {
        try {
          unlinkSync(record.virtualFileName);
        } catch {
          /* ignore if already deleted or missing */
        }
      }
    },
  });

  const { recordsByVirtualFile } = store;

  const getOrBuildRecord = (id: string, importer: string): ResolveRecordResult => {
    store.evictStaleImporters();

    if (inResolveRecord) {
      return {
        status: "error",
        diagnostic: {
          code: "re-entrant-resolution",
          pluginName: "",
          message:
            "Re-entrant resolution not allowed; plugins must not trigger module resolution during build()",
        },
      };
    }

    return store.getOrBuildRecord(id, importer);
  };

  const rebuildRecordIfNeeded = (record: MutableVirtualRecord): MutableVirtualRecord => {
    if (!record.stale) {
      return record;
    }

    const rebuilt = store.resolveRecord(record.id, record.importer, record);
    if (rebuilt.status === "resolved") {
      clearDiagnosticsForFile(record.importer);
      return rebuilt.record;
    }

    if (rebuilt.status === "error") {
      const diagnostic = toTsDiagnostic(
        options.ts,
        `Virtual module rebuild failed: ${rebuilt.diagnostic.message}`,
      );
      const diagnostics = diagnosticsByFile.get(record.importer) ?? [];
      diagnostics.push(diagnostic);
      diagnosticsByFile.set(record.importer, diagnostics);
    }
    return record;
  };

  const fallbackResolveModule = (
    moduleName: string,
    containingFile: string,
    compilerOptions: ts.CompilerOptions | undefined,
  ): ts.ResolvedModuleFull | undefined => {
    const result = options.ts.resolveModuleName(moduleName, containingFile, compilerOptions ?? {}, {
      fileExists: (path) => host.fileExists?.(path) ?? false,
      readFile: (path) => host.readFile?.(path),
      directoryExists: (path) =>
        host.directoryExists?.(path) ?? options.ts.sys.directoryExists(path),
      getCurrentDirectory: () =>
        host.getCurrentDirectory?.() ?? options.ts.sys.getCurrentDirectory(),
      getDirectories: (path) => {
        const fromHost = host.getDirectories?.(path);
        if (fromHost !== undefined) return [...fromHost];
        const fromSys = options.ts.sys.getDirectories?.(path);
        return fromSys !== undefined ? [...fromSys] : [];
      },
      realpath: (path) => host.realpath?.(path) ?? options.ts.sys.realpath?.(path) ?? path,
      useCaseSensitiveFileNames:
        host.useCaseSensitiveFileNames?.() ?? options.ts.sys.useCaseSensitiveFileNames,
    });

    return result.resolvedModule as ts.ResolvedModuleFull | undefined;
  };

  host.resolveModuleNames = (
    moduleNames: string[],
    containingFile: string,
    reusedNames: string[] | undefined,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    compilerOptions: ts.CompilerOptions,
    containingSourceFile?: ts.SourceFile,
  ): (ts.ResolvedModule | undefined)[] => {
    if (inResolution) {
      if (inResolveRecord) {
        const diagnostic = toTsDiagnostic(
          options.ts,
          "Re-entrant resolution not allowed; plugins must not trigger module resolution during build()",
        );
        const diagnostics = diagnosticsByFile.get(containingFile) ?? [];
        diagnostics.push(diagnostic);
        diagnosticsByFile.set(containingFile, diagnostics);
      }
      return moduleNames.map(() => undefined);
    }

    inResolution = true;
    try {
      const parsed = parsePreviewUri(containingFile);
      let effectiveContainingFile = containingFile;
      let importerForVirtual = containingFile;
      if (parsed) {
        if ("virtualPath" in parsed) {
          const r = recordsByVirtualFile.get(parsed.virtualPath);
          if (r) {
            effectiveContainingFile = r.virtualFileName;
            importerForVirtual = r.importer;
          }
        } else {
          const r = getOrBuildRecord(parsed.id, parsed.importer);
          if (r.status === "resolved") {
            effectiveContainingFile = r.record.virtualFileName;
            importerForVirtual = r.record.importer;
          }
        }
      }

      const fallback = originalResolveModuleNames
        ? originalResolveModuleNames(
            moduleNames,
            effectiveContainingFile,
            reusedNames,
            redirectedReference,
            compilerOptions,
            containingSourceFile,
          )
        : moduleNames.map((moduleName) =>
            fallbackResolveModule(moduleName, effectiveContainingFile, compilerOptions),
          );

      let hadVirtualError = false;
      let hadUnresolvedVirtual = false;
      const results = moduleNames.map((moduleName, index) => {
        const resolved = getOrBuildRecord(moduleName, importerForVirtual);
        if (resolved.status === "resolved") {
          pendingRetry = false;
          return toResolvedModule(options.ts, resolved.record.virtualFileName);
        }

        if (resolved.status === "error") {
          hadVirtualError = true;
          addDiagnosticForFile(containingFile, resolved.diagnostic.message);
          if (resolved.diagnostic.code === "re-entrant-resolution") {
            return undefined;
          }
        }

        if (resolved.status === "unresolved" && moduleName.includes(":")) {
          hadUnresolvedVirtual = true;
        }

        return fallback[index];
      });

      if ((hadVirtualError || hadUnresolvedVirtual) && !pendingRetry) {
        pendingRetry = true;
        epoch += 1;
      }

      return results;
    } finally {
      inResolution = false;
    }
  };

  const assignResolveModuleNameLiterals = (
    moduleLiterals: readonly { readonly text: string }[],
    containingFile: string,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    compilerOptions: ts.CompilerOptions,
    containingSourceFile: ts.SourceFile | undefined,
    reusedNames?: readonly { readonly text: string }[],
  ): readonly ts.ResolvedModuleWithFailedLookupLocations[] => {
    if (inResolution) {
      if (inResolveRecord) {
        const diagnostic = toTsDiagnostic(
          options.ts,
          "Re-entrant resolution not allowed; plugins must not trigger module resolution during build()",
        );
        const diagnostics = diagnosticsByFile.get(containingFile) ?? [];
        diagnostics.push(diagnostic);
        diagnosticsByFile.set(containingFile, diagnostics);
      }
      return moduleLiterals.map(() => ({ resolvedModule: undefined }));
    }

    inResolution = true;
    try {
      const parsed = parsePreviewUri(containingFile);
      let effectiveContainingFile = containingFile;
      let importerForVirtual = containingFile;
      if (parsed) {
        if ("virtualPath" in parsed) {
          const r = recordsByVirtualFile.get(parsed.virtualPath);
          if (r) {
            effectiveContainingFile = r.virtualFileName;
            importerForVirtual = r.importer;
          }
        } else {
          const r = getOrBuildRecord(parsed.id, parsed.importer);
          if (r.status === "resolved") {
            effectiveContainingFile = r.record.virtualFileName;
            importerForVirtual = r.record.importer;
          }
        }
      }

      const fallback: readonly ts.ResolvedModuleWithFailedLookupLocations[] =
        originalResolveModuleNameLiterals
          ? (originalResolveModuleNameLiterals(
              moduleLiterals as unknown as readonly ts.StringLiteralLike[],
              effectiveContainingFile,
              redirectedReference,
              compilerOptions,
              containingSourceFile!,
              reusedNames as readonly ts.StringLiteralLike[] | undefined,
            ) as readonly ts.ResolvedModuleWithFailedLookupLocations[])
          : moduleLiterals.map((moduleLiteral) => ({
              resolvedModule: fallbackResolveModule(
                moduleLiteral.text,
                effectiveContainingFile,
                compilerOptions,
              ),
            }));

      let hadVirtualError = false;
      let hadUnresolvedVirtual = false;
      const results = moduleLiterals.map((moduleLiteral, index) => {
        const resolved = getOrBuildRecord(moduleLiteral.text, importerForVirtual);
        if (moduleLiteral.text.includes(":")) {
          try {
            require("node:fs").appendFileSync(
              "/tmp/vm-ts-plugin-debug.log",
              JSON.stringify({
                tag: "LS:resolveLiterals",
                id: moduleLiteral.text,
                status: resolved.status,
                err: resolved.status === "error" ? (resolved as { diagnostic?: { message?: string } }).diagnostic?.message : undefined,
                t: Date.now(),
              }) + "\n",
              { flag: "a" },
            );
          } catch {
            /* noop */
          }
        }
        if (resolved.status === "resolved") {
          pendingRetry = false;
          return {
            resolvedModule: toResolvedModule(options.ts, resolved.record.virtualFileName),
          };
        }

        if (resolved.status === "error") {
          hadVirtualError = true;
          addDiagnosticForFile(containingFile, resolved.diagnostic.message);
          if (resolved.diagnostic.code === "re-entrant-resolution") {
            return fallback[index];
          }
        }

        if (resolved.status === "unresolved" && moduleLiteral.text.includes(":")) {
          hadUnresolvedVirtual = true;
        }

        return fallback[index];
      });

      if ((hadVirtualError || hadUnresolvedVirtual) && !pendingRetry) {
        pendingRetry = true;
        epoch += 1;
      }

      return results;
    } finally {
      inResolution = false;
    }
  };
  host.resolveModuleNameLiterals = assignResolveModuleNameLiterals;

  const projectService = (host as { projectService?: ProjectServiceLike }).projectService;

  host.getScriptSnapshot = (fileName: string): ts.IScriptSnapshot | undefined => {
    let record = recordsByVirtualFile.get(fileName);
    if (!record) {
      const parsed = parsePreviewUri(fileName);
      if (parsed) {
        if ("virtualPath" in parsed) {
          record = recordsByVirtualFile.get(parsed.virtualPath) ?? undefined;
        } else {
          const resolved = getOrBuildRecord(parsed.id, parsed.importer);
          if (resolved.status === "resolved") record = resolved.record;
        }
      }
    }
    if (!record) {
      return originalGetScriptSnapshot?.(fileName);
    }

    const freshRecord = rebuildRecordIfNeeded(record);

    let sourceToServe = freshRecord.sourceText;
    const isNodeModulesPath = fileName.includes(VIRTUAL_NODE_MODULES_RELATIVE);
    if (isNodeModulesPath) {
      sourceToServe = rewriteSourceForPreviewLocation(
        freshRecord.sourceText,
        freshRecord.importer,
        fileName,
      );
      materializeVirtualFile(fileName, freshRecord.importer, freshRecord.sourceText);
    }

    // In tsserver, setDocument(key, path, sourceFile) requires a ScriptInfo for path (Debug.checkDefined(getScriptInfoForPath(path))).
    // If we never register the virtual file, createProgram → acquireOrUpdateDocument → setDocument throws "Debug Failure".
    // So when projectService exists (tsserver), always register the virtual file so setDocument can find it.
    if (projectService?.getOrCreateOpenScriptInfo) {
      projectService.getOrCreateOpenScriptInfo(
        fileName,
        sourceToServe,
        options.ts.ScriptKind.TS,
        false,
        options.projectRoot,
      );
    }

    return options.ts.ScriptSnapshot.fromString(sourceToServe);
  };

  if (originalGetScriptVersion) {
    host.getScriptVersion = (fileName: string): string => {
      let record = recordsByVirtualFile.get(fileName);
      if (!record) {
        const parsed = parsePreviewUri(fileName);
        if (parsed) {
          if ("virtualPath" in parsed) {
            record = recordsByVirtualFile.get(parsed.virtualPath) ?? undefined;
          } else {
            const resolved = getOrBuildRecord(parsed.id, parsed.importer);
            if (resolved.status === "resolved") record = resolved.record;
          }
        }
      }
      if (!record) return originalGetScriptVersion(fileName);
      return String(record.version);
    };
  }

  if (originalGetProjectVersion) {
    host.getProjectVersion = (): string => `${originalGetProjectVersion()}:vm:${epoch}`;
  }

  if (originalGetScriptFileNames) {
    host.getScriptFileNames = (): string[] => {
      const files = originalGetScriptFileNames();
      const virtualFiles = [...recordsByVirtualFile.keys()];
      return [...new Set([...files, ...virtualFiles])];
    };
  }

  host.fileExists = (path: string): boolean => {
    if (recordsByVirtualFile.has(path)) return true;
    const parsed = parsePreviewUri(path);
    if (parsed) {
      if ("virtualPath" in parsed) {
        if (recordsByVirtualFile.has(parsed.virtualPath)) return true;
      } else {
        const resolved = getOrBuildRecord(parsed.id, parsed.importer);
        if (resolved.status === "resolved") return true;
      }
    }
    return originalFileExists ? originalFileExists(path) : false;
  };

  host.readFile = (path: string): string | undefined => {
    let record = recordsByVirtualFile.get(path);
    if (!record) {
      const parsed = parsePreviewUri(path);
      if (parsed) {
        if ("virtualPath" in parsed) {
          record = recordsByVirtualFile.get(parsed.virtualPath) ?? undefined;
        } else {
          const resolved = getOrBuildRecord(parsed.id, parsed.importer);
          if (resolved.status === "resolved") record = resolved.record;
        }
      }
    }
    if (record) return rebuildRecordIfNeeded(record).sourceText;
    return originalReadFile?.(path);
  };

  options.languageService.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
    const diagnostics = originalGetSemanticDiagnostics(fileName);
    const adapterDiagnostics = diagnosticsByFile.get(fileName);
    if (!adapterDiagnostics || adapterDiagnostics.length === 0) {
      return [...diagnostics];
    }
    return [...diagnostics, ...adapterDiagnostics];
  };

  options.languageService.getSyntacticDiagnostics = (
    fileName: string,
  ): ts.DiagnosticWithLocation[] => {
    const diagnostics = originalGetSyntacticDiagnostics(fileName);
    const adapterDiagnostics = diagnosticsByFile.get(fileName);
    if (!adapterDiagnostics || adapterDiagnostics.length === 0) {
      return [...diagnostics];
    }
    const withLocation = adapterDiagnostics.filter(
      (d): d is ts.DiagnosticWithLocation => d.file !== undefined,
    );
    return [...diagnostics, ...withLocation];
  };

  return {
    dispose(): void {
      for (const [virtualPath] of recordsByVirtualFile) {
        if (virtualPath.includes(VIRTUAL_NODE_MODULES_RELATIVE)) {
          try {
            unlinkSync(virtualPath);
          } catch {
            /* ignore */
          }
        }
      }
      (host as Mutable<ts.LanguageServiceHost>).resolveModuleNameLiterals =
        originalResolveModuleNameLiterals;
      host.resolveModuleNames = originalResolveModuleNames;
      if (originalGetScriptSnapshot) {
        host.getScriptSnapshot = originalGetScriptSnapshot;
      }
      if (originalGetScriptVersion) {
        host.getScriptVersion = originalGetScriptVersion;
      }
      if (originalGetProjectVersion) {
        host.getProjectVersion = originalGetProjectVersion;
      }
      if (originalGetScriptFileNames) {
        host.getScriptFileNames = originalGetScriptFileNames;
      }
      if (originalFileExists) {
        (host as { fileExists?: (path: string) => boolean }).fileExists = originalFileExists;
      }
      if (originalReadFile) {
        (host as { readFile?: (path: string) => string | undefined }).readFile = originalReadFile;
      }

      options.languageService.getSemanticDiagnostics = originalGetSemanticDiagnostics;
      options.languageService.getSyntacticDiagnostics = originalGetSyntacticDiagnostics;

      store.dispose();
      diagnosticsByFile.clear();
    },
  };
};
