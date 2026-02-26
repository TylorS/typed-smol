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
  type TypeProjectionStep,
  type WatchDependencyDescriptor,
} from "./types.js";
import type {
  AnyTypeNode,
  ArrayTypeNode,
  ConditionalTypeNode,
  ConstructorTypeNode,
  EnumTypeNode,
  FunctionSignature,
  FunctionTypeNode,
  IndexedAccessTypeNode,
  IndexSignatureInfo,
  ImportInfo,
  IntersectionTypeNode,
  LiteralTypeNode,
  MappedTypeNode,
  NeverTypeNode,
  ObjectProperty,
  ObjectTypeNode,
  OverloadSetTypeNode,
  PrimitiveTypeNode,
  ReferenceTypeNode,
  TemplateLiteralTypeNode,
  TupleTypeNode,
  TypeNode,
  TypeOperatorTypeNode,
  TypeParameter,
  TypeTargetSpec,
  UnionTypeNode,
  UnknownTypeNode,
} from "./types.js";
import {
  getAliasedSymbol as resolveAliasedSymbol,
  getBaseTypes as getBaseTypesInternal,
  getIndexInfosOfType,
  getSymbolExports,
  getTypeReferenceTarget,
  getTypeSymbol,
  FALLBACK_OBJECT_FLAGS_MAPPED,
} from "./internal/tsInternal.js";
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

/**
 * Pre-resolved type for structural assignability checks.
 * Host resolves ts.Type from the program (e.g. Fx from @typed/fx) and passes it.
 */
export interface ResolvedTypeTarget {
  readonly id: string;
  readonly type: ts.Type;
}

export interface CreateTypeInfoApiSessionOptions {
  readonly ts: typeof import("typescript");
  readonly program: ts.Program;
  readonly maxTypeDepth?: number;
  /** Pre-resolved types for assignability checks. Takes precedence over typeTargetSpecs when both exist. */
  readonly typeTargets?: readonly ResolvedTypeTarget[];
  /**
   * Specs to resolve from program imports for assignability checks.
   * Resolution happens internally; use this instead of typeTargets when you have module+export specs.
   */
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
  /**
   * When true (default) and typeTargetSpecs are provided but resolution finds zero targets,
   * session creation throws. Set false to allow empty resolution (assignableTo will be undefined for all exports).
   */
  readonly failWhenNoTargetsResolved?: boolean;
  /**
   * Assignability check mode.
   * - "strict": Use only checker.isTypeAssignableTo; no heuristic fallbacks. Correct TS semantics.
   * - "compatibility" (default): Use checker.isTypeAssignableTo first, then fallbacks for generic/inheritance
   *   when types come from different files (e.g. fixture vs bootstrap). Union sources require ALL
   *   constituents to be assignable (sound union semantics).
   */
  readonly assignabilityMode?: "strict" | "compatibility";
  /**
   * Optional callback when an internal TS API or fallback path catches an error.
   * Assignability and serialization may degrade (e.g. "not assignable" or safe fallback) without throwing.
   * Use for observability in production; default behavior is unchanged when not provided.
   */
  readonly onInternalError?: (err: unknown, context: string) => void;
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
  onInternalError?: (err: unknown, context: string) => void,
  registry?: WeakMap<TypeNode, ts.Type>,
): { parameters: readonly TypeParameter[]; returnType: TypeNode } => {
  const parameters: TypeParameter[] = signature.getParameters().map((parameter) => {
    const declaration = parameter.valueDeclaration ?? parameter.declarations?.[0];
    const parameterType = declaration
      ? checker.getTypeOfSymbolAtLocation(parameter, declaration)
      : checker.getDeclaredTypeOfSymbol(parameter);

    return {
      name: parameter.getName(),
      optional: toOptionalFlag(parameter, tsMod),
      type: serializeTypeNode(
        parameterType,
        checker,
        tsMod,
        depth + 1,
        maxDepth,
        visited,
        onInternalError,
        registry,
      ),
    };
  });

  const returnType = serializeTypeNode(
    checker.getReturnTypeOfSignature(signature),
    checker,
    tsMod,
    depth + 1,
    maxDepth,
    visited,
    onInternalError,
    registry,
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
  onInternalError?: (err: unknown, context: string) => void,
  registry?: WeakMap<TypeNode, ts.Type>,
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
      type: serializeTypeNode(
        propertyType,
        checker,
        tsMod,
        depth + 1,
        maxDepth,
        visited,
        onInternalError,
        registry,
      ),
    };
  });

  return snapshots.sort(compareByName);
};

