import type * as ts from "typescript";
import {
  type CompilerHostAdapterOptions,
  type VirtualModuleAdapterHandle,
  type VirtualModuleDiagnostic,
} from "./types.js";
import { rewriteSourceForPreviewLocation } from "./internal/materializeVirtualFile.js";
import {
  createVirtualRecordStore,
  toResolvedModule,
  type MutableVirtualRecord,
} from "./internal/VirtualRecordStore.js";
import { VIRTUAL_NODE_MODULES_RELATIVE } from "./internal/path.js";

export const attachCompilerHostAdapter = (
  options: CompilerHostAdapterOptions,
): VirtualModuleAdapterHandle => {
  if (typeof options.projectRoot !== "string" || options.projectRoot.trim() === "") {
    throw new Error("projectRoot must be a non-empty string");
  }

  const host = options.compilerHost as ts.CompilerHost & Record<string, unknown>;
  const watchHost = options.watchHost;

  const invalidatedPaths = new Set<string>();

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
  const originalGetSourceFile = host.getSourceFile.bind(host);
  const originalGetSourceFileByPath = (
    host as {
      getSourceFileByPath?: (...args: readonly unknown[]) => ts.SourceFile | undefined;
    }
  ).getSourceFileByPath?.bind(host);
  const originalFileExists = host.fileExists.bind(host);
  const originalReadFile = host.readFile.bind(host);
  const originalHasInvalidatedResolutions = (
    host as {
      hasInvalidatedResolutions?: (...args: readonly unknown[]) => boolean;
    }
  ).hasInvalidatedResolutions?.bind(host);

  const store = createVirtualRecordStore({
    projectRoot: options.projectRoot,
    resolver: options.resolver,
    createTypeInfoApiSession: options.createTypeInfoApiSession,
    debounceMs: options.debounceMs,
    watchHost,
    shouldEvictRecord: (record) => !originalFileExists(record.importer),
    onMarkStale: (record) => {
      invalidatedPaths.add(record.importer);
      invalidatedPaths.add(record.virtualFileName);
    },
    onRecordResolved: (record) => {
      invalidatedPaths.delete(record.importer);
      invalidatedPaths.delete(record.virtualFileName);
    },
    onEvictRecord: (record) => {
      invalidatedPaths.delete(record.importer);
      invalidatedPaths.delete(record.virtualFileName);
    },
  });

  const { recordsByVirtualFile } = store;

  const getOrBuildRecord = (id: string, importer: string): MutableVirtualRecord | undefined => {
    const result = store.getOrBuildRecord(id, importer);
    return result.status === "resolved" ? result.record : undefined;
  };

  const ADAPTER_DIAGNOSTIC_CODE = 99001;

  const rebuildIfStale = (record: MutableVirtualRecord): MutableVirtualRecord => {
    if (!record.stale) {
      return record;
    }

    const rebuilt = store.resolveRecord(record.id, record.importer, record);
    if (rebuilt.status === "resolved") {
      return rebuilt.record;
    }

    if (rebuilt.status === "error" && options.reportDiagnostic) {
      const diag = rebuilt.diagnostic as VirtualModuleDiagnostic;
      const message = `Virtual module rebuild failed: ${diag.message}`;
      options.reportDiagnostic({
        category: options.ts.DiagnosticCategory.Error,
        code: ADAPTER_DIAGNOSTIC_CODE,
        file: undefined,
        start: 0,
        length: 0,
        messageText: message,
      });
    }
    return record;
  };

  const fallbackResolveModule = (
    moduleName: string,
    containingFile: string,
    compilerOptions: ts.CompilerOptions | undefined,
  ): ts.ResolvedModuleFull | undefined => {
    const result = options.ts.resolveModuleName(
      moduleName,
      containingFile,
      compilerOptions ?? {},
      host,
    );
    return result.resolvedModule as ts.ResolvedModuleFull | undefined;
  };

  (host as ts.CompilerHost).resolveModuleNames = (
    moduleNames: readonly string[],
    containingFile: string,
    reusedNames: readonly string[] | undefined,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    compilerOptions: ts.CompilerOptions,
    containingSourceFile?: ts.SourceFile,
  ): (ts.ResolvedModule | undefined)[] => {
    const fallback = originalResolveModuleNames
      ? originalResolveModuleNames(
          moduleNames,
          containingFile,
          reusedNames,
          redirectedReference,
          compilerOptions,
          containingSourceFile,
        )
      : moduleNames.map((moduleName) =>
          fallbackResolveModule(moduleName, containingFile, compilerOptions),
        );

    const effectiveImporter = store.resolveEffectiveImporter(containingFile);
    return moduleNames.map((moduleName, index) => {
      const record = getOrBuildRecord(moduleName, effectiveImporter);
      if (!record) {
        return fallback[index];
      }
      return toResolvedModule(options.ts, record.virtualFileName);
    });
  };

  const assignResolveModuleNameLiterals = (
    moduleLiterals: readonly { readonly text: string }[],
    containingFile: string,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    compilerOptions: ts.CompilerOptions,
    containingSourceFile: ts.SourceFile | undefined,
    reusedNames?: readonly { readonly text: string }[],
  ): readonly ts.ResolvedModuleWithFailedLookupLocations[] => {
    const fallback = originalResolveModuleNameLiterals
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

    const effectiveImporter = store.resolveEffectiveImporter(containingFile);
    return moduleLiterals.map((moduleLiteral, index) => {
      const record = getOrBuildRecord(moduleLiteral.text, effectiveImporter);
      if (!record) {
        return fallback[index];
      }

      return {
        resolvedModule: toResolvedModule(options.ts, record.virtualFileName),
      };
    });
  };
  (host as ts.CompilerHost).resolveModuleNameLiterals = assignResolveModuleNameLiterals;

  const getSourceTextForRecord = (record: MutableVirtualRecord): string => {
    const fresh = rebuildIfStale(record);
    if (record.virtualFileName.includes(VIRTUAL_NODE_MODULES_RELATIVE)) {
      return rewriteSourceForPreviewLocation(
        fresh.sourceText,
        fresh.importer,
        record.virtualFileName,
      );
    }
    return fresh.sourceText;
  };

  host.getSourceFile = (
    fileName: string,
    languageVersionOrOptions: ts.ScriptTarget | ts.CreateSourceFileOptions,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean,
  ): ts.SourceFile | undefined => {
    const record = recordsByVirtualFile.get(fileName);
    if (!record) {
      return originalGetSourceFile(
        fileName,
        languageVersionOrOptions,
        onError,
        shouldCreateNewSourceFile,
      );
    }

    const sourceText = getSourceTextForRecord(record);
    return options.ts.createSourceFile(
      fileName,
      sourceText,
      languageVersionOrOptions as ts.ScriptTarget,
      true,
      options.ts.ScriptKind.TS,
    );
  };

  if (originalGetSourceFileByPath) {
    (host as ts.CompilerHost).getSourceFileByPath = (
      fileName: string,
      path: ts.Path,
      languageVersionOrOptions: ts.ScriptTarget | ts.CreateSourceFileOptions,
      onError?: (message: string) => void,
      shouldCreateNewSourceFile?: boolean,
    ): ts.SourceFile | undefined => {
      const record = recordsByVirtualFile.get(fileName);
      if (!record) {
        return originalGetSourceFileByPath(
          fileName,
          path,
          languageVersionOrOptions,
          onError,
          shouldCreateNewSourceFile,
        );
      }

      const sourceText = getSourceTextForRecord(record);
      return options.ts.createSourceFile(
        fileName,
        sourceText,
        languageVersionOrOptions as ts.ScriptTarget,
        true,
        options.ts.ScriptKind.TS,
      );
    };
  }

  host.fileExists = (fileName: string): boolean => {
    if (recordsByVirtualFile.has(fileName)) {
      return true;
    }

    return originalFileExists(fileName);
  };

  host.readFile = (fileName: string): string | undefined => {
    const record = recordsByVirtualFile.get(fileName);
    if (!record) {
      return originalReadFile(fileName);
    }

    return getSourceTextForRecord(record);
  };

  if (originalHasInvalidatedResolutions) {
    (
      host as { hasInvalidatedResolutions: (...args: readonly unknown[]) => boolean }
    ).hasInvalidatedResolutions = (...args: readonly unknown[]) => {
      if (invalidatedPaths.size > 0) {
        return true;
      }
      return originalHasInvalidatedResolutions(...args);
    };
  }

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
      host.getSourceFile = originalGetSourceFile;
      if (originalGetSourceFileByPath) {
        (
          host as {
            getSourceFileByPath?: (...args: readonly unknown[]) => ts.SourceFile | undefined;
          }
        ).getSourceFileByPath = originalGetSourceFileByPath;
      }
      host.fileExists = originalFileExists;
      host.readFile = originalReadFile;
      (
        host as { hasInvalidatedResolutions?: (...args: readonly unknown[]) => boolean }
      ).hasInvalidatedResolutions = originalHasInvalidatedResolutions;

      store.dispose();
      invalidatedPaths.clear();
    },
  };
};
