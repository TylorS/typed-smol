import type * as ts from "typescript";
import {
  type LanguageServiceAdapterOptions,
  type LanguageServiceWatchHost,
  type VirtualModuleAdapterHandle,
} from "./types.js";
import {
  createVirtualRecordStore,
  toResolvedModule,
  type MutableVirtualRecord,
  type ResolveRecordResult,
} from "./internal/VirtualRecordStore.js";

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

  const originalGetScriptFileNames = host.getScriptFileNames?.bind(host);
  const originalResolveModuleNameLiterals = (
    host as {
      resolveModuleNameLiterals?: (...args: readonly unknown[]) => readonly unknown[];
    }
  ).resolveModuleNameLiterals?.bind(host);
  const originalResolveModuleNames = (
    host as {
      resolveModuleNames?: (
        ...args: readonly unknown[]
      ) => readonly (ts.ResolvedModule | undefined)[];
    }
  ).resolveModuleNames?.bind(host);
  const originalGetScriptSnapshot = host.getScriptSnapshot?.bind(host);
  const originalGetScriptVersion = host.getScriptVersion?.bind(host);
  const originalGetProjectVersion = host.getProjectVersion?.bind(host);
  const originalFileExists = (host as { fileExists?: (path: string) => boolean }).fileExists?.bind(
    host,
  );
  const originalReadFile = (
    host as { readFile?: (path: string) => string | undefined }
  ).readFile?.bind(host);

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
      fileExists: (path) =>
        (host as { fileExists?: (value: string) => boolean }).fileExists?.(path) ?? false,
      readFile: (path) =>
        (host as { readFile?: (value: string) => string | undefined }).readFile?.(path),
      directoryExists: (path) =>
        (host as { directoryExists?: (value: string) => boolean }).directoryExists?.(path) ??
        options.ts.sys.directoryExists(path),
      getCurrentDirectory: () =>
        host.getCurrentDirectory?.() ?? options.ts.sys.getCurrentDirectory(),
      getDirectories: (path) => {
        const fromHost = (
          host as { getDirectories?: (value: string) => string[] }
        ).getDirectories?.(path);
        if (fromHost !== undefined) return [...fromHost];
        const fromSys = options.ts.sys.getDirectories?.(path);
        return fromSys !== undefined ? [...fromSys] : [];
      },
      realpath: (path) =>
        (host as { realpath?: (value: string) => string }).realpath?.(path) ??
        options.ts.sys.realpath?.(path) ??
        path,
      useCaseSensitiveFileNames:
        host.useCaseSensitiveFileNames?.() ?? options.ts.sys.useCaseSensitiveFileNames,
    });

    return result.resolvedModule as ts.ResolvedModuleFull | undefined;
  };

  (host as ts.LanguageServiceHost).resolveModuleNames = (
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
      const fallback = originalResolveModuleNames
        ? originalResolveModuleNames(
            moduleNames as readonly unknown[],
            containingFile,
            reusedNames,
            redirectedReference,
            compilerOptions,
            containingSourceFile,
          )
        : moduleNames.map((moduleName) =>
            fallbackResolveModule(moduleName, containingFile, compilerOptions),
          );

      return moduleNames.map((moduleName, index) => {
        const resolved = getOrBuildRecord(moduleName, containingFile);
        if (resolved.status === "resolved") {
          return toResolvedModule(options.ts, resolved.record.virtualFileName);
        }

        if (resolved.status === "error") {
          addDiagnosticForFile(containingFile, resolved.diagnostic.message);
          if (resolved.diagnostic.code === "re-entrant-resolution") {
            return undefined;
          }
        }

        return fallback[index];
      });
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
      const fallback: readonly ts.ResolvedModuleWithFailedLookupLocations[] =
        originalResolveModuleNameLiterals
          ? (originalResolveModuleNameLiterals(
              moduleLiterals as unknown as readonly ts.StringLiteralLike[],
              containingFile,
              redirectedReference,
              compilerOptions,
              containingSourceFile,
              reusedNames as readonly ts.StringLiteralLike[] | undefined,
            ) as readonly ts.ResolvedModuleWithFailedLookupLocations[])
          : moduleLiterals.map((moduleLiteral) => ({
              resolvedModule: fallbackResolveModule(
                moduleLiteral.text,
                containingFile,
                compilerOptions,
              ),
            }));

      return moduleLiterals.map((moduleLiteral, index) => {
        const resolved = getOrBuildRecord(moduleLiteral.text, containingFile);
        if (resolved.status === "resolved") {
          return {
            resolvedModule: toResolvedModule(options.ts, resolved.record.virtualFileName),
          };
        }

        if (resolved.status === "error") {
          addDiagnosticForFile(containingFile, resolved.diagnostic.message);
          if (resolved.diagnostic.code === "re-entrant-resolution") {
            return fallback[index];
          }
        }

        return fallback[index];
      });
    } finally {
      inResolution = false;
    }
  };
  (host as ts.LanguageServiceHost).resolveModuleNameLiterals = assignResolveModuleNameLiterals;

  host.getScriptSnapshot = (fileName: string): ts.IScriptSnapshot | undefined => {
    const record = recordsByVirtualFile.get(fileName);
    if (!record) {
      return originalGetScriptSnapshot?.(fileName);
    }

    const freshRecord = rebuildRecordIfNeeded(record);
    return options.ts.ScriptSnapshot.fromString(freshRecord.sourceText);
  };

  if (originalGetScriptVersion) {
    host.getScriptVersion = (fileName: string): string => {
      const record = recordsByVirtualFile.get(fileName);
      if (!record) {
        return originalGetScriptVersion(fileName);
      }
      return String(record.version);
    };
  }

  if (originalGetProjectVersion) {
    host.getProjectVersion = (): string => `${originalGetProjectVersion()}:vm:${epoch}`;
  }

  if (originalGetScriptFileNames) {
    (host as ts.LanguageServiceHost).getScriptFileNames = (): string[] => {
      const files = originalGetScriptFileNames();
      const virtualFiles = [...recordsByVirtualFile.keys()];
      return [...new Set([...files, ...virtualFiles])];
    };
  }

  (host as { fileExists: (path: string) => boolean }).fileExists = (path: string): boolean => {
    if (recordsByVirtualFile.has(path)) {
      return true;
    }

    return originalFileExists ? originalFileExists(path) : false;
  };

  (host as { readFile: (path: string) => string | undefined }).readFile = (
    path: string,
  ): string | undefined => {
    const record = recordsByVirtualFile.get(path);
    if (record) {
      return rebuildRecordIfNeeded(record).sourceText;
    }

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
      (
        host as { resolveModuleNameLiterals?: (...args: readonly unknown[]) => readonly unknown[] }
      ).resolveModuleNameLiterals = originalResolveModuleNameLiterals;
      (
        host as {
          resolveModuleNames?: (
            ...args: readonly unknown[]
          ) => readonly (ts.ResolvedModule | undefined)[];
        }
      ).resolveModuleNames = originalResolveModuleNames;
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