const serializeIndexSignature = (
  type: ts.Type,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  depth: number,
  maxDepth: number,
  visited: Set<string>,
  onInternalError?: (err: unknown, context: string) => void,
  registry?: WeakMap<TypeNode, ts.Type>,
): IndexSignatureInfo | undefined => {
  const infos = getIndexInfosOfType(type, checker);
  if (!infos || infos.length === 0) return undefined;
  const first = infos[0];
  if (!first) return undefined;
  return {
    keyType: serializeTypeNode(
      first.keyType,
      checker,
      tsMod,
      depth + 1,
      maxDepth,
      visited,
      onInternalError,
      registry,
    ),
    valueType: serializeTypeNode(
      first.type,
      checker,
      tsMod,
      depth + 1,
      maxDepth,
      visited,
      onInternalError,
      registry,
    ),
    readonly: first.isReadonly ?? false,
  };
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
  onInternalError?: (err: unknown, context: string) => void,
  registry?: WeakMap<TypeNode, ts.Type>,
): TypeNode => {
  const text = checker.typeToString(type);
  const reg = <T extends TypeNode>(node: T): T => {
    registry?.set(node, type);
    return node;
  };
  const typeId = `${(type as { id?: number }).id ?? "anon"}:${text}`;

  if (depth > maxDepth || visited.has(typeId)) {
    return reg({ kind: "reference", text });
  }

  visited.add(typeId);

  const literal = asLiteral(type, checker, tsMod);
  if (literal) {
    return reg(literal);
  }

  if (type.isUnion()) {
    const union: UnionTypeNode = {
      kind: "union",
      text,
      elements: type.types.map((value) =>
        serializeTypeNode(
          value,
          checker,
          tsMod,
          depth + 1,
          maxDepth,
          visited,
          onInternalError,
          registry,
        ),
      ),
    };
    return reg(union);
  }

  if (type.isIntersection()) {
    const intersection: IntersectionTypeNode = {
      kind: "intersection",
      text,
      elements: type.types.map((value) =>
        serializeTypeNode(
          value,
          checker,
          tsMod,
          depth + 1,
          maxDepth,
          visited,
          onInternalError,
          registry,
        ),
      ),
    };
    return reg(intersection);
  }

  const primitive = primitiveTypeNode(type, checker, tsMod);
  if (primitive) {
    return reg(primitive);
  }

  if ((type.flags & tsMod.TypeFlags.Enum) !== 0) {
    const members: { name: string; value?: string | number }[] = [];
    try {
      const props = checker.getPropertiesOfType(type);
      for (const sym of props) {
        const name = sym.name;
        let value: string | number | undefined;
        const decl = sym.valueDeclaration;
        if (decl && tsMod.isEnumMember?.(decl) && decl.initializer) {
          const init = decl.initializer;
          if (tsMod.isNumericLiteral?.(init)) {
            value = parseInt((init as { text: string }).text, 10);
          } else if (
            tsMod.isStringLiteral?.(init) ||
            tsMod.isNoSubstitutionTemplateLiteral?.(init)
          ) {
            value = (init as { text: string }).text;
          } else {
            const cv = (
              checker as ts.TypeChecker & {
                getConstantValue?(n: ts.Node): string | number | undefined;
              }
            ).getConstantValue?.(init);
            if (cv !== undefined) value = cv;
          }
        }
        members.push(value !== undefined ? { name, value } : { name });
      }
    } catch (err) {
      onInternalError?.(err, "enum-members");
    }
    const enumNode: EnumTypeNode = {
      kind: "enum",
      text,
      members: members.length > 0 ? members : undefined,
    };
    return reg(enumNode);
  }

  if ((type.flags & tsMod.TypeFlags.Conditional) !== 0) {
    const ct = type as ts.Type & {
      checkType: ts.Type;
      extendsType: ts.Type;
      resolvedTrueType?: ts.Type;
      resolvedFalseType?: ts.Type;
      root?: { node?: { trueType?: ts.TypeNode; falseType?: ts.TypeNode } };
    };
    const trueType =
      ct.resolvedTrueType ??
      (ct.root?.node?.trueType
        ? (
            checker as ts.TypeChecker & { getTypeFromTypeNode?(n: ts.TypeNode): ts.Type }
          ).getTypeFromTypeNode?.(ct.root.node.trueType!)
        : undefined);
    const falseType =
      ct.resolvedFalseType ??
      (ct.root?.node?.falseType
        ? (
            checker as ts.TypeChecker & { getTypeFromTypeNode?(n: ts.TypeNode): ts.Type }
          ).getTypeFromTypeNode?.(ct.root.node.falseType!)
        : undefined);
    const conditional: ConditionalTypeNode = {
      kind: "conditional",
      text,
      checkType: serializeTypeNode(
        ct.checkType,
        checker,
        tsMod,
        depth + 1,
        maxDepth,
        visited,
        onInternalError,
        registry,
      ),
      extendsType: serializeTypeNode(
        ct.extendsType,
        checker,
        tsMod,
        depth + 1,
        maxDepth,
        visited,
        onInternalError,
        registry,
      ),
      trueType: trueType
        ? serializeTypeNode(
            trueType,
            checker,
            tsMod,
            depth + 1,
            maxDepth,
            visited,
            onInternalError,
            registry,
          )
        : UNKNOWN_NODE,
      falseType: falseType
        ? serializeTypeNode(
            falseType,
            checker,
            tsMod,
            depth + 1,
            maxDepth,
            visited,
            onInternalError,
            registry,
          )
        : UNKNOWN_NODE,
    };
    return reg(conditional);
  }

  if ((type.flags & tsMod.TypeFlags.IndexedAccess) !== 0) {
    const iat = type as ts.Type & { objectType: ts.Type; indexType: ts.Type };
    const indexed: IndexedAccessTypeNode = {
      kind: "indexedAccess",
      text,
      objectType: serializeTypeNode(
        iat.objectType,
        checker,
        tsMod,
        depth + 1,
        maxDepth,
        visited,
        onInternalError,
        registry,
      ),
      indexType: serializeTypeNode(
        iat.indexType,
        checker,
        tsMod,
        depth + 1,
        maxDepth,
        visited,
        onInternalError,
        registry,
      ),
    };
    return reg(indexed);
  }

  if ((type.flags & tsMod.TypeFlags.TemplateLiteral) !== 0) {
    const tlt = type as ts.Type & { texts?: readonly string[]; types?: readonly ts.Type[] };
    const texts = tlt.texts ?? [];
    const types = tlt.types ?? [];
    const template: TemplateLiteralTypeNode = {
      kind: "templateLiteral",
      text,
      texts,
      types: types.map((t) =>
        serializeTypeNode(
          t,
          checker,
          tsMod,
          depth + 1,
          maxDepth,
          visited,
          onInternalError,
          registry,
        ),
      ),
    };
    return reg(template);
  }

  const objType = type as ts.Type & { objectFlags?: number };
  const mappedFlag = tsMod.ObjectFlags?.Mapped ?? FALLBACK_OBJECT_FLAGS_MAPPED;
  if (objType.objectFlags !== undefined && (objType.objectFlags & mappedFlag) !== 0) {
    const mt = type as ts.Type & {
      constraint?: ts.Type;
      templateType?: ts.Type;
      mappedType?: ts.Type;
      modifierFlags?: number;
    };
    const constraintType =
      mt.constraint ??
      (mt as ts.Type & { typeParameter?: { constraint?: ts.Type } }).typeParameter?.constraint;
    const mappedType = mt.templateType ?? mt.mappedType;
    const mapped: MappedTypeNode = {
      kind: "mapped",
      text,
      constraintType: constraintType
        ? serializeTypeNode(
            constraintType,
            checker,
            tsMod,
            depth + 1,
            maxDepth,
            visited,
            onInternalError,
            registry,
          )
        : UNKNOWN_NODE,
      mappedType: mappedType
        ? serializeTypeNode(
            mappedType,
            checker,
            tsMod,
            depth + 1,
            maxDepth,
            visited,
            onInternalError,
            registry,
          )
        : UNKNOWN_NODE,
    };
    return reg(mapped);
  }

  if ((type.flags & tsMod.TypeFlags.Index) !== 0) {
    const idxType = type as ts.Type & { type: ts.Type };
    const typeOperator: TypeOperatorTypeNode = {
      kind: "typeOperator",
      text,
      operator: "keyof",
      type: serializeTypeNode(
        idxType.type,
        checker,
        tsMod,
        depth + 1,
        maxDepth,
        visited,
        onInternalError,
        registry,
      ),
    };
    return reg(typeOperator);
  }

  if (checker.isTupleType(type)) {
    const typeArguments = checker.getTypeArguments(type as ts.TypeReference);
    const tuple: TupleTypeNode = {
      kind: "tuple",
      text,
      elements: typeArguments.map((value) =>
        serializeTypeNode(
          value,
          checker,
          tsMod,
          depth + 1,
          maxDepth,
          visited,
          onInternalError,
          registry,
        ),
      ),
    };
    return reg(tuple);
  }

  if (checker.isArrayType(type)) {
    const typeArguments = checker.getTypeArguments(type as ts.TypeReference);
    const element = typeArguments[0];
    const array: ArrayTypeNode = {
      kind: "array",
      text,
      elements: element
        ? [
            serializeTypeNode(
              element,
              checker,
              tsMod,
              depth + 1,
              maxDepth,
              visited,
              onInternalError,
              registry,
            ),
          ]
        : [UNKNOWN_NODE],
    };
    return reg(array);
  }

  const referenceArguments = checker.getTypeArguments(type as ts.TypeReference);
  if (referenceArguments.length > 0) {
    const ref: ReferenceTypeNode = {
      kind: "reference",
      text,
      typeArguments: referenceArguments.map((value) =>
        serializeTypeNode(
          value,
          checker,
          tsMod,
          depth + 1,
          maxDepth,
          visited,
          onInternalError,
          registry,
        ),
      ),
    };
    return reg(ref);
  }

  const constructSignatures = checker.getSignaturesOfType(type, tsMod.SignatureKind.Construct);
  if (constructSignatures.length > 0) {
    const sig = serializeFunctionSignature(
      constructSignatures[0],
      checker,
      tsMod,
      depth,
      maxDepth,
      visited,
      onInternalError,
      registry,
    );
    const ctor: ConstructorTypeNode = {
      kind: "constructor",
      text,
      parameters: sig.parameters,
      returnType: sig.returnType,
    };
    return reg(ctor);
  }

  const callSignatures = checker.getSignaturesOfType(type, tsMod.SignatureKind.Call);
  if (callSignatures.length > 0) {
    if (callSignatures.length > 1) {
      const signatures: FunctionSignature[] = callSignatures.map((s) => {
        const serialized = serializeFunctionSignature(
          s,
          checker,
          tsMod,
          depth,
          maxDepth,
          visited,
          onInternalError,
          registry,
        );
        return { parameters: serialized.parameters, returnType: serialized.returnType };
      });
      const overload: OverloadSetTypeNode = { kind: "overloadSet", text, signatures };
      return reg(overload);
    }
    const signature = serializeFunctionSignature(
      callSignatures[0],
      checker,
      tsMod,
      depth,
      maxDepth,
      visited,
      onInternalError,
      registry,
    );
    const fn: FunctionTypeNode = {
      kind: "function",
      text,
      parameters: signature.parameters,
      returnType: signature.returnType,
    };
    return reg(fn);
  }

  const indexSig = serializeIndexSignature(
    type,
    checker,
    tsMod,
    depth,
    maxDepth,
    visited,
    onInternalError,
    registry,
  );
  const object: ObjectTypeNode = {
    kind: "object",
    text,
    properties: serializeObjectProperties(
      type,
      checker,
      tsMod,
      depth,
      maxDepth,
      visited,
      onInternalError,
      registry,
    ),
    ...(indexSig !== undefined && { indexSignature: indexSig }),
  };
  return reg(object);
};

