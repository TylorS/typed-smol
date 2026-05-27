/**
 * Emits static HttpApi assembly from endpoint modules.
 * Endpoint exports: route (path + pathSchema + querySchema), method, handler;
 * optional headers, body, error, success. Handler receives { path, query, headers, body }
 * with type-safe decoding. Use HttpApiSchema.status(code) on error/success schemas
 * to annotate response status codes.
 *
 * TypeInfo-first: only emits references to exports that are in optionalExportsByPath.
 * The compiler must know what is available from TypeInfo—if it's not there, it is not emitted.
 */
import { basename, dirname, join, relative } from "node:path";
import type {
  DirectoryConventionRef,
  HttpApiDescriptorTree,
  HttpApiEndpointNode,
  HttpApiGroupNode,
  HttpApiTreeNode,
  RootOrGroupConventionRef,
} from "./httpapiDescriptorTree.js";
import type {
  HttpApiDirectoryCompanionKind,
  HttpApiEndpointCompanionKind,
} from "./httpapiFileRoles.js";
import { compareHttpApiPathOrder } from "./httpapiFileRoles.js";
import { stripScriptExtension, toPosixPath } from "./path.js";
import { makeUniqueVarNames, pathToIdentifier } from "./routeIdentifiers.js";
import type { HttpApiOpenApiPlan } from "./httpapiOpenApiPlan.js";
import type {
  OpenApiAnnotationsConfig,
  OpenApiExposureConfig,
  OpenApiGenerationConfig,
} from "./httpapiOpenApiConfig.js";
import type { PrefixByScope } from "./validatePrefixConventions.js";
import { mustEmitAllExports, type VirtualModuleBuildContext } from "@typed/virtual-modules";

const ROOT_GROUP_KEY = "__root__";

export type HttpApiEmitMode = "full" | "client";

export type HttpApiExportExpressionImport =
  | {
      readonly kind: "named";
      readonly moduleSpecifier: string;
      readonly importedName: string;
      readonly localName: string;
    }
  | {
      readonly kind: "namespace";
      readonly moduleSpecifier: string;
      readonly localName: string;
    }
  | {
      readonly kind: "default";
      readonly moduleSpecifier: string;
      readonly localName: string;
    };

export interface HttpApiExportExpression {
  readonly expression: string;
  readonly imports: readonly HttpApiExportExpressionImport[];
}

function joinPathSegments(segments: readonly string[]): string {
  const combined = segments
    .filter((s) => s.length > 0)
    .map((s) => s.replace(/\/+$/, "").replace(/^\//, ""))
    .filter((s) => s.length > 0)
    .join("/");
  return combined ? `/${combined}` : "";
}

function resolveEffectivePrefixForGroup(
  groupDirPath: string,
  prefixByScope: PrefixByScope | undefined,
  pathPrefixOverride: `/${string}` | undefined,
): string {
  if (!prefixByScope) {
    return pathPrefixOverride ?? "";
  }
  const parts: string[] = [];
  if (prefixByScope.apiRoot) {
    parts.push(prefixByScope.apiRoot);
  } else if (pathPrefixOverride) {
    parts.push(pathPrefixOverride);
  }
  for (const anc of ancestorDirs(groupDirPath)) {
    const p = prefixByScope.byDirectory.get(anc);
    if (p) parts.push(p);
  }
  const groupPrefix = prefixByScope.byGroupDir.get(groupDirPath);
  if (groupPrefix) parts.push(groupPrefix);
  const composed = joinPathSegments(parts);
  return composed;
}

const DIRECTORY_CONVENTION_KINDS = [
  "_dependencies.ts",
  "_errors.ts",
  "_headers.ts",
  "_middlewares.ts",
  "_prefix.ts",
  "_openapi.ts",
] as const satisfies readonly HttpApiDirectoryCompanionKind[];

type DirectoryConventionKind = (typeof DIRECTORY_CONVENTION_KINDS)[number];

type DirectoryCompanionPaths = Readonly<Record<DirectoryConventionKind, readonly string[]>>;
type MutableDirectoryCompanionPaths = Record<DirectoryConventionKind, string[]>;

type EndpointCompanionPaths = {
  readonly ".name"?: string;
  readonly ".dependencies"?: string;
  readonly ".middlewares"?: string;
  readonly ".prefix"?: string;
  readonly ".openapi"?: string;
};

type EndpointRenderSpec = {
  readonly path: string;
  readonly stem: string;
  readonly groupKey: string;
  readonly modulePath: string;
  readonly companions: EndpointCompanionPaths;
  readonly directoryCompanions: DirectoryCompanionPaths;
};

type GroupRenderSpec = {
  readonly key: string;
  readonly dirPath: string;
  readonly defaultName: string;
  readonly overridePath?: string;
  readonly directoryCompanions: DirectoryCompanionPaths;
};

type ApiRenderSpec = {
  readonly defaultIdentifier: string;
  readonly apiRootPath?: string;
  readonly directoryCompanions: DirectoryCompanionPaths;
};

type DirectoryConventionIndexEntry = {
  readonly apiRootPaths: string[];
  readonly groupOverridePaths: string[];
  readonly companionPaths: MutableDirectoryCompanionPaths;
};

type EndpointWithGroupKey = {
  readonly node: HttpApiEndpointNode;
  readonly groupKey: string;
};

function createMutableDirectoryCompanionPaths(): MutableDirectoryCompanionPaths {
  return {
    "_dependencies.ts": [],
    "_errors.ts": [],
    "_headers.ts": [],
    "_middlewares.ts": [],
    "_prefix.ts": [],
    "_openapi.ts": [],
  };
}

function freezeDirectoryCompanionPaths(
  paths: MutableDirectoryCompanionPaths,
): DirectoryCompanionPaths {
  return {
    "_dependencies.ts": [...paths["_dependencies.ts"]],
    "_errors.ts": [...paths["_errors.ts"]],
    "_headers.ts": [...paths["_headers.ts"]],
    "_middlewares.ts": [...paths["_middlewares.ts"]],
    "_prefix.ts": [...paths["_prefix.ts"]],
    "_openapi.ts": [...paths["_openapi.ts"]],
  };
}

function createDirectoryConventionIndexEntry(): DirectoryConventionIndexEntry {
  return {
    apiRootPaths: [],
    groupOverridePaths: [],
    companionPaths: createMutableDirectoryCompanionPaths(),
  };
}

function normalizeDirPath(dirPath: string): string {
  return dirPath === "." ? "" : dirPath;
}

function dirnamePosix(path: string): string {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
}

function ancestorDirs(dirPath: string): string[] {
  const normalized = normalizeDirPath(dirPath);
  if (normalized === "") return [""];
  const segments = normalized.split("/").filter(Boolean);
  const out: string[] = [""];
  let current = "";
  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    out.push(current);
  }
  return out;
}

function pushUnique(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value);
}

function pushUniqueMany(values: string[], incoming: readonly string[]): void {
  for (const value of incoming) {
    pushUnique(values, value);
  }
}

function sortDirectoryCompanionPaths(paths: MutableDirectoryCompanionPaths): void {
  for (const kind of DIRECTORY_CONVENTION_KINDS) {
    paths[kind].sort(compareHttpApiPathOrder);
  }
}

function upsertIndexEntry(
  index: Map<string, DirectoryConventionIndexEntry>,
  dirPath: string,
): DirectoryConventionIndexEntry {
  const normalized = normalizeDirPath(dirPath);
  const existing = index.get(normalized);
  if (existing) return existing;
  const created = createDirectoryConventionIndexEntry();
  index.set(normalized, created);
  return created;
}

