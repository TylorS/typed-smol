import { relative } from "node:path";
import type * as ts from "typescript";
import {
  type CreateTypeInfoApiSession,
  type ExportedTypeInfo,
  type FileSnapshotResult,
  type TypeInfoApi,
  type TypeInfoApiSession,
  type TypeInfoFileQueryOptions,
  type TypeInfoFileSnapshot,
  type WatchDependencyDescriptor,
} from "./types.js";
import type {
  AnyTypeNode,
  ArrayTypeNode,
  FunctionTypeNode,
  IntersectionTypeNode,
  LiteralTypeNode,
  NeverTypeNode,
  ObjectProperty,
  ObjectTypeNode,
  PrimitiveTypeNode,
  ReferenceTypeNode,
  TupleTypeNode,
  TypeNode,
  TypeParameter,
  UnionTypeNode,
  UnknownTypeNode,
} from "./types.js";
import {
  dedupeSorted,
  pathIsUnderBase,
  resolvePathUnderBase,
  resolveRelativePath,
  toPosixPath,
} from "./internal/path.js";
import { validatePathSegment, validateRelativeGlobs } from "./internal/validation.js";

const TYPE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".d.ts"];
const DEFAULT_MAX_DEPTH = 6;

export interface CreateTypeInfoApiSessionOptions {
  readonly ts: typeof import("typescript");
  readonly program: ts.Program;
  readonly maxTypeDepth?: number;
}

const compareByName = <T extends { readonly name: string }>(a: T, b: T): number =>
  a.name.localeCompare(b.name);

const toOptionalFlag = (symbol: ts.Symbol, tsMod: typeof import("typescript")): boolean =>
  (symbol.flags & tsMod.SymbolFlags.Optional) !== 0;

const hasReadonlyModifier = (
  declaration: ts.Declaration | undefined,
  tsMod: typeof import("typescript"),
): boolean => {
  if (!declaration || !tsMod.canHaveModifiers(declaration)) {
    return false;
  }

  const modifiers = tsMod.getModifiers(declaration);
  return modifiers?.some((modifier) => modifier.kind === tsMod.SyntaxKind.ReadonlyKeyword) ?? false;
};

const asLiteral = (
  type: ts.Type,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
): LiteralTypeNode | undefined => {
  const text = checker.typeToString(type);
  if (
    (type.flags & tsMod.TypeFlags.StringLiteral) !== 0 ||
    (type.flags & tsMod.TypeFlags.NumberLiteral) !== 0 ||
    (type.flags & tsMod.TypeFlags.BooleanLiteral) !== 0 ||
    (type.flags & tsMod.TypeFlags.BigIntLiteral) !== 0
  ) {
    return { kind: "literal", text };
  }
  return undefined;
};

const serializeFunctionSignature = (
  signature: ts.Signature,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  depth: number,
  maxDepth: number,
  visited: Set<string>,
): { parameters: readonly TypeParameter[]; returnType: TypeNode } => {
  const parameters: TypeParameter[] = signature.getParameters().map((parameter) => {
    const declaration = parameter.valueDeclaration ?? parameter.declarations?.[0];
    const parameterType = declaration
      ? checker.getTypeOfSymbolAtLocation(parameter, declaration)
      : checker.getDeclaredTypeOfSymbol(parameter);

    return {
      name: parameter.getName(),
      optional: toOptionalFlag(parameter, tsMod),
      type: serializeTypeNode(parameterType, checker, tsMod, depth + 1, maxDepth, visited),
    };
  });

  const returnType = serializeTypeNode(
    checker.getReturnTypeOfSignature(signature),
    checker,
    tsMod,
    depth + 1,
    maxDepth,
    visited,
  );

  return {
    parameters: parameters.sort(compareByName),
    returnType,
  };
};

const serializeObjectProperties = (
  type: ts.Type,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  depth: number,
  maxDepth: number,
  visited: Set<string>,
): readonly ObjectProperty[] => {
  const properties = checker.getPropertiesOfType(type);
  const snapshots = properties.map((property): ObjectProperty => {
    const declaration = property.valueDeclaration ?? property.declarations?.[0];
    const propertyType = declaration
      ? checker.getTypeOfSymbolAtLocation(property, declaration)
      : checker.getDeclaredTypeOfSymbol(property);

    return {
      name: property.getName(),
      optional: toOptionalFlag(property, tsMod),
      readonly: hasReadonlyModifier(declaration, tsMod),
      type: serializeTypeNode(propertyType, checker, tsMod, depth + 1, maxDepth, visited),
    };
  });

  return snapshots.sort(compareByName);
};

