/**
 * Creates a CreateTypeInfoApiSession factory backed by a TypeScript Language Service.
 * The program evolves over time as files change (via getModifiedTime versioning),
 * so type-aware virtual module builds stay current during development.
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type * as ts from "typescript";
import type { CreateTypeInfoApiSession, TypeInfoApiSession, TypeTargetSpec } from "./types.js";
import { createTypeInfoApiSession } from "./TypeInfoApi.js";
import {
  ensureTypeTargetBootstrapFile,
  getProgramWithTypeTargetBootstrap,
  getTypeTargetBootstrapPath,
} from "./typeTargetBootstrap.js";

function findTsconfig(fromDir: string): string | undefined {
  let dir = resolve(fromDir);
  const root = resolve(dir, "/");
  while (dir !== root) {
    const candidate = join(dir, "tsconfig.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

export interface CreateLanguageServiceSessionFactoryOptions {
  readonly ts: typeof import("typescript");
  readonly projectRoot: string;
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
  readonly tsconfigPath?: string;
}

/**
 * Creates a LanguageService-backed CreateTypeInfoApiSession factory.
 * Use when you need type-aware virtual module resolution with a program that
 * evolves as files change (e.g. Vite dev server, standalone tooling).
 *
 * Returns undefined if tsconfig cannot be found or parsed.
 */
export function createLanguageServiceSessionFactory(
  options: CreateLanguageServiceSessionFactoryOptions,
): CreateTypeInfoApiSession | undefined {
  const { ts, projectRoot, typeTargetSpecs, tsconfigPath: explicitTsconfigPath } = options;
  const tsconfigPath = explicitTsconfigPath ?? findTsconfig(projectRoot);
  if (!tsconfigPath) return undefined;

  let parsed: ts.ParsedCommandLine;

  try {
    // oxlint-disable-next-line typescript/unbound-method
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (configFile.error) return undefined;
    const configDir = dirname(tsconfigPath);
    parsed = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      configDir,
      undefined,
      tsconfigPath,
    );
    if (parsed.errors.length > 0) return undefined;
  } catch {
    return undefined;
  }

  let rootNames = parsed.fileNames;
  if (typeTargetSpecs && typeTargetSpecs.length > 0) {
    ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs);
    const bootstrapPath = getTypeTargetBootstrapPath(projectRoot);
    rootNames = [...rootNames, bootstrapPath];
  }

  const sys = ts.sys;
  const compilerOptions = parsed.options;

  const host: ts.LanguageServiceHost = {
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => rootNames,
    getScriptVersion: (fileName: string) => {
      const mtime = sys.getModifiedTime?.(fileName);
      return mtime ? String(mtime.getTime()) : "0";
    },
    getScriptSnapshot: (fileName: string) => {
      if (!sys.fileExists(fileName)) return undefined;
      const content = sys.readFile(fileName);
      return content !== undefined ? ts.ScriptSnapshot.fromString(content) : undefined;
    },
    getCurrentDirectory: () => dirname(tsconfigPath),
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    directoryExists: sys.directoryExists?.bind(sys),
    fileExists: sys.fileExists?.bind(sys),
    readFile: sys.readFile?.bind(sys),
    readDirectory: sys.readDirectory?.bind(sys),
  };

  const languageService = ts.createLanguageService(host);

  const createTypeInfoApiSessionFn: CreateTypeInfoApiSession = ({
    id: _id,
    importer: _importer,
  }) => {
    let session: TypeInfoApiSession | null = null;
    let apiUsed = false;

    const getSession = (): TypeInfoApiSession => {
      if (session) return session;

      const program = languageService.getProgram();
      if (!program) {
        throw new Error(
          "TypeInfo session creation failed: Program not yet available from Language Service. Retry when project is loaded.",
        );
      }

      const programWithBootstrap = getProgramWithTypeTargetBootstrap(
        ts,
        program,
        projectRoot,
        typeTargetSpecs,
      );

      session = createTypeInfoApiSession({
        ts,
        program: programWithBootstrap,
        ...(typeTargetSpecs && typeTargetSpecs.length > 0
          ? { typeTargetSpecs, failWhenNoTargetsResolved: false }
          : {}),
      });
      return session;
    };

    return {
      api: {
        file: (path, opts) => {
          apiUsed = true;
          return getSession().api.file(path, opts);
        },
        directory: (glob, opts) => {
          apiUsed = true;
          return getSession().api.directory(glob, opts);
        },
        resolveExport: (baseDir, filePath, exportName) => {
          apiUsed = true;
          return getSession().api.resolveExport(baseDir, filePath, exportName);
        },
        isAssignableTo: (node, targetId, projection) => {
          apiUsed = true;
          return getSession().api.isAssignableTo(node, targetId, projection);
        },
      },
      consumeDependencies: () => (apiUsed ? getSession().consumeDependencies() : ([] as const)),
    };
  };

  return createTypeInfoApiSessionFn;
}