function addConventionToIndex(
  entry: DirectoryConventionIndexEntry,
  convention: DirectoryConventionRef | RootOrGroupConventionRef,
): void {
  if (convention.kind === "api_root") {
    pushUnique(entry.apiRootPaths, convention.path);
    return;
  }
  if (convention.kind === "group_override") {
    pushUnique(entry.groupOverridePaths, convention.path);
    return;
  }
  pushUnique(entry.companionPaths[convention.kind], convention.path);
}

function indexDirectoryConventions(
  tree: HttpApiDescriptorTree,
): Map<string, DirectoryConventionIndexEntry> {
  const index = new Map<string, DirectoryConventionIndexEntry>();
  const rootEntry = upsertIndexEntry(index, "");
  for (const convention of tree.conventions) {
    addConventionToIndex(rootEntry, convention);
  }

  const visit = (nodes: readonly HttpApiTreeNode[]): void => {
    for (const node of nodes) {
      if (node.type === "endpoint") continue;
      const entry = upsertIndexEntry(index, node.dirPath);
      for (const convention of node.conventions) {
        addConventionToIndex(entry, convention);
      }
      visit(node.children);
    }
  };

  visit(tree.children);

  for (const entry of index.values()) {
    entry.apiRootPaths.sort(compareHttpApiPathOrder);
    entry.groupOverridePaths.sort(compareHttpApiPathOrder);
    sortDirectoryCompanionPaths(entry.companionPaths);
  }

  return index;
}

function collectEndpointNodesWithGroupKey(
  nodes: readonly HttpApiTreeNode[],
  currentGroupKey: string,
): EndpointWithGroupKey[] {
  const out: EndpointWithGroupKey[] = [];
  for (const node of nodes) {
    if (node.type === "endpoint") {
      out.push({ node, groupKey: currentGroupKey });
      continue;
    }
    if (node.type === "group") {
      out.push(...collectEndpointNodesWithGroupKey(node.children, node.dirPath));
      continue;
    }
    out.push(...collectEndpointNodesWithGroupKey(node.children, currentGroupKey));
  }
  return out;
}

function collectGroupNodes(nodes: readonly HttpApiTreeNode[]): HttpApiGroupNode[] {
  const out: HttpApiGroupNode[] = [];
  for (const node of nodes) {
    if (node.type === "group") {
      out.push(node);
      out.push(...collectGroupNodes(node.children));
      continue;
    }
    if (node.type === "pathless_directory") {
      out.push(...collectGroupNodes(node.children));
    }
  }
  return out;
}

function mapEndpointCompanionPaths(node: HttpApiEndpointNode): EndpointCompanionPaths {
  const mapped: Partial<Record<HttpApiEndpointCompanionKind, string>> = {};
  for (const companion of node.companions) {
    if (!mapped[companion.kind]) {
      mapped[companion.kind] = companion.path;
    }
  }
  return {
    ".name": mapped[".name"],
    ".dependencies": mapped[".dependencies"],
    ".middlewares": mapped[".middlewares"],
    ".prefix": mapped[".prefix"],
    ".openapi": mapped[".openapi"],
  };
}

function createDirectoryCompanionPathsForDir(
  dirPath: string,
  index: Map<string, DirectoryConventionIndexEntry>,
): DirectoryCompanionPaths {
  const merged = createMutableDirectoryCompanionPaths();
  for (const ancestor of ancestorDirs(dirPath)) {
    const entry = index.get(ancestor);
    if (!entry) continue;
    for (const kind of DIRECTORY_CONVENTION_KINDS) {
      pushUniqueMany(merged[kind], entry.companionPaths[kind]);
    }
  }
  sortDirectoryCompanionPaths(merged);
  return freezeDirectoryCompanionPaths(merged);
}

function buildEndpointRenderSpecs(
  tree: HttpApiDescriptorTree,
  index: Map<string, DirectoryConventionIndexEntry>,
): EndpointRenderSpec[] {
  const endpointEntries = collectEndpointNodesWithGroupKey(tree.children, ROOT_GROUP_KEY);
  const specs: EndpointRenderSpec[] = [];

  for (const entry of endpointEntries) {
    const endpointDir = dirnamePosix(entry.node.path);
    specs.push({
      path: entry.node.path,
      stem: entry.node.stem,
      groupKey: entry.groupKey,
      modulePath: entry.node.path,
      companions: mapEndpointCompanionPaths(entry.node),
      directoryCompanions: createDirectoryCompanionPathsForDir(endpointDir, index),
    });
  }

  return specs.sort((a, b) => compareHttpApiPathOrder(a.path, b.path));
}

function compareGroupKeys(a: string, b: string): number {
  const left = a === ROOT_GROUP_KEY ? "" : a;
  const right = b === ROOT_GROUP_KEY ? "" : b;
  return compareHttpApiPathOrder(left, right);
}

function buildGroupRenderSpecs(
  tree: HttpApiDescriptorTree,
  index: Map<string, DirectoryConventionIndexEntry>,
  endpoints: readonly EndpointRenderSpec[],
): GroupRenderSpec[] {
  const byDir = new Map<string, HttpApiGroupNode>();
  for (const groupNode of collectGroupNodes(tree.children)) {
    byDir.set(groupNode.dirPath, groupNode);
  }

  const groupKeys = new Set<string>(byDir.keys());
  if (endpoints.some((endpoint) => endpoint.groupKey === ROOT_GROUP_KEY)) {
    groupKeys.add(ROOT_GROUP_KEY);
  }

  const specs: GroupRenderSpec[] = [];
  const sortedKeys = [...groupKeys].sort(compareGroupKeys);
  for (const groupKey of sortedKeys) {
    const dirPath = groupKey === ROOT_GROUP_KEY ? "" : groupKey;
    const node = byDir.get(groupKey);
    const defaultName = node?.groupName ?? "root";
    const entry = index.get(dirPath);
    specs.push({
      key: groupKey,
      dirPath,
      defaultName,
      overridePath: entry?.groupOverridePaths[0],
      directoryCompanions: createDirectoryCompanionPathsForDir(dirPath, index),
    });
  }

  return specs;
}

function buildApiRenderSpec(
  targetDirectory: string,
  index: Map<string, DirectoryConventionIndexEntry>,
): ApiRenderSpec {
  const rootEntry = index.get("");
  return {
    defaultIdentifier: basename(targetDirectory) || "api",
    apiRootPath: rootEntry?.apiRootPaths[0],
    directoryCompanions: freezeDirectoryCompanionPaths(
      rootEntry ? rootEntry.companionPaths : createMutableDirectoryCompanionPaths(),
    ),
  };
}

function collectDirectoryOptionPaths(
  endpointSpecs: readonly EndpointRenderSpec[],
): readonly string[] {
  const paths: string[] = [];
  for (const endpoint of endpointSpecs) {
    for (const option of OPTIONAL_ENDPOINT_EXPORTS) {
      const inherited = inheritedDirectoryOption(endpoint, option);
      if (inherited) pushUnique(paths, inherited.path);
    }
  }
  return paths.sort(compareHttpApiPathOrder);
}

function collectPrefixRoutePaths(
  apiSpec: ApiRenderSpec,
  endpointSpecs: readonly EndpointRenderSpec[],
  groupSpecs: readonly GroupRenderSpec[],
  expressionsByPath: ReadonlyMap<string, ReadonlyMap<string, HttpApiExportExpression>>,
): readonly string[] {
  const groupsByKey = new Map(groupSpecs.map((spec) => [spec.key, spec]));
  const paths: string[] = [];
  for (const endpoint of endpointSpecs) {
    pushUniqueMany(
      paths,
      endpointPrefixRoutePaths(apiSpec, endpoint, groupsByKey, expressionsByPath),
    );
  }
  return paths.sort(compareHttpApiPathOrder);
}

