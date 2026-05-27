import type * as ts from "typescript";
import { dirname, relative, resolve } from "node:path";
import {
  type CompilerHostAdapterOptions,
  type VirtualModuleAdapterHandle,
  type VirtualModuleBuildContext,
  type VirtualModuleDiagnostic,
} from "./types.js";
import { rewriteSourceForPreviewLocation } from "./internal/materializeVirtualFile.js";
import {
  createBuildContextFromSource,
  createVirtualRecordStore,
  toResolvedModule,
  type MutableVirtualRecord,
} from "./internal/VirtualRecordStore.js";
import { VIRTUAL_NODE_MODULES_RELATIVE } from "./internal/path.js";
import { toPosixPath } from "./internal/path.js";

export const attachCompilerHostAdapter = (
  options: CompilerHostAdapterOptions,
): VirtualModuleAdapterHandle => {
  if (typeof options.projectRoot !== "string" || options.projectRoot.trim() === "") {
    throw new Error("projectRoot must be a non-empty string");
  }

  const host = options.compilerHost as ts.CompilerHost & Record<string, unknown>;
  const watchHost = options.watchHost;

  const invalidatedPaths = new Set<string>();
  const ADAPTER_DIAGNOSTIC_CODE = 99001;
  const hasArtifactStore = options.artifactStoreFactory !== undefined;

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
  const originalWriteFile = host.writeFile?.bind(host);
  const originalHasInvalidatedResolutions = (
    host as {
      hasInvalidatedResolutions?: (...args: readonly unknown[]) => boolean;
    }
  ).hasInvalidatedResolutions?.bind(host);

  const store = createVirtualRecordStore({
    projectRoot: options.projectRoot,
    resolver: options.resolver,
    createTypeInfoApiSession: options.createTypeInfoApiSession,
    artifactStoreFactory: options.artifactStoreFactory,
    debounceMs: options.debounceMs,
    watchHost,
    shouldEvictRecord: (record) => !originalFileExists(record.importer),
    shouldReuseRecord: options.shouldReuseRecord,
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
  let lastCompilerOptions: ts.CompilerOptions | undefined;

  const reportAdapterDiagnostic = (diagnostic: VirtualModuleDiagnostic): void => {
    options.reportDiagnostic?.({
      category: options.ts.DiagnosticCategory.Error,
      code: ADAPTER_DIAGNOSTIC_CODE,
      file: undefined,
      start: 0,
      length: 0,
      messageText: diagnostic.message,
    });
  };

  const getContainingSourceText = (
    containingFile: string,
    containingSourceFile: ts.SourceFile | undefined,
  ): string | undefined =>
    containingSourceFile?.text ??
    store.findRecordByVirtualFile(containingFile)?.sourceText ??
    originalReadFile(containingFile);

  const createBuildContext = (
    id: string,
    rootImporter: string,
    containingFile: string,
    containingSourceFile: ts.SourceFile | undefined,
  ): VirtualModuleBuildContext =>
    createBuildContextFromSource({
      id,
      rootImporter,
      containingFile,
      sourceText: getContainingSourceText(containingFile, containingSourceFile),
    });

  const getOrBuildRecord = (
    id: string,
    importer: string,
    context?: VirtualModuleBuildContext,
  ): MutableVirtualRecord | undefined => {
    const result = store.getOrBuildRecord(id, importer, context);
    if (result.status === "error") {
      reportAdapterDiagnostic(result.diagnostic);
    }
    return result.status === "resolved" ? result.record : undefined;
  };

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
      reportAdapterDiagnostic({
        ...diag,
        message: `Virtual module rebuild failed: ${diag.message}`,
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

  const findRecordForRelativeVirtualImport = (
    moduleName: string,
    containingFile: string,
  ): MutableVirtualRecord | undefined => {
    if (!isRelativeModuleSpecifier(moduleName)) return undefined;
    const target = resolve(dirname(containingFile), moduleName);
    return (
      store.findRecordByVirtualFile(target) ??
      virtualSourceAlternatives(target)
        .map((candidate) => store.findRecordByVirtualFile(candidate))
        .find((record): record is MutableVirtualRecord => record !== undefined)
    );
  };

  (host as ts.CompilerHost).resolveModuleNames = (
    moduleNames: readonly string[],
    containingFile: string,
    reusedNames: readonly string[] | undefined,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    compilerOptions: ts.CompilerOptions,
    containingSourceFile?: ts.SourceFile,
  ): (ts.ResolvedModule | undefined)[] => {
    lastCompilerOptions = compilerOptions;
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
      const relativeVirtualRecord = findRecordForRelativeVirtualImport(moduleName, containingFile);
      if (relativeVirtualRecord) {
        return toResolvedModule(options.ts, relativeVirtualRecord.virtualFileName);
      }
      const context = createBuildContext(
        moduleName,
        effectiveImporter,
        containingFile,
        containingSourceFile,
      );
      const record = getOrBuildRecord(moduleName, effectiveImporter, context);
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
    lastCompilerOptions = compilerOptions;
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
      const relativeVirtualRecord = findRecordForRelativeVirtualImport(
        moduleLiteral.text,
        containingFile,
      );
      if (relativeVirtualRecord) {
        return {
          resolvedModule: toResolvedModule(options.ts, relativeVirtualRecord.virtualFileName),
        };
      }
      const context = createBuildContext(
        moduleLiteral.text,
        effectiveImporter,
        containingFile,
        containingSourceFile,
      );
      const record = getOrBuildRecord(moduleLiteral.text, effectiveImporter, context);
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
    if (!hasArtifactStore && fresh.virtualFileName.includes(VIRTUAL_NODE_MODULES_RELATIVE)) {
      return rewriteSourceForPreviewLocation(
        fresh.sourceText,
        fresh.importer,
        fresh.virtualFileName,
      );
    }
    return fresh.sourceText;
  };

  const createSourceFileForRecord = (
    record: MutableVirtualRecord,
    fileName: string,
    languageVersionOrOptions: ts.ScriptTarget | ts.CreateSourceFileOptions,
  ): ts.SourceFile => {
    const fresh = rebuildIfStale(record);
    const sourceText = getSourceTextForRecord(fresh);
    const sourceFile = options.ts.createSourceFile(
      fileName,
      sourceText,
      languageVersionOrOptions as ts.ScriptTarget,
      true,
      options.ts.ScriptKind.TS,
    );
    (sourceFile as { version?: string }).version = String(fresh.version);
    return sourceFile;
  };

  const outputFileForSource = (sourceFileName: string, outputFileName: string): string => {
    const compilerOptions = lastCompilerOptions ?? {};
    const outDir = typeof compilerOptions.outDir === "string" ? compilerOptions.outDir : undefined;
    const rootDir =
      typeof compilerOptions.rootDir === "string" ? compilerOptions.rootDir : options.projectRoot;
    if (!outDir) return replaceTypeScriptExtension(sourceFileName);
    const outputRoot = resolve(options.projectRoot, outDir);
    const sourceRoot = resolve(options.projectRoot, rootDir);
    const sourceRelative = relative(sourceRoot, sourceFileName);
    if (sourceRelative.startsWith("..")) {
      return outputFileName;
    }
    return replaceTypeScriptExtension(resolve(outputRoot, sourceRelative));
  };

  const rewriteEmittedVirtualImports = (
    text: string,
    outputFileName: string,
    sourceFiles: readonly ts.SourceFile[] | undefined,
  ): string => {
    if (!sourceFiles || sourceFiles.length === 0) return text;
    const replacements: LiteralReplacement[] = [];
    const emitted = options.ts.createSourceFile(
      outputFileName,
      text,
      options.ts.ScriptTarget.Latest,
      true,
      options.ts.ScriptKind.JS,
    );
    collectModuleSpecifierReplacements(options.ts, emitted, (specifier) =>
      emittedVirtualImportReplacement(specifier, outputFileName, sourceFiles),
    ).forEach((replacement) => replacements.push(replacement));
    return applyLiteralReplacements(text, replacements);
  };

  const emittedVirtualImportReplacement = (
    specifier: string,
    outputFileName: string,
    sourceFiles: readonly ts.SourceFile[],
  ): string | undefined => {
    if (isRelativeModuleSpecifier(specifier)) return undefined;
    const sourceFile = sourceFiles[0];
    if (!sourceFile) return undefined;
    const importer = store.resolveEffectiveImporter(sourceFile.fileName);
    const record = getOrBuildRecord(specifier, importer);
    if (!record) return undefined;
    return toRelativeOutputSpecifier(
      outputFileName,
      outputFileForSource(record.virtualFileName, outputFileName),
    );
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

    return createSourceFileForRecord(record, fileName, languageVersionOrOptions);
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

      return createSourceFileForRecord(record, fileName, languageVersionOrOptions);
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

  if (originalWriteFile) {
    host.writeFile = (fileName, text, writeByteOrderMark, onError, sourceFiles, data): void => {
      originalWriteFile(
        fileName,
        rewriteEmittedVirtualImports(text, fileName, sourceFiles),
        writeByteOrderMark,
        onError,
        sourceFiles,
        data,
      );
    };
  }

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
    invalidateAll(): void {
      store.markAllStale();
    },
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
      if (originalWriteFile) {
        host.writeFile = originalWriteFile;
      }
      (
        host as { hasInvalidatedResolutions?: (...args: readonly unknown[]) => boolean }
      ).hasInvalidatedResolutions = originalHasInvalidatedResolutions;

      store.dispose();
      invalidatedPaths.clear();
    },
  };
};

interface LiteralReplacement {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

const isRelativeModuleSpecifier = (specifier: string): boolean =>
  specifier.startsWith("./") || specifier.startsWith("../");

const virtualSourceAlternatives = (target: string): readonly string[] => {
  if (target.endsWith(".js")) return [target.slice(0, -3) + ".ts"];
  if (target.endsWith(".mjs")) return [target.slice(0, -4) + ".mts"];
  if (target.endsWith(".cjs")) return [target.slice(0, -4) + ".cts"];
  return [];
};

const replaceTypeScriptExtension = (fileName: string): string =>
  fileName.replace(/\.[cm]?tsx?$/, ".js");

const toRelativeOutputSpecifier = (fromFile: string, toFile: string): string => {
  const relativePath = toPosixPath(relative(dirname(fromFile), toFile));
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
};

const collectModuleSpecifierReplacements = (
  tsMod: typeof import("typescript"),
  sourceFile: ts.SourceFile,
  rewrite: (specifier: string) => string | undefined,
): readonly LiteralReplacement[] => {
  const replacements: LiteralReplacement[] = [];
  const add = (literal: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): void => {
    const rewritten = rewrite(literal.text);
    if (!rewritten || rewritten === literal.text) return;
    replacements.push({
      start: literal.getStart(sourceFile),
      end: literal.getEnd(),
      text: quoteLikeOriginal(literal.getText(sourceFile), rewritten),
    });
  };
  const visit = (node: ts.Node): void => {
    if (tsMod.isImportDeclaration(node) && tsMod.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier);
    } else if (
      tsMod.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      tsMod.isStringLiteral(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier);
    } else if (
      tsMod.isCallExpression(node) &&
      node.expression.kind === tsMod.SyntaxKind.ImportKeyword
    ) {
      const [moduleSpecifier] = node.arguments;
      if (
        tsMod.isStringLiteral(moduleSpecifier) ||
        tsMod.isNoSubstitutionTemplateLiteral(moduleSpecifier)
      ) {
        add(moduleSpecifier);
      }
    }
    tsMod.forEachChild(node, visit);
  };
  visit(sourceFile);
  return replacements;
};

const applyLiteralReplacements = (
  sourceText: string,
  replacements: readonly LiteralReplacement[],
): string => {
  let rewritten = sourceText;
  for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
    rewritten =
      rewritten.slice(0, replacement.start) + replacement.text + rewritten.slice(replacement.end);
  }
  return rewritten;
};

const quoteLikeOriginal = (original: string, value: string): string => {
  const quote = original.startsWith("'") ? "'" : original.startsWith("`") ? "`" : '"';
  if (quote === "`") return `\`${escapeTemplateLiteralText(value)}\``;
  return `${quote}${escapeStringLiteralText(value, quote)}${quote}`;
};

const escapeStringLiteralText = (value: string, quote: "'" | '"'): string =>
  value.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);

const escapeTemplateLiteralText = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");