/**
 * Serialize a TypeScript type to TypeNode. For testing serializer branches (typeOperator, enum, etc).
 * @internal
 */
export function serializeTypeForTest(
  type: ts.Type,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  maxDepth = 6,
): TypeNode {
  return serializeTypeNode(type, checker, tsMod, 0, maxDepth, new Set());
}

/**
 * Generate bootstrap file content that imports all modules from typeTargetSpecs.
 * Include this file in the program's rootNames so resolveTypeTargetsFromSpecs can
 * find types without requiring user source to import them.
 *
 * @example
 * ```ts
 * const bootstrapContent = createTypeTargetBootstrapContent(HTTPAPI_TYPE_TARGET_SPECS);
 * const bootstrapPath = join(tmpDir, "__typeTargetBootstrap.ts");
 * writeFileSync(bootstrapPath, bootstrapContent);
 * const program = ts.createProgram([...rootFiles, bootstrapPath], options, host);
 * ```
 */
export function createTypeTargetBootstrapContent(specs: readonly TypeTargetSpec[]): string {
  const seen = new Set<string>();
  const lines: string[] = [
    "/**",
    " * Auto-generated bootstrap for type target resolution.",
    " * Imports canonical modules so resolveTypeTargetsFromSpecs can find types.",
    " * Include in program rootNames when using typeTargetSpecs without user imports.",
    " */",
  ];
  for (const spec of specs) {
    if (seen.has(spec.module)) continue;
    seen.add(spec.module);
    const id = spec.module.replace(/\W+/g, "_").replace(/_+/g, "_") || "m";
    lines.push(`import * as _${id} from "${spec.module}";`);
    lines.push(`void _${id};`);
  }
  lines.push("export {};");
  return lines.join("\n");
}