function collectGroupDependencyPaths(groupSpecs: readonly GroupRenderSpec[]): readonly string[] {
  const paths: string[] = [];
  for (const groupSpec of groupSpecs) {
    pushUniqueMany(paths, groupSpec.directoryCompanions["_dependencies.ts"]);
  }
  return paths.sort(compareHttpApiPathOrder);
}

function inheritedDirectoryOption(
  endpoint: EndpointRenderSpec,
  option: OptionalExport,
): { readonly path: string; readonly exportName: string } | undefined {
  const mapping =
    option === "headers"
      ? DIRECTORY_EXPORT_BY_OPTION.headers
      : option === "error"
        ? DIRECTORY_EXPORT_BY_OPTION.error
        : undefined;
  if (mapping === undefined) return undefined;

  const paths = endpoint.directoryCompanions[mapping.companion];
  const path = paths[paths.length - 1];
  return path ? { path, exportName: mapping.exportName } : undefined;
}

function renderGroupLayerExpression(
  groupLayerExpression: string,
  groupSpec: GroupRenderSpec,
  dependencyLayerExpressionByPath: ReadonlyMap<string, string>,
): string {
  return groupSpec.directoryCompanions["_dependencies.ts"].reduce((expression, path) => {
    const dependencyLayer = dependencyLayerExpressionByPath.get(path);
    return dependencyLayer
      ? `${expression}.pipe(Layer.provideMerge(${dependencyLayer}))`
      : expression;
  }, groupLayerExpression);
}

type RouteExpressionPart = {
  readonly path: string;
  readonly expression: string;
};

type RouteBindingDraft = {
  readonly key: string;
  readonly proposedName: string;
  readonly parentKey: string | undefined;
  readonly routeExpression: string;
};

type RouteBindingPlan = {
  readonly declarations: readonly RouteBindingDeclaration[];
  readonly endpointRouteNameByPath: ReadonlyMap<string, string>;
};

type RouteBindingDeclaration = {
  readonly name: string;
  readonly expression: string;
};

function createRouteBindingPlan(input: {
  readonly endpointSpecs: readonly EndpointRenderSpec[];
  readonly routePartsForEndpoint: (endpoint: EndpointRenderSpec) => readonly RouteExpressionPart[];
  readonly routeExpressionForEndpoint: (endpoint: EndpointRenderSpec) => string | undefined;
}): RouteBindingPlan {
  const drafts = new Map<string, RouteBindingDraft>();
  const order: string[] = [];
  const endpointKeys = new Map<string, string>();

  for (const endpoint of input.endpointSpecs) {
    let parentKey: string | undefined;
    for (const part of input.routePartsForEndpoint(endpoint)) {
      const key = parentKey ? `${parentKey}|${part.path}` : `prefix:${part.path}`;
      if (!drafts.has(key)) {
        drafts.set(key, {
          key,
          parentKey,
          proposedName: prefixRouteBindingName(part.path),
          routeExpression: part.expression,
        });
        order.push(key);
      }
      parentKey = key;
    }

    const endpointRouteExpression = input.routeExpressionForEndpoint(endpoint);
    if (!endpointRouteExpression && parentKey) {
      endpointKeys.set(endpoint.modulePath, parentKey);
      continue;
    }

    const endpointKey = `endpoint:${endpoint.modulePath}`;
    drafts.set(endpointKey, {
      key: endpointKey,
      parentKey,
      proposedName: `${pathToIdentifier(endpoint.modulePath)}Route`,
      routeExpression: endpointRouteExpression ?? "Route.Slash",
    });
    order.push(endpointKey);
    endpointKeys.set(endpoint.modulePath, endpointKey);
  }

  const names = makeUniqueVarNames(
    order.map((key) => {
      const draft = drafts.get(key)!;
      return { path: key, proposedName: draft.proposedName };
    }),
  );
  const declarations = order.map((key) => {
    const draft = drafts.get(key)!;
    const name = names.get(key)!;
    const parentName = draft.parentKey ? names.get(draft.parentKey) : undefined;
    return {
      name,
      expression: parentName
        ? `Route.Join(${parentName}, ${draft.routeExpression})`
        : draft.routeExpression,
    };
  });
  const endpointRouteNameByPath = new Map<string, string>();
  for (const [path, key] of endpointKeys) {
    endpointRouteNameByPath.set(path, names.get(key)!);
  }

  return { declarations, endpointRouteNameByPath };
}

function prefixRouteBindingName(path: string): string {
  const fileName = basename(path);
  if (fileName.startsWith("_api.")) return "ApiRoute";
  const dir = dirnamePosix(path);
  return `${pathToIdentifier(dir || path)}Route`;
}

function renderRouteBindingDeclarations(plan: RouteBindingPlan): string {
  return plan.declarations
    .map((declaration) => `const ${declaration.name} = ${declaration.expression};`)
    .join("\n");
}

function endpointPrefixRouteParts(
  endpoint: EndpointRenderSpec,
  apiSpec: ApiRenderSpec,
  groupSpecByKey: ReadonlyMap<string, GroupRenderSpec>,
  prefixExpressionByPath: ReadonlyMap<string, string>,
  expressionsByPath: ReadonlyMap<string, ReadonlyMap<string, HttpApiExportExpression>>,
): readonly RouteExpressionPart[] {
  return endpointPrefixRoutePaths(apiSpec, endpoint, groupSpecByKey, expressionsByPath).flatMap(
    (path) => {
      const expression = prefixExpressionByPath.get(path);
      return expression ? [{ path, expression }] : [];
    },
  );
}

function endpointPrefixRoutePaths(
  apiSpec: ApiRenderSpec,
  endpoint: EndpointRenderSpec,
  groupSpecByKey: ReadonlyMap<string, GroupRenderSpec>,
  expressionsByPath: ReadonlyMap<string, ReadonlyMap<string, HttpApiExportExpression>>,
): readonly string[] {
  const paths: string[] = [];
  if (apiSpec.apiRootPath) pushUnique(paths, apiSpec.apiRootPath);
  pushUniqueMany(paths, endpoint.directoryCompanions["_prefix.ts"]);
  const groupPrefix = groupSpecByKey.get(endpoint.groupKey)?.overridePath;
  if (groupPrefix && prefixRouteExportName(expressionsByPath, groupPrefix) === "prefix") {
    pushUnique(paths, groupPrefix);
  }
  return paths;
}

function prefixRouteExportName(
  expressionsByPath: ReadonlyMap<string, ReadonlyMap<string, HttpApiExportExpression>>,
  path: string,
): "default" | "prefix" | undefined {
  const expressions = expressionsByPath.get(path);
  if (expressions?.has("default")) return "default";
  if (expressions?.has("prefix")) return "prefix";
  return undefined;
}

function toVirtualTargetSpecifier(
  importerDir: string,
  targetDir: string,
  relativeFilePath: string,
): string {
  const absPath = relativeFilePath.length === 0 ? targetDir : join(targetDir, relativeFilePath);
  const rel = toPosixPath(relative(importerDir, absPath));
  return rel.startsWith(".") ? rel : `./${rel}`;
}

const METHOD_FACTORIES: Record<string, string> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  PATCH: "patch",
  DELETE: "delete",
  HEAD: "head",
  OPTIONS: "options",
};

const OPTIONAL_ENDPOINT_EXPORTS = ["headers", "body", "success", "error"] as const;
type OptionalExport = (typeof OPTIONAL_ENDPOINT_EXPORTS)[number];

/** body maps to payload in HttpApiEndpoint options */
const EXPORT_TO_OPTION: Record<OptionalExport, string> = {
  headers: "headers",
  body: "payload",
  success: "success",
  error: "error",
};

