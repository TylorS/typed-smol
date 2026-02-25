import type * as ts from "typescript";

/**
 * Type-safe AST for serialized types. Discriminated union by `kind`.
 * Use `node.kind` to narrow; each variant exposes only its fields (e.g. `UnionTypeNode.elements`, `FunctionTypeNode.parameters`).
 *
 * Forward-compatible consumer guidance: Use a switch with a default branch that handles unknown kinds
 * (e.g. `return node.text` or fallback behavior). New `kind` values may be added over time;
 * consumers that only care about specific variants should explicitly list them and treat others as opaque.
 *
 * @example
 * function visit(node: TypeNode): string {
 *   switch (node.kind) {
 *     case "union": return node.elements.map(visit).join(" | ");
 *     case "function": return `(${node.parameters.map(p => p.name).join(", ")}) => ${visit(node.returnType)}`;
 *     case "object": return `{ ${node.properties.map(p => p.name).join(", ")} }`;
 *     default: return node.text;
 *   }
 * }
 */
export type TypeNode =
  | LiteralTypeNode
  | PrimitiveTypeNode
  | AnyTypeNode
  | UnknownTypeNode
  | NeverTypeNode
  | UnionTypeNode
  | IntersectionTypeNode
  | TupleTypeNode
  | ArrayTypeNode
  | FunctionTypeNode
  | ReferenceTypeNode
  | ObjectTypeNode
  | ConditionalTypeNode
  | IndexedAccessTypeNode
  | TemplateLiteralTypeNode
  | MappedTypeNode
  | TypeOperatorTypeNode
  | ConstructorTypeNode
  | IndexSignatureTypeNode
  | OverloadSetTypeNode
  | EnumTypeNode;

export interface LiteralTypeNode {
  readonly kind: "literal";
  readonly text: string;
}

export interface PrimitiveTypeNode {
  readonly kind: "primitive";
  readonly text: string;
}

export interface AnyTypeNode {
  readonly kind: "any";
  readonly text: string;
}

export interface UnknownTypeNode {
  readonly kind: "unknown";
  readonly text: string;
}

export interface NeverTypeNode {
  readonly kind: "never";
  readonly text: string;
}

export interface UnionTypeNode {
  readonly kind: "union";
  readonly text: string;
  readonly elements: readonly TypeNode[];
}

export interface IntersectionTypeNode {
  readonly kind: "intersection";
  readonly text: string;
  readonly elements: readonly TypeNode[];
}

export interface TupleTypeNode {
  readonly kind: "tuple";
  readonly text: string;
  readonly elements: readonly TypeNode[];
}

export interface ArrayTypeNode {
  readonly kind: "array";
  readonly text: string;
  readonly elements: readonly TypeNode[];
}

export interface TypeParameter {
  readonly name: string;
  readonly optional: boolean;
  readonly type: TypeNode;
}

export interface FunctionTypeNode {
  readonly kind: "function";
  readonly text: string;
  readonly parameters: readonly TypeParameter[];
  readonly returnType: TypeNode;
}

export interface ReferenceTypeNode {
  readonly kind: "reference";
  readonly text: string;
  readonly typeArguments?: readonly TypeNode[];
}

export interface ObjectProperty {
  readonly name: string;
  readonly optional: boolean;
  readonly readonly: boolean;
  readonly type: TypeNode;
}

export interface ObjectTypeNode {
  readonly kind: "object";
  readonly text: string;
  readonly properties: readonly ObjectProperty[];
  /** Optional index signature for `[key: K]: V` when present. */
  readonly indexSignature?: IndexSignatureInfo;
}

export interface IndexSignatureInfo {
  readonly keyType: TypeNode;
  readonly valueType: TypeNode;
  readonly readonly: boolean;
}

export interface ConditionalTypeNode {
  readonly kind: "conditional";
  readonly text: string;
  readonly checkType: TypeNode;
  readonly extendsType: TypeNode;
  readonly trueType: TypeNode;
  readonly falseType: TypeNode;
}

export interface IndexedAccessTypeNode {
  readonly kind: "indexedAccess";
  readonly text: string;
  readonly objectType: TypeNode;
  readonly indexType: TypeNode;
}