/**
 * Resolve type targets from program imports using the given specs.
 * Scans source files for imports from the specified modules and extracts types.
 * Requires the program to include files that import from these modules (e.g.
 * use createTypeTargetBootstrapContent and add to rootNames).
 */
export function resolveTypeTargetsFromSpecs(
  program: ts.Program,
  tsMod: typeof import("typescript"),
  specs: readonly TypeTargetSpec[],
): ResolvedTypeTarget[] {
  const checker = program.getTypeChecker();
  const found = new Map<string, ts.Type>();

  const getTypeFromSymbol = (symbol: ts.Symbol): ts.Type | undefined => {
    const aliased = resolveAliasedSymbol(symbol, checker, tsMod);
    const decls =
      aliased.declarations ?? (aliased.valueDeclaration ? [aliased.valueDeclaration] : []);
    const typeDecl = decls.find(
      (d) =>
        tsMod.isTypeAliasDeclaration(d) ||
        tsMod.isInterfaceDeclaration(d) ||
        tsMod.isTypeParameterDeclaration(d),
    );
    const decl = typeDecl ?? decls[0];
    const useDeclaredType =
      decl &&
      (tsMod.isTypeAliasDeclaration(decl) ||
        tsMod.isInterfaceDeclaration(decl) ||
        tsMod.isTypeParameterDeclaration(decl));
    const type = useDeclaredType
      ? checker.getDeclaredTypeOfSymbol(aliased)
      : decl
        ? checker.getTypeOfSymbolAtLocation(aliased, decl)
        : checker.getDeclaredTypeOfSymbol(aliased);
    if (!type || (type.flags & tsMod.TypeFlags.Any) !== 0) return undefined;
    return type;
  };

  const getTypeFromSpec = (
    symbol: ts.Symbol,
    spec: (typeof specs)[number],
  ): ts.Type | undefined => {
    const primaryType = getTypeFromSymbol(symbol);
    if (!primaryType || !spec.typeMember) return primaryType;
    const aliased = resolveAliasedSymbol(symbol, checker, tsMod);
    const exports = getSymbolExports(aliased);
    if (!exports) return primaryType;
    const memberSymbol = Array.from(exports.values()).find((s) => s.getName() === spec.typeMember);
    if (!memberSymbol) return primaryType;
    const memberType = checker.getDeclaredTypeOfSymbol(memberSymbol);
    if (!memberType || (memberType.flags & tsMod.TypeFlags.Any) !== 0) return primaryType;
    return memberType;
  };

  const addFromModuleSymbol = (moduleSymbol: ts.Symbol | undefined, moduleSpec: string): void => {
    if (!moduleSymbol) return;
    const exportsByName = new Map(
      checker
        .getExportsOfModule(moduleSymbol)
        .map((moduleExport) => [moduleExport.getName(), moduleExport]),
    );
    for (const spec of specs) {
      if (spec.module !== moduleSpec || found.has(spec.id)) continue;
      const moduleExport = exportsByName.get(spec.exportName);
      if (!moduleExport) continue;
      const type = getTypeFromSpec(moduleExport, spec);
      if (type) found.set(spec.id, type);
    }
  };

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    tsMod.forEachChild(sourceFile, (node) => {
      if (!tsMod.isImportDeclaration(node)) return;
      const moduleSpecifier = node.moduleSpecifier;
      if (!tsMod.isStringLiteral(moduleSpecifier)) return;
      const moduleSpec = moduleSpecifier.text;
      const binding = node.importClause;
      if (!binding) return;
      const moduleSymbol = checker.getSymbolAtLocation(moduleSpecifier);

      const addNamed = (name: ts.ImportSpecifier) => {
        const exportName = (name.propertyName ?? name.name).getText(sourceFile);
        const spec = specs.find((s) => s.module === moduleSpec && s.exportName === exportName);
        if (!spec || found.has(spec.id)) return;
        const symbol = checker.getSymbolAtLocation(name.name);
        if (!symbol) return;
        const type = getTypeFromSpec(symbol, spec);
        if (type) found.set(spec.id, type);
      };

      if (binding.namedBindings) {
        if (tsMod.isNamedImports(binding.namedBindings)) {
          for (const elem of binding.namedBindings.elements) {
            addNamed(elem);
          }
        } else if (tsMod.isNamespaceImport(binding.namedBindings)) {
          const nsName = binding.namedBindings.name;
          const symbol = checker.getSymbolAtLocation(nsName);
          const nsType = symbol ? checker.getTypeOfSymbolAtLocation(symbol, nsName) : undefined;
          for (const spec of specs) {
            if (spec.module !== moduleSpec || found.has(spec.id)) continue;
            const prop = nsType?.getProperty?.(spec.exportName);
            if (!prop) continue;
            const type = getTypeFromSpec(prop, spec);
            if (type) found.set(spec.id, type);
          }
          addFromModuleSymbol(moduleSymbol, moduleSpec);
        }
      } else if (binding.name) {
        const symbol = checker.getSymbolAtLocation(binding.name);
        const nsType = symbol ? checker.getTypeOfSymbolAtLocation(symbol, binding.name) : undefined;
        for (const spec of specs) {
          if (spec.module !== moduleSpec || found.has(spec.id)) continue;
          const prop = nsType?.getProperty?.(spec.exportName);
          if (!prop) continue;
          const type = getTypeFromSpec(prop, spec);
          if (type) found.set(spec.id, type);
        }
        addFromModuleSymbol(moduleSymbol, moduleSpec);
      }
    });
  }

  return specs.filter((s) => found.has(s.id)).map((s) => ({ id: s.id, type: found.get(s.id)! }));
}