const DIRECTORY_EXPORT_BY_OPTION = {
  headers: { companion: "_headers.ts", exportName: "headers" },
  error: { companion: "_errors.ts", exportName: "error" },
} as const satisfies Partial<
  Record<
    OptionalExport,
    { readonly companion: DirectoryConventionKind; readonly exportName: string }
  >
>;

export function emitHttpApiSource(input: {
  readonly tree: HttpApiDescriptorTree;
  readonly targetDirectory: string;
  readonly importer: string;
  readonly extractedLiteralsByPath: ReadonlyMap<
    string,
    { readonly path: string; readonly method: string; readonly name: string }
  >;
  readonly optionalExportsByPath: ReadonlyMap<string, ReadonlySet<OptionalExport>>;
  /** When true for an endpoint path, handler returns HttpServerResponse. */
  readonly handlerIsRawByPath?: ReadonlyMap<string, boolean>;
  readonly prefixByScope?: PrefixByScope;
  readonly pathPrefix?: `/${string}`;
  readonly openapiPlan?: HttpApiOpenApiPlan;
  readonly mode?: HttpApiEmitMode;
  readonly groupNamesByPath?: ReadonlyMap<string, string>;
  readonly exportExpressionsByPath?: ReadonlyMap<
    string,
    ReadonlyMap<string, HttpApiExportExpression>
  >;
  readonly projectRoot: string;
  readonly context?: VirtualModuleBuildContext;
}): string {
  const directoryConventions = indexDirectoryConventions(input.tree);
  const endpointSpecs = buildEndpointRenderSpecs(input.tree, directoryConventions);
  const groupSpecs = buildGroupRenderSpecs(input.tree, directoryConventions, endpointSpecs);
  const apiSpec = buildApiRenderSpec(input.targetDirectory, directoryConventions);

  const endpointPaths = endpointSpecs.map((e) => e.modulePath);
  const exportExpressionsByPath = input.exportExpressionsByPath ?? new Map();
  const prefixRoutePaths = collectPrefixRoutePaths(
    apiSpec,
    endpointSpecs,
    groupSpecs,
    exportExpressionsByPath,
  );
  const directoryOptionPaths = [
    ...new Set([...collectDirectoryOptionPaths(endpointSpecs), ...prefixRoutePaths]),
  ].sort(compareHttpApiPathOrder);
  const groupDependencyPaths = collectGroupDependencyPaths(groupSpecs);
  const importerDir = dirname(toPosixPath(input.importer));
  const targetSpecifier = toVirtualTargetSpecifier(importerDir, input.targetDirectory, "");
  const serviceLayerExpressionByPath = concernExpressionMap(
    groupDependencyPaths,
    "ApiServices",
    "dependencyLayers",
  );

  if (input.mode === "client") {
    return emitHttpApiClientSource({
      apiSpec,
      endpointSpecs,
      groupSpecs,
      importerDir,
      targetDirectory: input.targetDirectory,
      extractedLiteralsByPath: input.extractedLiteralsByPath,
      optionalExportsByPath: input.optionalExportsByPath,
      directoryOptionNameByPath: new Map(),
      groupNamesByPath: input.groupNamesByPath ?? new Map(),
      exportExpressionsByPath,
      prefixByScope: input.prefixByScope,
      pathPrefix: input.pathPrefix,
      openapiPlan: input.openapiPlan,
      context: input.context,
    });
  }

  const plan = fullEmitPlan(input.context);

  if (shouldEmitDependenciesLayerOnly(plan)) {
    const imports = [`import * as Layer from "effect/Layer";`];
    if (groupDependencyPaths.length > 0) {
      imports.push(`import * as ApiServices from "typed:services?dir=${targetSpecifier}";`);
    }
    return `${imports.join("\n")}

export const DependenciesLayer = ${renderDependenciesLayer(
      groupDependencyPaths,
      serviceLayerExpressionByPath,
    )};`;
  }

  const proposedNames = endpointPaths.map((path) => ({
    path,
    proposedName: pathToIdentifier(path),
  }));
  const varNameByPath = makeUniqueVarNames(proposedNames);
  const headerExpressionByPath = concernExpressionMap(
    directoryOptionPaths,
    "ApiHeaders",
    "headers",
  );
  const errorExpressionByPath = concernExpressionMap(directoryOptionPaths, "ApiErrors", "errors");
  const prefixExpressionByPath = concernExpressionMap(
    directoryOptionPaths,
    "ApiPrefixes",
    "prefixes",
  );
  const middlewaresPath = apiSpec.directoryCompanions["_middlewares.ts"][0];
  const hasMiddlewares = Boolean(middlewaresPath);

  const importLines: string[] = [
    ...(plan.app || plan.serve
      ? [`import { composeWithLayers, type LayerOrGroup } from "@typed/app/runtime";`]
      : []),
    ...(plan.serve ? [`import { resolveConfig } from "@typed/app/internal/resolveConfig";`] : []),
    ...(plan.serve ? [`import { TypedHttpServer } from "@typed/app/TypedHttpServer";`] : []),
    ...(plan.serve ? [`import * as Effect from "effect/Effect";`] : []),
    ...(plan.dependenciesLayer || plan.apiLayer || plan.serve ? [`import * as Layer from "effect/Layer";`] : []),
    ...(plan.api ? [`import * as HttpApi from "effect/unstable/httpapi/HttpApi";`] : []),
    ...(plan.apiLayer
      ? [`import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";`]
      : []),
    ...(plan.client
      ? [`import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";`]
      : []),
    ...(plan.api
      ? [
          `import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";`,
          `import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";`,
        ]
      : []),
    ...(plan.scalar
      ? [`import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";`]
      : []),
    ...(plan.swagger
      ? [`import * as HttpApiSwagger from "effect/unstable/httpapi/HttpApiSwagger";`]
      : []),
    ...(plan.app || plan.serve
      ? [`import * as HttpRouter from "effect/unstable/http/HttpRouter";`]
      : []),
    ...(plan.openApi
      ? [`import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";`]
      : []),
    ...(plan.dependenciesLayer && groupDependencyPaths.length > 0
      ? [`import * as ApiServices from "typed:services?dir=${targetSpecifier}";`]
      : []),
    ...(plan.api
      ? [
          `import * as ApiHeaders from "typed:headers?dir=${targetSpecifier}";`,
          `import * as ApiErrors from "typed:errors?dir=${targetSpecifier}";`,
          `import * as ApiPrefixes from "typed:prefix?dir=${targetSpecifier}";`,
        ]
      : []),
    ...(hasMiddlewares && (plan.app || plan.serve)
      ? [`import * as ApiMiddlewares from "typed:middlewares?dir=${targetSpecifier}";`]
      : []),
    ...(plan.api && input.openapiPlan
      ? [`import * as ApiOpenApi from "typed:openapi?dir=${targetSpecifier}";`]
      : []),
    ...(plan.serve ? [`import * as TypedConfigModule from "typed:config";`] : []),
  ];
  if (prefixRoutePaths.length > 0 && plan.api) {
    importLines.push(`import * as Route from "@typed/router";`);
  }

  for (const path of plan.api ? endpointPaths : []) {
    const importSpecifier = `typed:api-handler?path=${toVirtualTargetSpecifier(importerDir, input.targetDirectory, path)}`;
    importLines.push(
      `import * as ${varNameByPath.get(path)} from ${JSON.stringify(importSpecifier)};`,
    );
  }

  const apiId = apiSpec.defaultIdentifier;

  const groupExprs: string[] = [];
  const groupSpecByKey = new Map(groupSpecs.map((spec) => [spec.key, spec]));
  const routeBindings = createRouteBindingPlan({
    endpointSpecs,
    routeExpressionForEndpoint: (endpoint) => `${varNameByPath.get(endpoint.modulePath)!}.route`,
    routePartsForEndpoint: (endpoint) =>
      endpointPrefixRouteParts(
        endpoint,
        apiSpec,
        groupSpecByKey,
        prefixExpressionByPath,
        exportExpressionsByPath,
      ),
  });
  for (const groupSpec of groupSpecs) {
    const endpointsInGroup = endpointSpecs.filter((e) => e.groupKey === groupSpec.key);
    if (endpointsInGroup.length === 0) continue;

    const endpointExprs: string[] = [];
    for (const ep of endpointsInGroup) {
      const varName = varNameByPath.get(ep.modulePath)!;
      const literals = input.extractedLiteralsByPath.get(ep.path);
      const method = (literals?.method ?? "GET").toUpperCase();
      const name = literals?.name ?? ep.stem;
      const factory = METHOD_FACTORIES[method] ?? "get";
      const m = varName;
      const effectiveRoute = routeBindings.endpointRouteNameByPath.get(ep.modulePath)!;
      const optionalPresent = input.optionalExportsByPath.get(ep.path) ?? new Set<OptionalExport>();
      const optsParts: string[] = [
        `params: ${effectiveRoute}.pathSchema`,
        `query: ${effectiveRoute}.querySchema`,
      ];
      for (const exp of OPTIONAL_ENDPOINT_EXPORTS) {
        if (optionalPresent.has(exp)) {
          const optName = EXPORT_TO_OPTION[exp];
          optsParts.push(`${optName}: ${m}.${exp}`);
          continue;
        }

        const inherited = inheritedDirectoryOption(ep, exp);
        if (inherited) {
          const optName = EXPORT_TO_OPTION[exp];
          const expression =
            exp === "headers"
              ? headerExpressionByPath.get(inherited.path)
              : errorExpressionByPath.get(inherited.path);
          if (expression) optsParts.push(`${optName}: ${expression}`);
        }
      }
      const opts = optsParts.join(", ");
      const endpointAnnotations = input.openapiPlan?.endpointAnnotationsByPath.get(ep.path);
      endpointExprs.push(
        renderAnnotatedEndpointExpression(
          `HttpApiEndpoint.${factory}(${JSON.stringify(name)}, ${m}.route.path, { ${opts} })`,
          endpointAnnotations,
        ),
      );
    }

    const groupName = input.groupNamesByPath?.get(groupSpec.dirPath) ?? groupSpec.defaultName;
    const groupChain = endpointExprs.map((expr) => `.add(${expr})`).join("");
    const effectivePrefix = resolveEffectivePrefixForGroup(
      groupSpec.dirPath,
      input.prefixByScope,
      input.pathPrefix,
    );
    const suffix = effectivePrefix ? `.prefix(${JSON.stringify(effectivePrefix)})` : "";
    const groupAnnotations = input.openapiPlan?.groupAnnotationsByPath.get(groupSpec.dirPath);
    groupExprs.push(
      renderAnnotatedGroupExpression(
        `HttpApiGroup.make(${JSON.stringify(groupName)})${groupChain}${suffix}`,
        groupAnnotations,
      ),
    );
  }

  const apiChain = groupExprs.map((g) => `.add(${g})`).join("");
  const apiExpr = renderAnnotatedApiExpression(
    `HttpApi.make(${JSON.stringify(apiId)})${apiChain}`,
    input.openapiPlan?.api.annotations,
    input.openapiPlan?.api.generation,
  );

  const groupLayerBlocks: string[] = [];
  for (const groupSpec of groupSpecs) {
    const endpointsInGroup = endpointSpecs.filter((e) => e.groupKey === groupSpec.key);
    if (endpointsInGroup.length === 0) continue;
    const groupName = input.groupNamesByPath?.get(groupSpec.dirPath) ?? groupSpec.defaultName;
    const groupHandlers = endpointsInGroup.reduce((handlersExpression, e) => {
      const varName = varNameByPath.get(e.modulePath)!;
      const literals = input.extractedLiteralsByPath.get(e.path);
      const name = literals?.name ?? e.stem;
      const handler = emitEndpointHandler(varName);
      return `${handlersExpression}.handle(${JSON.stringify(name)}, ${handler})`;
    }, "handlers");
    groupLayerBlocks.push(
      renderGroupLayerExpression(
        `HttpApiBuilder.group(Api, ${JSON.stringify(groupName)}, (handlers) => ${groupHandlers})`,
        groupSpec,
        serviceLayerExpressionByPath,
      ),
    );
  }

  const jsonPath = input.openapiPlan?.api.exposure.jsonPath;
  const swaggerPath = input.openapiPlan?.api.exposure.swaggerPath;
  const scalarConfig = input.openapiPlan?.api.exposure.scalar;
  const apiLayerOptions =
    jsonPath && typeof jsonPath === "string" ? `{ openapiPath: ${JSON.stringify(jsonPath)} }` : "";
  const swaggerExpr =
    swaggerPath && typeof swaggerPath === "string"
      ? `HttpApiSwagger.layer(Api, { path: ${JSON.stringify(swaggerPath)} })`
      : "HttpApiSwagger.layer(Api)";
  const scalarExpr = renderScalarLayer("Api", scalarConfig);
  const baseApiLayer = apiLayerOptions
    ? `HttpApiBuilder.layer(Api, ${apiLayerOptions})`
    : `HttpApiBuilder.layer(Api)`;
  const mergedApiLayer =
    groupLayerBlocks.length === 0
      ? baseApiLayer
      : groupLayerBlocks.reduce(
          (acc, groupBlock) => `${acc}.pipe(Layer.provideMerge(${groupBlock}))`,
          baseApiLayer,
        );
  const dependenciesLayer = renderDependenciesLayer(
    groupDependencyPaths,
    serviceLayerExpressionByPath,
  );

  const serveOptions = hasMiddlewares
    ? `{ disableListenLog, middleware: ApiMiddlewares.middlewares[${JSON.stringify(middlewaresPath)}] }`
    : `{ disableListenLog }`;

  const openApiHelpers = renderOpenApiHelpers(input.openapiPlan?.api.generation);
  const openApiHelperBlock = openApiHelpers ? `\n${openApiHelpers}` : "";
  if (!plan.openApi && apiExpr.includes("OpenApiModule.")) {
    importLines.push(`import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";`);
  }

  const blocks = [
    plan.api ? renderRouteBindingDeclarations(routeBindings) : "",
    plan.api ? `export const Api = ${apiExpr};` : "",
    plan.dependenciesLayer ? `export const DependenciesLayer = ${dependenciesLayer};` : "",
    plan.apiLayer ? `export const ApiLayer = ${mergedApiLayer};` : "",
    plan.openApi ? "export const OpenApi = OpenApiModule.fromApi(Api);" : "",
    plan.swagger ? `export const Swagger = ${swaggerExpr};` : "",
    plan.scalar ? `export const Scalar = ${scalarExpr};` : "",
    plan.client ? "export const Client = HttpApiClient.make(Api);" : "",
    plan.serve ? typedConfigBuildOptionsSource() : "",
    plan.serve
      ? 'const typedConfig = TypedConfigModule as TypedConfigBuildOptions;\nconst typedBuildConfig = typedConfig.build ?? {};\nconst clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");'
      : "",
    plan.serve ? joinBuildPathSource() : "",
    plan.app || plan.serve ? httpApiRuntimeConfigSource() : "",
    plan.serve ? isDevImportMetaSource() : "",
    plan.app ? appSource(serveOptions) : "",
    plan.serve ? serveSource(input.projectRoot) : "",
  ].filter(Boolean);

  return `${importLines.join("\n")}${plan.api ? openApiHelperBlock : ""}

${blocks.join("\n\n")}
`;
}