export interface TemplateLiteralTypeNode {
  readonly kind: "templateLiteral";
  readonly text: string;
  readonly texts: readonly string[];
  readonly types: readonly TypeNode[];
}

export interface MappedTypeNode {
  readonly kind: "mapped";
  readonly text: string;
  readonly constraintType: TypeNode;
  readonly mappedType: TypeNode;
  readonly readonlyModifier?: "+" | "-" | undefined;
  readonly optionalModifier?: "+" | "-" | undefined;
}

export interface TypeOperatorTypeNode {
  readonly kind: "typeOperator";
  readonly text: string;
  readonly operator: "keyof" | "unique" | "readonly";
  readonly type: TypeNode;
}

export interface ConstructorTypeNode {
  readonly kind: "constructor";
  readonly text: string;
  readonly parameters: readonly TypeParameter[];
  readonly returnType: TypeNode;
}

export interface IndexSignatureTypeNode {
  readonly kind: "indexSignature";
  readonly text: string;
  readonly keyType: TypeNode;
  readonly valueType: TypeNode;
  readonly readonly: boolean;
}

export interface FunctionSignature {
  readonly parameters: readonly TypeParameter[];
  readonly returnType: TypeNode;
}

export interface OverloadSetTypeNode {
  readonly kind: "overloadSet";
  readonly text: string;
  readonly signatures: readonly FunctionSignature[];
}

export interface EnumTypeNode {
  readonly kind: "enum";
  readonly text: string;
  readonly members?: readonly { readonly name: string; readonly value?: string | number }[];
}

export interface ExportedTypeInfo {
  readonly name: string;
  readonly declarationKind?: string;
  readonly declarationText?: string;
  readonly docs?: string;
  readonly type: TypeNode;
}

/**
 * A step that navigates from one type to a sub-type during assignability checking.
 * Steps chain left-to-right when composed in an array.
 */
export type TypeProjectionStep =
  | { readonly kind: "returnType" }
  | { readonly kind: "param"; readonly index: number }
  | { readonly kind: "typeArg"; readonly index: number }
  | { readonly kind: "property"; readonly name: string };

/**
 * Spec for resolving a type from program imports for structural assignability checks.
 * Used with createTypeInfoApiSession typeTargetSpecs option; resolution happens internally.
 */
export interface TypeTargetSpec {
  readonly id: string;
  readonly module: string;
  readonly exportName: string;
  /**
   * When the export is a merged interface+namespace with a type member that accepts
   * all generic instantiations (e.g. Route.Any = Route<any, any>), use this to
   * resolve that member's type for assignability checks.
   * Enables Route.Parse("/status") (Route<"/status">) to pass assignableTo.Route
   * by comparing against Route.Any instead of the uninstantiated generic.
   */
  readonly typeMember?: string;
}

/**
 * Import information for cross-file reference resolution.
 * Enables plugins to trace symbols to their source declarations.
 */
export interface ImportInfo {
  readonly moduleSpecifier: string;
  readonly importedNames?: readonly string[];
  readonly defaultImport?: string;
  readonly namespaceImport?: string;
  /**
   * Resolved absolute path when the module resolves to a project file.
   * Optional; not currently populated by the API. Reserved for future use (e.g. plugin navigation).
   */
  readonly resolvedFilePath?: string;
}

export interface TypeInfoFileSnapshot {
  readonly filePath: string;
  readonly exports: readonly ExportedTypeInfo[];
  /** Imports present in the file for cross-file reference resolution. */
  readonly imports?: readonly ImportInfo[];
}

export interface FileSnapshotSuccess {
  readonly ok: true;
  readonly snapshot: TypeInfoFileSnapshot;
}

export type FileSnapshotErrorCode = "file-not-in-program" | "path-escapes-base" | "invalid-input";

export interface FileSnapshotError {
  readonly ok: false;
  readonly error: FileSnapshotErrorCode;
  readonly path?: string;
}

export type FileSnapshotResult = FileSnapshotSuccess | FileSnapshotError;