/**
 * Resolve an export symbol to the symbol it aliases when present (re-exports and import-then-export),
 * so we derive the type from the target file for cross-file type resolution.
 */
const resolveExportSymbol = (
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
): ts.Symbol => resolveAliasedSymbol(symbol, checker, tsMod);

/** Get the base GenericType from a generic instantiation (TypeReference). */
const getGenericBase = (
  type: ts.Type,
  checker: ts.TypeChecker,
): (ts.Type & { symbol?: ts.Symbol }) | undefined => getTypeReferenceTarget(type, checker);

/** Get the symbol representing the "root" type for comparison (handles GenericType and TypeReference). */
const getComparisonSymbol = (type: ts.Type, checker: ts.TypeChecker): ts.Symbol | undefined => {
  const base = getGenericBase(type, checker);
  if (base?.symbol) return base.symbol;
  return getTypeSymbol(type);
};

type AssignabilityMode = "strict" | "compatibility";

/**
 * Assignability and serialization may use internal TS APIs or heuristics. When those
 * paths throw, errors are caught and behavior degrades (e.g. "not assignable" or a
 * safe fallback node); no errors are thrown to the caller. Use session option
 * onInternalError for observability when provided.
 */

/**
 * Check assignability. In strict mode, uses only checker.isTypeAssignableTo.
 * In compatibility mode, adds fallbacks for generic instantiations and inheritance
 * when types come from different files. Union sources require ALL constituents to
 * be assignable (sound semantics).
 */