function renderDependenciesLayer(
  dependencyPaths: readonly string[],
  dependencyLayerExpressionByPath: ReadonlyMap<string, string>,
): string {
  if (dependencyPaths.length === 0) return "Layer.empty";

  const layers = dependencyPaths
    .map((path) => dependencyLayerExpressionByPath.get(path))
    .filter((value): value is string => value !== undefined);

  return layers.length === 0 ? "Layer.empty" : `Layer.mergeAll(Layer.empty, ${layers.join(", ")})`;
}

interface FullEmitPlan {
  readonly api: boolean;
  readonly dependenciesLayer: boolean;
  readonly apiLayer: boolean;
  readonly openApi: boolean;
  readonly swagger: boolean;
  readonly scalar: boolean;
  readonly client: boolean;
  readonly app: boolean;
  readonly serve: boolean;
}

function fullEmitPlan(context: VirtualModuleBuildContext | undefined): FullEmitPlan {
  const emitAll = mustEmitAllExports(context);
  const serve = emitAll || requestsExportDeclaration(context, "serve");
  const app = emitAll || requestsExportDeclaration(context, "App") || serve;
  const apiLayer = emitAll || requestsExportDeclaration(context, "ApiLayer") || app;
  const openApi = emitAll || requestsExportDeclaration(context, "OpenApi");
  const swagger = emitAll || requestsExportDeclaration(context, "Swagger");
  const scalar = emitAll || requestsExportDeclaration(context, "Scalar");
  const client = emitAll || requestsExportDeclaration(context, "Client");
  return {
    api:
      emitAll ||
      requestsExportDeclaration(context, "Api") ||
      apiLayer ||
      app ||
      serve ||
      openApi ||
      swagger ||
      scalar ||
      client,
    dependenciesLayer:
      emitAll || requestsExportDeclaration(context, "DependenciesLayer") || apiLayer || app || serve,
    apiLayer,
    openApi,
    swagger,
    scalar,
    client,
    app,
    serve,
  };
}

