import type * as ts from "typescript";

/**
 * Type-safe AST for serialized types. Discriminated union by `kind`.
 * Use `node.kind` to narrow; each variant exposes only its fields (e.g. `UnionTypeNode.elements`, `FunctionTypeNode.parameters`).
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
  | ObjectTypeNode;

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
}

/**
 * Result of structural assignability checks. When `typeTargets` are provided to
 * createTypeInfoApiSession, each export gets assignableTo[id] = true iff the export's
 * type is assignable to that target. Enables plugins to use checker.isTypeAssignableTo
 * instead of string-based type name parsing.
 */
export interface ExportedTypeInfo {
  readonly name: string;
  readonly declarationKind?: string;
  readonly declarationText?: string;
  readonly docs?: string;
  readonly type: TypeNode;
  readonly assignableTo?: Readonly<Record<string, boolean>>;
}

export interface TypeInfoFileSnapshot {
  readonly filePath: string;
  readonly exports: readonly ExportedTypeInfo[];
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

export type VirtualModuleBuildResult =
  | string
  | VirtualModuleBuildSuccess
  | VirtualModuleBuildError;

export interface VirtualModulePlugin {
  readonly name: string;
  shouldResolve(id: string, importer: string): boolean;
  build(id: string, importer: string, api: TypeInfoApi): VirtualModuleBuildResult;
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