const isAssignableTo = (
  source: ts.Type,
  target: ts.Type,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  mode: AssignabilityMode,
): boolean => {
  if (checker.isTypeAssignableTo(source, target)) return true;
  if (mode === "strict") return false;

  const tgtBase = getGenericBase(target, checker);
  const tgtSymbol = tgtBase?.symbol ?? getTypeSymbol(target);
  const matchSymbol = (sym: ts.Symbol | undefined) => sym && tgtSymbol && sym === tgtSymbol;

  if (source.isUnion()) {
    const constituents = source.types;
    if (!constituents.every((t) => isAssignableTo(t, target, checker, tsMod, mode))) return false;
    return true;
  }

  const srcBase = getGenericBase(source, checker);
  if (srcBase?.symbol && matchSymbol(srcBase.symbol)) return true;

  const tgtTarget = getTypeReferenceTarget(target, checker);
  if (srcBase?.symbol && tgtTarget?.symbol && srcBase.symbol === tgtTarget.symbol) return true;

  const srcSymbol = getComparisonSymbol(source, checker);
  if (matchSymbol(srcSymbol)) return true;

  if ((source.flags & tsMod.TypeFlags.Object) !== 0) {
    const srcSym = (source as ts.Type & { symbol?: ts.Symbol }).symbol;
    const isClassOrInterface =
      srcSym && (srcSym.flags & (tsMod.SymbolFlags.Class | tsMod.SymbolFlags.Interface)) !== 0;
    if (isClassOrInterface) {
      const bases = getBaseTypesInternal(source as ts.InterfaceType, checker);
      const hasMatchingBase = (bases ?? []).some((b) => {
        const bSym = getTypeSymbol(b);
        return bSym && matchSymbol(bSym);
      });
      if (hasMatchingBase) return true;
    }
  }

  const tgtName = tgtSymbol?.getName();
  if (tgtName && srcBase?.symbol?.getName() === tgtName) return true;
  if (tgtName && srcSymbol?.getName() === tgtName) return true;

  return false;
};

const serializeExport = (
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  maxDepth: number,
  onInternalError?: (err: unknown, context: string) => void,
  registry?: WeakMap<TypeNode, ts.Type>,
): ExportedTypeInfo => {
  const resolved = resolveExportSymbol(symbol, checker, tsMod);
  const declaration = resolved.valueDeclaration ?? resolved.declarations?.[0];
  const useDeclaredType =
    declaration &&
    (tsMod.isTypeAliasDeclaration(declaration) || tsMod.isInterfaceDeclaration(declaration));
  const exportedType = useDeclaredType
    ? checker.getDeclaredTypeOfSymbol(resolved)
    : declaration
      ? checker.getTypeOfSymbolAtLocation(resolved, declaration)
      : checker.getDeclaredTypeOfSymbol(resolved);

  return {
    name: symbol.getName(),
    declarationKind: declaration ? tsMod.SyntaxKind[declaration.kind] : undefined,
    declarationText: declaration ? declaration.getText() : undefined,
    docs: tsMod.displayPartsToString(symbol.getDocumentationComment(checker)) || undefined,
    type: serializeTypeNode(
      exportedType,
      checker,
      tsMod,
      0,
      maxDepth,
      new Set(),
      onInternalError,
      registry,
    ),
  };
};