function shouldEmitDependenciesLayerOnly(plan: FullEmitPlan): boolean {
  return (
    plan.dependenciesLayer &&
    !plan.api &&
    !plan.apiLayer &&
    !plan.openApi &&
    !plan.swagger &&
    !plan.scalar &&
    !plan.client &&
    !plan.app &&
    !plan.serve
  );
}

function typedConfigBuildOptionsSource(): string {
  return [
    "type TypedConfigBuildOptions = {",
    "  readonly build?: {",
    "    readonly outDir?: string;",
    "    readonly clientOutDir?: string;",
    "  };",
    "};",
  ].join("\n");
}

function joinBuildPathSource(): string {
  return [
    "function joinBuildPath(...parts: readonly string[]): string {",
    '  return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");',
    "}",
  ].join("\n");
}

function httpApiRuntimeConfigSource(): string {
  return [
    "type HttpApiRuntimeConfig = {",
    "  readonly disableListenLog?: boolean;",
    "  readonly host?: string;",
    "  readonly port?: number;",
    "};",
  ].join("\n");
}

function isDevImportMetaSource(): string {
  return [
    "function isDevImportMeta(meta: ImportMeta & { readonly env?: { readonly DEV?: boolean } }): boolean {",
    "  return meta.env?.DEV === true;",
    "}",
  ].join("\n");
}

function appSource(serveOptions: string): string {
  return [
    "export const App = <const Layers extends readonly LayerOrGroup[]>(",
    "  config: HttpApiRuntimeConfig = {},",
    "  ...layersToMergeIntoRouter: Layers",
    ") => {",
    "  const disableListenLog = config?.disableListenLog ?? false;",
    "  const appLayer = composeWithLayers(ApiLayer, layersToMergeIntoRouter);",
    `  return HttpRouter.serve(appLayer, ${serveOptions})`,
    "};",
  ].join("\n");
}

function serveSource(projectRoot: string): string {
  return [
    "export const serve = <const Layers extends readonly LayerOrGroup[]>(",
    "  config: HttpApiRuntimeConfig = {},",
    "  ...layersToMergeIntoRouter: Layers",
    ") =>",
    "  Layer.unwrap(",
    "    Effect.gen(function* () {",
    '      const host = yield* resolveConfig(config?.host, "0.0.0.0");',
    "      const port = yield* resolveConfig(config?.port, 3000);",
    "      const disableListenLog = yield* resolveConfig(config?.disableListenLog, false);",
    "      const dev = isDevImportMeta(import.meta);",
    "      const appConfig = { disableListenLog };",
    "      const staticAssetsLayer = TypedHttpServer.staticAssets({",
    `        projectRoot: ${JSON.stringify(projectRoot)},`,
    "        clientOutDir,",
    "        dev,",
    "      });",
    "      const appLayers = [staticAssetsLayer, ...layersToMergeIntoRouter] as const;",
    "      const appLayer = App(appConfig, ...appLayers);",
    "      const serverLayer = TypedHttpServer.layer({",
    "        host,",
    "        port,",
    `        projectRoot: ${JSON.stringify(projectRoot)},`,
    "        dev,",
    "      });",
    "      return appLayer.pipe(Layer.provide(serverLayer));",
    "    }),",
    "  );",
  ].join("\n");
}

function concernExpressionMap(
  paths: readonly string[],
  moduleName: string,
  exportName: string,
): ReadonlyMap<string, string> {
  return new Map(
    paths.map((path) => [path, `${moduleName}.${exportName}[${JSON.stringify(path)}]`]),
  );
}