const primitiveTypeNode = (
  type: ts.Type,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
): PrimitiveTypeNode | AnyTypeNode | UnknownTypeNode | NeverTypeNode | undefined => {
  const text = checker.typeToString(type);
  if ((type.flags & tsMod.TypeFlags.Any) !== 0) {
    return { kind: "any", text };
  }
  if ((type.flags & tsMod.TypeFlags.Unknown) !== 0) {
    return { kind: "unknown", text };
  }
  if ((type.flags & tsMod.TypeFlags.Never) !== 0) {
    return { kind: "never", text };
  }
  if (
    (type.flags & tsMod.TypeFlags.StringLike) !== 0 ||
    (type.flags & tsMod.TypeFlags.NumberLike) !== 0 ||
    (type.flags & tsMod.TypeFlags.BooleanLike) !== 0 ||
    (type.flags & tsMod.TypeFlags.BigIntLike) !== 0 ||
    (type.flags & tsMod.TypeFlags.ESSymbolLike) !== 0 ||
    (type.flags & tsMod.TypeFlags.Null) !== 0 ||
    (type.flags & tsMod.TypeFlags.Undefined) !== 0 ||
    (type.flags & tsMod.TypeFlags.Void) !== 0
  ) {
    return { kind: "primitive", text };
  }
  return undefined;
};

const UNKNOWN_NODE: UnknownTypeNode = { kind: "unknown", text: "unknown" };

const serializeTypeNode = (
  type: ts.Type,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  depth: number,
  maxDepth: number,
  visited: Set<string>,
): TypeNode => {
  const text = checker.typeToString(type);
  const typeId = `${(type as { id?: number }).id ?? "anon"}:${text}`;

  if (depth > maxDepth || visited.has(typeId)) {
    return { kind: "reference", text };
  }

  visited.add(typeId);

  const literal = asLiteral(type, checker, tsMod);
  if (literal) {
    return literal;
  }

  if (type.isUnion()) {
    const union: UnionTypeNode = {
      kind: "union",
      text,
      elements: type.types.map((value) =>
        serializeTypeNode(value, checker, tsMod, depth + 1, maxDepth, visited),
      ),
    };
    return union;
  }

  if (type.isIntersection()) {
    const intersection: IntersectionTypeNode = {
      kind: "intersection",
      text,
      elements: type.types.map((value) =>
        serializeTypeNode(value, checker, tsMod, depth + 1, maxDepth, visited),
      ),
    };
    return intersection;
  }

  const primitive = primitiveTypeNode(type, checker, tsMod);
  if (primitive) {
    return primitive;
  }

  if (checker.isTupleType(type)) {
    const typeArguments = checker.getTypeArguments(type as ts.TypeReference);
    const tuple: TupleTypeNode = {
      kind: "tuple",
      text,
      elements: typeArguments.map((value) =>
        serializeTypeNode(value, checker, tsMod, depth + 1, maxDepth, visited),
      ),
    };
    return tuple;
  }

  if (checker.isArrayType(type)) {
    const typeArguments = checker.getTypeArguments(type as ts.TypeReference);
    const element = typeArguments[0];
    const array: ArrayTypeNode = {
      kind: "array",
      text,
      elements: element
        ? [serializeTypeNode(element, checker, tsMod, depth + 1, maxDepth, visited)]
        : [UNKNOWN_NODE],
    };
    return array;
  }

  const callSignatures = checker.getSignaturesOfType(type, tsMod.SignatureKind.Call);
  if (callSignatures.length > 0) {
    const signature = serializeFunctionSignature(
      callSignatures[0],
      checker,
      tsMod,
      depth,
      maxDepth,
      visited,
    );
    const fn: FunctionTypeNode = {
      kind: "function",
      text,
      parameters: signature.parameters,
      returnType: signature.returnType,
    };
    return fn;
  }

  const referenceArguments = checker.getTypeArguments(type as ts.TypeReference);
  if (referenceArguments.length > 0) {
    const ref: ReferenceTypeNode = {
      kind: "reference",
      text,
      typeArguments: referenceArguments.map((value) =>
        serializeTypeNode(value, checker, tsMod, depth + 1, maxDepth, visited),
      ),
    };
    return ref;
  }

  const object: ObjectTypeNode = {
    kind: "object",
    text,
    properties: serializeObjectProperties(type, checker, tsMod, depth, maxDepth, visited),
  };
  return object;
};

const serializeExport = (
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  maxDepth: number,
): ExportedTypeInfo => {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  const useDeclaredType =
    declaration &&
    (tsMod.isTypeAliasDeclaration(declaration) || tsMod.isInterfaceDeclaration(declaration));
  const exportedType = useDeclaredType
    ? checker.getDeclaredTypeOfSymbol(symbol)
    : declaration
      ? checker.getTypeOfSymbolAtLocation(symbol, declaration)
      : checker.getDeclaredTypeOfSymbol(symbol);

  return {
    name: symbol.getName(),
    declarationKind: declaration ? tsMod.SyntaxKind[declaration.kind] : undefined,
    declarationText: declaration ? declaration.getText() : undefined,
    docs: tsMod.displayPartsToString(symbol.getDocumentationComment(checker)) || undefined,
    type: serializeTypeNode(exportedType, checker, tsMod, 0, maxDepth, new Set()),
  };
};