const collectImports = (
  sourceFile: ts.SourceFile,
  program: ts.Program,
  tsMod: typeof import("typescript"),
): ImportInfo[] => {
  const imports: ImportInfo[] = [];
  tsMod.forEachChild(sourceFile, (node) => {
    if (!tsMod.isImportDeclaration(node)) return;
    const moduleSpecifier = node.moduleSpecifier;
    if (!tsMod.isStringLiteral(moduleSpecifier)) return;
    const spec = moduleSpecifier.text;
    const binding = node.importClause;
    let info: ImportInfo = { moduleSpecifier: spec };
    if (binding) {
      if (binding.namedBindings) {
        if (tsMod.isNamedImports(binding.namedBindings)) {
          info = {
            ...info,
            importedNames: binding.namedBindings.elements.map((el) =>
              (el.propertyName ?? el.name).getText(sourceFile),
            ),
          };
        } else if (tsMod.isNamespaceImport(binding.namedBindings)) {
          info = {
            ...info,
            namespaceImport: binding.namedBindings.name.getText(sourceFile),
          };
        }
      }
      if (binding.name) {
        info = { ...info, defaultImport: binding.name.getText(sourceFile) };
      }
    }
    imports.push(info);
  });
  return imports;
};

const createFileSnapshot = (
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  program: ts.Program,
  tsMod: typeof import("typescript"),
  maxDepth: number,
  includeImports: boolean,
  onInternalError?: (err: unknown, context: string) => void,
  registry?: WeakMap<TypeNode, ts.Type>,
): TypeInfoFileSnapshot => {
  const filePath = sourceFile.fileName;
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  const exports = moduleSymbol
    ? checker
        .getExportsOfModule(moduleSymbol)
        .map((value) => serializeExport(value, checker, tsMod, maxDepth, onInternalError, registry))
        .sort(compareByName)
    : [];
  const imports = includeImports ? collectImports(sourceFile, program, tsMod) : undefined;

  return {
    filePath,
    exports,
    ...(imports !== undefined && imports.length > 0 ? { imports } : {}),
  };
};

/**
 * Apply a sequence of projection steps to a ts.Type, navigating to a sub-type.
 * Returns undefined when any step fails (e.g. returnType on non-function).
 */
const applyProjection = (
  type: ts.Type,
  steps: readonly TypeProjectionStep[],
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
  opts: {
    onInternalError?: (err: unknown, context: string) => void;
    targetsByIdMap: Map<string, ts.Type>;
    assignabilityMode: AssignabilityMode;
    maxDepth: number;
  },
): ts.Type | undefined => {
  const { onInternalError, targetsByIdMap, assignabilityMode, maxDepth } = opts;
  let current: ts.Type = type;
  for (const step of steps) {
    try {
      switch (step.kind) {
        case "returnType": {
          const sigs = checker.getSignaturesOfType(current, tsMod.SignatureKind.Call);
          if (sigs.length === 0) return undefined;
          current = checker.getReturnTypeOfSignature(sigs[0]);
          break;
        }
        case "param": {
          const sigs = checker.getSignaturesOfType(current, tsMod.SignatureKind.Call);
          if (sigs.length === 0) return undefined;
          const params = sigs[0].getParameters();
          if (step.index < 0 || step.index >= params.length) return undefined;
          const param = params[step.index];
          const decl = param.valueDeclaration ?? param.declarations?.[0];
          current = decl
            ? checker.getTypeOfSymbolAtLocation(param, decl)
            : checker.getDeclaredTypeOfSymbol(param);
          break;
        }
        case "typeArg": {
          const args = checker.getTypeArguments(current as ts.TypeReference);
          if (step.index < 0 || step.index >= args.length) return undefined;
          current = args[step.index];
          break;
        }
        case "property": {
          const prop = current.getProperty(step.name);
          if (!prop) return undefined;
          const decl = prop.valueDeclaration ?? prop.declarations?.[0];
          current = decl
            ? checker.getTypeOfSymbolAtLocation(prop, decl)
            : checker.getDeclaredTypeOfSymbol(prop);
          break;
        }
        case "ensure": {
          const target = targetsByIdMap.get(step.targetId);
          if (!target) return undefined;
          if (!isAssignableTo(current, target, checker, tsMod, assignabilityMode)) return undefined;
          break;
        }
        case "predicate": {
          const serialized = serializeTypeNode(
            current,
            checker,
            tsMod,
            0,
            maxDepth,
            new Set(),
            onInternalError,
          );
          if (!step.fn(serialized)) return undefined;
          break;
        }
        default:
          return undefined;
      }
    } catch (err) {
      onInternalError?.(err, `applyProjection:${step.kind}`);
      return undefined;
    }
  }
  return current;
};