export interface TypeInfoFileQueryOptions {
  readonly baseDir: string;
  readonly watch?: boolean;
}

export interface TypeInfoDirectoryQueryOptions {
  readonly baseDir: string;
  readonly recursive: boolean;
  readonly watch?: boolean;
}

export interface FileWatchDependencyDescriptor {
  readonly type: "file";
  readonly path: string;
}

export interface GlobWatchDependencyDescriptor {
  readonly type: "glob";
  readonly baseDir: string;
  readonly relativeGlobs: readonly string[];
  readonly recursive: boolean;
}

export type WatchDependencyDescriptor =
  | FileWatchDependencyDescriptor
  | GlobWatchDependencyDescriptor;

export interface TypeInfoApi {
  file(relativePath: string, options: TypeInfoFileQueryOptions): FileSnapshotResult;
  directory(
    relativeGlobs: string | readonly string[],
    options: TypeInfoDirectoryQueryOptions,
  ): readonly TypeInfoFileSnapshot[];
  /**
   * Resolve an export by name from a file. Use baseDir-relative filePath.
   * Returns undefined when the file is not in the program or the export is not found.
   */
  resolveExport(
    baseDir: string,
    filePath: string,
    exportName: string,
  ): ExportedTypeInfo | undefined;
  /**
   * Dynamic structural assignability check. Looks up the ts.Type backing `node`
   * (registered during serialization), optionally applies projection steps to
   * navigate to a sub-type, then checks assignability against the resolved target.
   *
   * Returns false when: node was not created by this API, projection fails
   * (e.g. returnType on non-function), or targetId was not resolved.
   *
   * Plugins can navigate the TypeNode tree themselves and pass any sub-node
   * (e.g. `functionNode.returnType`, `referenceNode.typeArguments[0]`) since
   * all nodes are registered during serialization.
   */
  isAssignableTo(
    node: TypeNode,
    targetId: string,
    projection?: readonly TypeProjectionStep[],
  ): boolean;
}

export interface TypeInfoApiSession {
  readonly api: TypeInfoApi;
  consumeDependencies(): readonly WatchDependencyDescriptor[];
}

export interface TypeInfoApiFactoryParams {
  readonly id: string;
  readonly importer: string;
}

export type CreateTypeInfoApiSession = (params: TypeInfoApiFactoryParams) => TypeInfoApiSession;

/** Result of a successful build; plain string is treated as { sourceText }. */
export interface VirtualModuleBuildSuccess {
  readonly sourceText: string;
  readonly warnings?: readonly VirtualModuleDiagnostic[];
}

/** Result of a failed build with structured errors. */
export interface VirtualModuleBuildError {
  readonly errors: readonly VirtualModuleDiagnostic[];
}

export type VirtualModuleBuildResult = string | VirtualModuleBuildSuccess | VirtualModuleBuildError;

/** Type guard: true when the build result indicates failure with structured errors. */
export function isVirtualModuleBuildError(
  result: VirtualModuleBuildResult,
): result is VirtualModuleBuildError {
  return (
    typeof result === "object" &&
    result !== null &&
    "errors" in result &&
    Array.isArray((result as VirtualModuleBuildError).errors) &&
    (result as VirtualModuleBuildError).errors.length > 0
  );
}

/** Type guard: true when the build result indicates success with sourceText. */
export function isVirtualModuleBuildSuccess(
  result: VirtualModuleBuildResult,
): result is VirtualModuleBuildSuccess {
  return (
    typeof result === "object" &&
    result !== null &&
    "sourceText" in result &&
    typeof (result as VirtualModuleBuildSuccess).sourceText === "string"
  );
}