function emitHttpApiClientSource(input: {
  readonly apiSpec: ApiRenderSpec;
  readonly endpointSpecs: readonly EndpointRenderSpec[];
  readonly groupSpecs: readonly GroupRenderSpec[];
  readonly importerDir: string;
  readonly targetDirectory: string;
  readonly extractedLiteralsByPath: ReadonlyMap<
    string,
    { readonly path: string; readonly method: string; readonly name: string }
  >;
  readonly optionalExportsByPath: ReadonlyMap<string, ReadonlySet<OptionalExport>>;
  readonly directoryOptionNameByPath: ReadonlyMap<string, string>;
  readonly groupNamesByPath: ReadonlyMap<string, string>;
  readonly exportExpressionsByPath: ReadonlyMap<
    string,
    ReadonlyMap<string, HttpApiExportExpression>
  >;
  readonly prefixByScope?: PrefixByScope;
  readonly pathPrefix?: `/${string}`;
  readonly openapiPlan?: HttpApiOpenApiPlan;
  readonly context?: VirtualModuleBuildContext;
}): string {
  void input.directoryOptionNameByPath;
  const imports = new ClientImportBuilder(input.importerDir, input.targetDirectory);
  const plan = clientEmitPlan(input.context);
  const needsApi = clientPlanNeedsApi(plan);
  const needsHttpApiClient = clientPlanNeedsHttpApiClient(plan);
  const importLines: string[] = [
    ...(needsApi ? [`import * as Route from "@typed/router";`] : []),
    ...(plan.makeClientWith
      ? [`import type * as HttpClient from "effect/unstable/http/HttpClient";`]
      : []),
    ...(plan.dependenciesLayer ? [`import * as Layer from "effect/Layer";`] : []),
    ...(needsApi ? [`import * as HttpApi from "effect/unstable/httpapi/HttpApi";`] : []),
    ...(needsHttpApiClient
      ? [`import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";`]
      : []),
    ...(needsApi
      ? [
          `import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";`,
          `import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";`,
        ]
      : []),
    ...(plan.openApi ? [`import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";`] : []),
  ];
  if (!needsApi) {
    const exportLines = clientExportLines(plan);
    return `${importLines.join("\n")}

${exportLines.length > 0 ? exportLines : "export {};"}`;
  }

  const groupExprs: string[] = [];
  const groupSpecByKey = new Map(input.groupSpecs.map((spec) => [spec.key, spec]));
  const routeBindings = createRouteBindingPlan({
    endpointSpecs: input.endpointSpecs,
    routeExpressionForEndpoint: (endpoint) => {
      const literals = input.extractedLiteralsByPath.get(endpoint.path);
      const routePath = literals?.path ?? `/${endpoint.stem}`;
      if (routePath === "/") return undefined;
      return (
        imports.expressionFor(endpoint.path, "route", input.exportExpressionsByPath) ??
        `Route.Parse(${JSON.stringify(routePath)})`
      );
    },
    routePartsForEndpoint: (endpoint) =>
      clientEndpointPrefixRouteParts(
        endpoint,
        input.apiSpec,
        groupSpecByKey,
        imports,
        input.exportExpressionsByPath,
      ),
  });
  for (const groupSpec of input.groupSpecs) {
    const endpointsInGroup = input.endpointSpecs.filter((e) => e.groupKey === groupSpec.key);
    if (endpointsInGroup.length === 0) continue;
    const groupName = input.groupNamesByPath.get(groupSpec.dirPath) ?? groupSpec.defaultName;

    const endpointExprs = endpointsInGroup.map((endpoint) => {
      const literals = input.extractedLiteralsByPath.get(endpoint.path);
      const method = (literals?.method ?? "GET").toUpperCase();
      const name = literals?.name ?? endpoint.stem;
      const factory = METHOD_FACTORIES[method] ?? "get";
      const effectiveRouteExpr = routeBindings.endpointRouteNameByPath.get(endpoint.modulePath)!;
      const hasRoutePrefix =
        clientEndpointPrefixRouteParts(
          endpoint,
          input.apiSpec,
          groupSpecByKey,
          imports,
          input.exportExpressionsByPath,
        ).length > 0;
      const optsParts =
        hasRoutePrefix || shouldEmitClientRouteSchemas(literals?.path)
          ? [`params: ${effectiveRouteExpr}.pathSchema`, `query: ${effectiveRouteExpr}.querySchema`]
          : [];
      const optionalPresent =
        input.optionalExportsByPath.get(endpoint.path) ?? new Set<OptionalExport>();
      for (const option of OPTIONAL_ENDPOINT_EXPORTS) {
        const optionName = EXPORT_TO_OPTION[option];
        if (optionalPresent.has(option)) {
          const expression = imports.expressionFor(
            endpoint.path,
            option,
            input.exportExpressionsByPath,
          );
          if (expression) optsParts.push(`${optionName}: ${expression}`);
          continue;
        }

        const inherited = inheritedDirectoryOption(endpoint, option);
        if (inherited) {
          const expression = imports.expressionFor(
            inherited.path,
            inherited.exportName,
            input.exportExpressionsByPath,
          );
          if (expression) optsParts.push(`${optionName}: ${expression}`);
        }
      }

      return renderAnnotatedEndpointExpression(
        `HttpApiEndpoint.${factory}(${JSON.stringify(name)}, ${effectiveRouteExpr}.path, { ${optsParts.join(", ")} })`,
        input.openapiPlan?.endpointAnnotationsByPath.get(endpoint.path),
      );
    });

    const suffix = "";
    const groupChain = endpointExprs.map((expr) => `.add(${expr})`).join("");
    groupExprs.push(
      renderAnnotatedGroupExpression(
        `HttpApiGroup.make(${JSON.stringify(groupName)})${groupChain}${suffix}`,
        input.openapiPlan?.groupAnnotationsByPath.get(groupSpec.dirPath),
      ),
    );
  }

  const apiChain = groupExprs.map((g) => `.add(${g})`).join("");
  const apiExpr = renderAnnotatedApiExpression(
    `HttpApi.make(${JSON.stringify(input.apiSpec.defaultIdentifier)})${apiChain}`,
    input.openapiPlan?.api.annotations,
    input.openapiPlan?.api.generation,
  );
  const openApiHelpers = renderOpenApiHelpers(input.openapiPlan?.api.generation);
  const openApiHelperBlock = openApiHelpers ? `\n${openApiHelpers}` : "";
  if (!plan.openApi && apiExpr.includes("OpenApiModule.")) {
    importLines.push(`import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";`);
  }

  return `${[...importLines, ...imports.lines()].join("\n")}${openApiHelperBlock}

${renderRouteBindingDeclarations(routeBindings)}

export const Api = ${apiExpr};
${clientExportLines(plan)}`;
}

interface ClientEmitPlan {
  readonly api: boolean;
  readonly dependenciesLayer: boolean;
  readonly openApi: boolean;
  readonly client: boolean;
  readonly makeClient: boolean;
  readonly makeClientWith: boolean;
  readonly makeUrlBuilder: boolean;
}

function clientEmitPlan(context: VirtualModuleBuildContext | undefined): ClientEmitPlan {
  const emitAll = mustEmitAllExports(context);
  return {
    api: emitAll || requestsExportDeclaration(context, "Api"),
    dependenciesLayer: emitAll || requestsExportDeclaration(context, "DependenciesLayer"),
    openApi: emitAll || requestsExportDeclaration(context, "OpenApi"),
    client: emitAll || requestsExportDeclaration(context, "Client"),
    makeClient: emitAll || requestsExportDeclaration(context, "makeClient"),
    makeClientWith: emitAll || requestsExportDeclaration(context, "makeClientWith"),
    makeUrlBuilder: emitAll || requestsExportDeclaration(context, "makeUrlBuilder"),
  };
}

function requestsExportDeclaration(
  context: VirtualModuleBuildContext | undefined,
  exportName: string,
): boolean {
  if (!context || context.requestedExports.kind === "all") return true;
  return (
    context.requestedExports.names.has(exportName) ||
    context.requestedExports.typeOnlyNames.has(exportName)
  );
}

function clientPlanNeedsApi(plan: ClientEmitPlan): boolean {
  return (
    plan.api ||
    plan.openApi ||
    plan.client ||
    plan.makeClient ||
    plan.makeClientWith ||
    plan.makeUrlBuilder
  );
}

function clientPlanNeedsHttpApiClient(plan: ClientEmitPlan): boolean {
  return plan.client || plan.makeClient || plan.makeClientWith || plan.makeUrlBuilder;
}