export const createTypeInfoApiSession = (
  options: CreateTypeInfoApiSessionOptions,
): TypeInfoApiSession => {
  let effectiveTypeTargets: readonly ResolvedTypeTarget[] | undefined =
    options.typeTargets ??
    (options.typeTargetSpecs?.length
      ? resolveTypeTargetsFromSpecs(options.program, options.ts, options.typeTargetSpecs)
      : undefined);

  const failWhenNoTargets = options.failWhenNoTargetsResolved !== false;
  if (
    failWhenNoTargets &&
    options.typeTargetSpecs &&
    options.typeTargetSpecs.length > 0 &&
    (!effectiveTypeTargets || effectiveTypeTargets.length === 0)
  ) {
    const modules = [...new Set(options.typeTargetSpecs.map((s) => s.module))].join(", ");
    throw new Error(
      `type targets could not be resolved; ensure program includes imports from: ${modules}. ` +
        "Use createTypeTargetBootstrapContent(typeTargetSpecs) to generate a bootstrap file and add it to program rootNames.",
    );
  }
  const checker = options.program.getTypeChecker();
  const descriptors = new Map<string, WatchDependencyDescriptor>();
  const snapshotCache = new Map<string, TypeInfoFileSnapshot>();
  const directoryCache = new Map<string, TypeInfoFileSnapshot[]>();
  const maxDepth = options.maxTypeDepth ?? DEFAULT_MAX_DEPTH;
  const assignabilityMode: AssignabilityMode = options.assignabilityMode ?? "compatibility";
  const typeNodeRegistry = new WeakMap<TypeNode, ts.Type>();
  const targetsByIdMap = new Map<string, ts.Type>(
    (effectiveTypeTargets ?? []).map((t) => [t.id, t.type]),
  );

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
      sourceFile,
      checker,
      options.program,
      options.ts,
      maxDepth,
      true,
      options.onInternalError,
      typeNodeRegistry,
    );
    snapshotCache.set(absolutePath, snapshot);
    return { ok: true, snapshot };
  };

  const directoryCacheKey = (
    baseDir: string,
    normalizedGlobs: readonly string[],
    recursive: boolean,
  ): string => `${baseDir}\0${normalizedGlobs.join("\0")}\0${recursive ? "r" : "nr"}`;

  const directory: TypeInfoApi["directory"] = (relativeGlobs, queryOptions) => {
    const baseDirResult = validatePathSegment(queryOptions.baseDir, "baseDir");
    if (!baseDirResult.ok) return [];
    const baseDir = baseDirResult.value;

    const globsResult = validateRelativeGlobs(relativeGlobs, "relativeGlobs");
    if (!globsResult.ok) return [];
    const normalizedGlobs = dedupeSorted(globsResult.value);

    const cacheKey = directoryCacheKey(baseDir, normalizedGlobs, queryOptions.recursive ?? false);
    const cached = directoryCache.get(cacheKey);
    if (cached !== undefined) return cached;

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
    const snapshots = filteredMatches.flatMap((filePath) => {
      const sf = program.getSourceFile(filePath);
      if (!sf) return [];
      try {
        return [
          createFileSnapshot(
            sf,
            checker,
            program,
            tsMod,
            maxDepth,
            true,
            options.onInternalError,
            typeNodeRegistry,
          ),
        ];
      } catch (err) {
        options.onInternalError?.(err, `directory() serialization for ${filePath}`);
        return [];
      }
    });
    directoryCache.set(cacheKey, snapshots);
    return snapshots;
  };

  const resolveExport = (
    baseDir: string,
    filePath: string,
    exportName: string,
  ): ExportedTypeInfo | undefined => {
    const result = file(filePath, { baseDir });
    if (!result.ok) return undefined;
    return result.snapshot.exports.find((e) => e.name === exportName);
  };

  const apiIsAssignableTo = (
    node: TypeNode,
    targetId: string,
    projection?: readonly TypeProjectionStep[],
  ): boolean => {
    const sourceType = typeNodeRegistry.get(node);
    if (!sourceType) return false;
    const targetType = targetsByIdMap.get(targetId);
    if (!targetType) return false;
    const projected = projection?.length
      ? applyProjection(sourceType, projection, checker, options.ts, {
          onInternalError: options.onInternalError,
          targetsByIdMap,
          assignabilityMode,
          maxDepth,
        })
      : sourceType;
    if (!projected) return false;
    return isAssignableTo(projected, targetType, checker, options.ts, assignabilityMode);
  };

  return {
    api: {
      file,
      directory,
      resolveExport,
      isAssignableTo: apiIsAssignableTo,
    },
    consumeDependencies: () => [...descriptors.values()],
  };
};

export const createTypeInfoApiSessionFactory =
  (options: CreateTypeInfoApiSessionOptions): CreateTypeInfoApiSession =>
  () =>
    createTypeInfoApiSession(options);