export interface VirtualModulePlugin {
  readonly name: string;
  shouldResolve(id: string, importer: string): boolean;
  build(id: string, importer: string, api: TypeInfoApi): VirtualModuleBuildResult;
  /**
   * Optional type target specs for structural assignability checks.
   * Plugins that need assignableTo (e.g. Route, Effect) should declare them here.
   * Specs from all plugins are merged (deduped by id) when creating the TypeInfo session.
   */
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

export interface VirtualModuleDiagnostic {
  readonly code:
    | "plugin-should-resolve-threw"
    | "plugin-build-threw"
    | "session-creation-failed"
    | "invalid-build-output"
    | "invalid-options"
    | "re-entrant-resolution"
    | (string & {}); // allow plugin-specific codes e.g. RVM-GUARD-001
  readonly message: string;
  readonly pluginName: string;
}

export interface VirtualModuleResolved {
  readonly status: "resolved";
  readonly pluginName: string;
  readonly sourceText: string;
  readonly dependencies: readonly WatchDependencyDescriptor[];
  readonly warnings?: readonly VirtualModuleDiagnostic[];
}

export interface VirtualModuleUnresolved {
  readonly status: "unresolved";
}

export interface VirtualModuleError {
  readonly status: "error";
  readonly diagnostic: VirtualModuleDiagnostic;
}

export type VirtualModuleResolution =
  | VirtualModuleResolved
  | VirtualModuleUnresolved
  | VirtualModuleError;

export interface ResolveVirtualModuleOptions {
  readonly id: string;
  readonly importer: string;
  readonly createTypeInfoApiSession?: CreateTypeInfoApiSession;
}

export interface VirtualModuleResolver {
  resolveModule(options: ResolveVirtualModuleOptions): VirtualModuleResolution;
}

export interface NodeModulePluginRequest {
  readonly specifier: string;
  readonly baseDir: string;
}

export type NodeModulePluginLoadInput = VirtualModulePlugin | NodeModulePluginRequest;

export interface NodeModulePluginLoadSuccess {
  readonly status: "loaded";
  readonly plugin: VirtualModulePlugin;
  readonly resolvedPath: string;
}

export interface NodeModulePluginLoadError {
  readonly status: "error";
  readonly specifier: string;
  readonly baseDir: string;
  readonly code:
    | "module-not-found"
    | "module-load-failed"
    | "invalid-plugin-export"
    | "path-escapes-base"
    | "invalid-request";
  readonly message: string;
}

export type NodeModulePluginLoadResult = NodeModulePluginLoadSuccess | NodeModulePluginLoadError;

export interface VirtualModuleRecord {
  readonly key: string;
  readonly id: string;
  readonly importer: string;
  readonly pluginName: string;
  readonly virtualFileName: string;
  readonly sourceText: string;
  readonly dependencies: readonly WatchDependencyDescriptor[];
  readonly diagnostic?: VirtualModuleDiagnostic;
  readonly warnings?: readonly VirtualModuleDiagnostic[];
  readonly version: number;
  readonly stale: boolean;
}

export interface LanguageServiceWatchHost {
  watchFile?: (
    path: string,
    callback: ts.FileWatcherCallback,
    pollingInterval?: number,
    options?: ts.WatchOptions,
  ) => ts.FileWatcher;
  watchDirectory?: (
    path: string,
    callback: ts.DirectoryWatcherCallback,
    recursive?: boolean,
    options?: ts.WatchOptions,
  ) => ts.FileWatcher;
}

export interface LanguageServiceAdapterOptions {
  readonly ts: typeof import("typescript");
  readonly languageService: ts.LanguageService;
  readonly languageServiceHost: ts.LanguageServiceHost;
  readonly resolver: VirtualModuleResolver;
  readonly projectRoot: string;
  readonly createTypeInfoApiSession?: CreateTypeInfoApiSession;
  readonly watchHost?: LanguageServiceWatchHost;
  /** Coalesce rapid watch events (ms). When set, markStale is deferred until after the delay. */
  readonly debounceMs?: number;
}

export interface CompilerHostAdapterOptions {
  readonly ts: typeof import("typescript");
  readonly compilerHost: ts.CompilerHost;
  readonly resolver: VirtualModuleResolver;
  readonly projectRoot: string;
  readonly createTypeInfoApiSession?: CreateTypeInfoApiSession;
  readonly watchHost?: LanguageServiceWatchHost;
  /** Coalesce rapid watch events (ms). When set, markStale is deferred until after the delay. */
  readonly debounceMs?: number;
}

export interface VirtualModuleAdapterHandle {
  dispose(): void;
}
