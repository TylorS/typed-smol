import type * as ts from "typescript";
import { type CompilerHostAdapterOptions, type VirtualModuleAdapterHandle } from "./types.js";
import {
  createVirtualRecordStore,
  toResolvedModule,
  type MutableVirtualRecord,
} from "./internal/VirtualRecordStore.js";

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

  const rebuildIfStale = (record: MutableVirtualRecord): MutableVirtualRecord => {
    if (!record.stale) {
      return record;
    }

    const rebuilt = store.resolveRecord(record.id, record.importer, record);
    return rebuilt.status === "resolved" ? rebuilt.record : record;
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

    return moduleNames.map((moduleName, index) => {
      const record = getOrBuildRecord(moduleName, containingFile);
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

    return moduleLiterals.map((moduleLiteral, index) => {
      const record = getOrBuildRecord(moduleLiteral.text, containingFile);
      if (!record) {
        return fallback[index];
      }

      return {
        resolvedModule: toResolvedModule(options.ts, record.virtualFileName),
      };
    });
  };
  (host as ts.CompilerHost).resolveModuleNameLiterals = assignResolveModuleNameLiterals;

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

    const freshRecord = rebuildIfStale(record);
    return options.ts.createSourceFile(
      fileName,
      freshRecord.sourceText,
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

      const freshRecord = rebuildIfStale(record);
      return options.ts.createSourceFile(
        fileName,
        freshRecord.sourceText,
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

    return rebuildIfStale(record).sourceText;
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