function clientExportLines(plan: ClientEmitPlan): string {
  return [
    plan.dependenciesLayer ? "export const DependenciesLayer = Layer.empty;" : "",
    plan.openApi ? "export const OpenApi = OpenApiModule.fromApi(Api);" : "",
    plan.client ? "export const Client = HttpApiClient.make(Api);" : "",
    plan.makeClient ? makeClientSource() : "",
    plan.makeClientWith ? makeClientWithSource() : "",
    plan.makeUrlBuilder ? makeUrlBuilderSource() : "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

function makeClientSource(): string {
  return [
    "export const makeClient = (options?: { readonly baseUrl?: URL | string }) =>",
    "  HttpApiClient.make(Api, options);",
  ].join("\n");
}

function makeClientWithSource(): string {
  return [
    "export const makeClientWith = <E, R>(",
    "  httpClient: HttpClient.HttpClient.With<E, R>,",
    "  options?: { readonly baseUrl?: URL | string },",
    ") => HttpApiClient.makeWith(Api, { ...options, httpClient });",
  ].join("\n");
}

function makeUrlBuilderSource(): string {
  return [
    "export const makeUrlBuilder = (options?: { readonly baseUrl?: URL | string }) =>",
    "  HttpApiClient.urlBuilder(Api, options);",
  ].join("\n");
}

function shouldEmitClientRouteSchemas(path: string | undefined): boolean {
  if (path === undefined) return true;
  return path.includes(":") || path.includes("*");
}

class ClientImportBuilder {
  readonly #importerDir: string;
  readonly #targetDirectory: string;
  readonly #imports: string[] = [];
  readonly #seenImports = new Set<string>();

  constructor(importerDir: string, targetDirectory: string) {
    this.#importerDir = importerDir;
    this.#targetDirectory = targetDirectory;
  }

  expressionFor(
    sourcePath: string,
    exportName: string,
    expressionsByPath: ReadonlyMap<string, ReadonlyMap<string, HttpApiExportExpression>>,
  ): string | undefined {
    const expression = expressionsByPath.get(sourcePath)?.get(exportName);
    if (!expression) return undefined;
    const replacements = new Map<string, string>();
    const baseAlias = `${pathToIdentifier(sourcePath)}${capitalize(exportName)}`;

    for (const spec of expression.imports) {
      const importSpecifier = this.#toImportSpecifier(sourcePath, spec.moduleSpecifier);
      if (spec.kind === "named") {
        const alias =
          expression.expression.trim() === spec.localName
            ? baseAlias
            : `${baseAlias}${capitalize(spec.localName)}`;
        this.#pushImport(
          `import { ${spec.importedName} as ${alias} } from ${JSON.stringify(importSpecifier)};`,
        );
        replacements.set(spec.localName, alias);
        continue;
      }
      const alias = `${baseAlias}${capitalize(spec.localName)}`;
      if (spec.kind === "namespace") {
        this.#pushImport(`import * as ${alias} from ${JSON.stringify(importSpecifier)};`);
      } else {
        this.#pushImport(`import ${alias} from ${JSON.stringify(importSpecifier)};`);
      }
      replacements.set(spec.localName, alias);
    }

    return replaceIdentifiers(expression.expression, replacements);
  }

  lines(): readonly string[] {
    return this.#imports;
  }

  #toImportSpecifier(sourcePath: string, moduleSpecifier: string): string {
    if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/")) {
      return moduleSpecifier;
    }
    const absPath = join(this.#targetDirectory, dirname(sourcePath), moduleSpecifier);
    const rel = toPosixPath(relative(this.#importerDir, absPath));
    const specifier = rel.startsWith(".") ? rel : `./${rel}`;
    return stripScriptExtension(specifier) + ".js";
  }

  #pushImport(line: string): void {
    if (this.#seenImports.has(line)) return;
    this.#seenImports.add(line);
    this.#imports.push(line);
  }
}

function clientEndpointPrefixRouteParts(
  endpoint: EndpointRenderSpec,
  apiSpec: ApiRenderSpec,
  groupSpecByKey: ReadonlyMap<string, GroupRenderSpec>,
  imports: ClientImportBuilder,
  expressionsByPath: ReadonlyMap<string, ReadonlyMap<string, HttpApiExportExpression>>,
): readonly RouteExpressionPart[] {
  return endpointPrefixRoutePaths(apiSpec, endpoint, groupSpecByKey, expressionsByPath).flatMap(
    (path) => {
      const exportName = prefixRouteExportName(expressionsByPath, path);
      const expression = exportName
        ? imports.expressionFor(path, exportName, expressionsByPath)
        : undefined;
      return expression ? [{ path, expression }] : [];
    },
  );
}

function replaceIdentifiers(expression: string, replacements: ReadonlyMap<string, string>): string {
  let output = expression;
  for (const [from, to] of replacements) {
    output = output.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "g"), to);
  }
  return output;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function capitalize(value: string): string {
  return value.length === 0 ? value : `${value[0]!.toUpperCase()}${value.slice(1)}`;
}

function emitEndpointHandler(moduleName: string): string {
  return `${moduleName}.handler`;
}

function renderAnnotatedApiExpression(
  apiExpression: string,
  annotations: OpenApiAnnotationsConfig | undefined,
  generation: OpenApiGenerationConfig | undefined,
): string {
  const merged = {
    ...annotations,
    ...renderGenerationAnnotations(generation),
  };
  if (Object.keys(merged).length === 0) return apiExpression;
  return `${apiExpression}.annotateMerge(OpenApiModule.annotations(${renderObjectLiteral(merged)}))`;
}

function renderAnnotatedGroupExpression(
  groupExpression: string,
  annotations: OpenApiAnnotationsConfig | undefined,
): string {
  if (!annotations || Object.keys(annotations).length === 0) return groupExpression;
  return `${groupExpression}.annotateMerge(OpenApiModule.annotations(${renderObjectLiteral(annotations)}))`;
}

function renderAnnotatedEndpointExpression(
  endpointExpression: string,
  annotations: OpenApiAnnotationsConfig | undefined,
): string {
  if (!annotations || Object.keys(annotations).length === 0) return endpointExpression;
  return `${endpointExpression}.annotateMerge(OpenApiModule.annotations(${renderObjectLiteral(annotations)}))`;
}

function renderGenerationAnnotations(
  generation: OpenApiGenerationConfig | undefined,
): Record<string, unknown> {
  if (generation?.additionalProperties === undefined) return {};
  return { transform: "applyOpenApiAdditionalProperties" };
}

function renderOpenApiHelpers(generation: OpenApiGenerationConfig | undefined): string {
  if (generation?.additionalProperties === undefined) return "";
  return `const openApiAdditionalPropertiesConfig = { additionalProperties: ${String(generation.additionalProperties)} };

type OpenApiValue =
  | null
  | boolean
  | number
  | string
  | readonly (OpenApiValue | undefined)[]
  | { readonly [key: string]: OpenApiValue | undefined };

const applyOpenApiAdditionalProperties = (
  spec: Record<string, OpenApiValue | undefined>,
): Record<string, OpenApiValue | undefined> => {
  const visit = (value: OpenApiValue | undefined): OpenApiValue | undefined => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(visit);
    const next: Record<string, OpenApiValue | undefined> = {};
    for (const [key, entry] of Object.entries(value)) next[key] = visit(entry);
    if (next.type === "object" && next.additionalProperties === undefined) {
      next.additionalProperties = openApiAdditionalPropertiesConfig.additionalProperties;
    }
    return next;
  };
  const next: Record<string, OpenApiValue | undefined> = {};
  for (const [key, entry] of Object.entries(spec)) next[key] = visit(entry);
  return next;
};
`;
}

function renderScalarLayer(apiName: string, scalar: OpenApiExposureConfig["scalar"]): string {
  if (!scalar || typeof scalar !== "object" || !scalar.path)
    return `HttpApiScalar.layer(${apiName})`;
  const options = renderObjectLiteral({
    path: scalar.path,
    ...(scalar.config ? { scalar: scalar.config } : {}),
    ...(scalar.version ? { version: scalar.version } : {}),
  });
  return scalar.source === "cdn"
    ? `HttpApiScalar.layerCdn(${apiName}, ${options})`
    : `HttpApiScalar.layer(${apiName}, ${options})`;
}

function renderObjectLiteral(value: Readonly<Record<string, unknown>>): string {
  const entries = Object.entries(value).map(([key, entry]) => `${key}: ${renderValue(entry)}`);
  return `{ ${entries.join(", ")} }`;
}

function renderValue(value: unknown): string {
  if (value === "applyOpenApiAdditionalProperties") return value;
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    return renderObjectLiteral(value as Readonly<Record<string, unknown>>);
  }
  return "undefined";
}