const createFileSnapshot = (
  filePath: string,
  checker: ts.TypeChecker,
  program: ts.Program,
  tsMod: typeof import("typescript"),
  maxDepth: number,
): TypeInfoFileSnapshot => {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    throw new Error(`TypeInfoApi could not find source file in program: ${filePath}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    return {
      filePath,
      exports: [],
    };
  }

  const exports = checker
    .getExportsOfModule(moduleSymbol)
    .map((value) => serializeExport(value, checker, tsMod, maxDepth));

  return {
    filePath,
    exports: exports.sort(compareByName),
  };
};

export const createTypeInfoApiSession = (
  options: CreateTypeInfoApiSessionOptions,
): TypeInfoApiSession => {
  const checker = options.program.getTypeChecker();
  const descriptors = new Map<string, WatchDependencyDescriptor>();
  const snapshotCache = new Map<string, TypeInfoFileSnapshot>();
  const maxDepth = options.maxTypeDepth ?? DEFAULT_MAX_DEPTH;

  const registerDescriptor = (descriptor: WatchDependencyDescriptor): void => {
    if (descriptor.type === "file") {
      descriptors.set(`file:${descriptor.path}`, descriptor);
      return;
    }

    const globs = descriptor.relativeGlobs.join("|");
    descriptors.set(
      `glob:${descriptor.baseDir}:${descriptor.recursive ? "r" : "nr"}:${globs}`,
      descriptor,
    );
  };

  const file = (
    relativePath: string,
    queryOptions: TypeInfoFileQueryOptions,
  ): FileSnapshotResult => {
    const baseDirResult = validatePathSegment(queryOptions.baseDir, "baseDir");
    if (!baseDirResult.ok) return { ok: false, error: "invalid-input" };
    const relativePathResult = validatePathSegment(relativePath, "relativePath");
    if (!relativePathResult.ok) return { ok: false, error: "invalid-input" };
    const baseDir = baseDirResult.value;
    const normalizedRelativePath = relativePathResult.value;

    const pathResult = resolvePathUnderBase(baseDir, normalizedRelativePath);
    if (!pathResult.ok) {
      return {
        ok: false,
        error: "path-escapes-base",
        path: resolveRelativePath(baseDir, normalizedRelativePath),
      };
    }
    const absolutePath = pathResult.path;

    try {
      if (!pathIsUnderBase(baseDir, absolutePath)) {
        return { ok: false, error: "path-escapes-base", path: absolutePath };
      }
    } catch {
      return { ok: false, error: "path-escapes-base", path: absolutePath };
    }

    if (queryOptions.watch) {
      registerDescriptor({
        type: "file",
        path: absolutePath,
      });
    }

    const sourceFile = options.program.getSourceFile(absolutePath);
    if (!sourceFile) {
      return { ok: false, error: "file-not-in-program", path: absolutePath };
    }

    const cached = snapshotCache.get(absolutePath);
    if (cached !== undefined) {
      return { ok: true, snapshot: cached };
    }

    const snapshot = createFileSnapshot(
      absolutePath,
      checker,
      options.program,
      options.ts,
      maxDepth,
    );
    snapshotCache.set(absolutePath, snapshot);
    return { ok: true, snapshot };
  };

  const directory: TypeInfoApi["directory"] = (relativeGlobs, queryOptions) => {
    const baseDirResult = validatePathSegment(queryOptions.baseDir, "baseDir");
    if (!baseDirResult.ok) return [];
    const baseDir = baseDirResult.value;

    const globsResult = validateRelativeGlobs(relativeGlobs, "relativeGlobs");
    if (!globsResult.ok) return [];
    const normalizedGlobs = dedupeSorted(globsResult.value);

    if (queryOptions.watch) {
      registerDescriptor({
        type: "glob",
        baseDir: toPosixPath(baseDir),
        relativeGlobs: normalizedGlobs,
        recursive: queryOptions.recursive,
      });
    }

    const depth = queryOptions.recursive ? undefined : 1;
    const includes =
      queryOptions.recursive && normalizedGlobs.every((g) => !g.includes("**"))
        ? [...normalizedGlobs, ...normalizedGlobs.map((g) => `**/${g}`)]
        : normalizedGlobs;

    const matchedPaths = options.ts.sys.readDirectory(
      baseDir,
      TYPE_EXTENSIONS,
      undefined,
      includes,
      depth,
    );

    const normalizedMatches = dedupeSorted(
      matchedPaths.map((value) => resolveRelativePath(baseDir, value)),
    );
    const underBase = normalizedMatches.filter((filePath) => pathIsUnderBase(baseDir, filePath));
    const filteredMatches = queryOptions.recursive
      ? underBase
      : underBase.filter((filePath) => {
          const relativePath = toPosixPath(relative(baseDir, filePath));
          return !relativePath.includes("/");
        });

    const program = options.program;
    const tsMod = options.ts;
    return filteredMatches
      .filter((filePath) => program.getSourceFile(filePath) !== undefined)
      .map((filePath) => createFileSnapshot(filePath, checker, program, tsMod, maxDepth));
  };

  return {
    api: {
      file,
      directory,
    },
    consumeDependencies: () => [...descriptors.values()],
  };
};

export const createTypeInfoApiSessionFactory =
  (options: CreateTypeInfoApiSessionOptions): CreateTypeInfoApiSession =>
  () =>
    createTypeInfoApiSession(options);
