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

const ROOT_GROUP_KEY = "__root__";

const DIRECTORY_CONVENTION_KINDS = [
  "_dependencies.ts",
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

function toImportSpecifier(
  importerDir: string,
  targetDir: string,
  relativeFilePath: string,
): string {
  const absPath = join(targetDir, relativeFilePath);
  const rel = toPosixPath(relative(importerDir, absPath));
  const specifier = rel.startsWith(".") ? rel : `./${rel}`;
  return stripScriptExtension(specifier) + ".js";
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

export function emitHttpApiSource(input: {
  readonly tree: HttpApiDescriptorTree;
  readonly targetDirectory: string;
  readonly importer: string;
  readonly extractedLiteralsByPath: ReadonlyMap<
    string,
    { readonly path: string; readonly method: string; readonly name: string }
  >;
  readonly optionalExportsByPath: ReadonlyMap<string, ReadonlySet<OptionalExport>>;
}): string {
  const directoryConventions = indexDirectoryConventions(input.tree);
  const endpointSpecs = buildEndpointRenderSpecs(input.tree, directoryConventions);
  const groupSpecs = buildGroupRenderSpecs(input.tree, directoryConventions, endpointSpecs);
  const apiSpec = buildApiRenderSpec(input.targetDirectory, directoryConventions);

  const endpointPaths = endpointSpecs.map((e) => e.modulePath);
  const importerDir = dirname(toPosixPath(input.importer));
  const proposedNames = endpointPaths.map((path) => ({
    path,
    proposedName: pathToIdentifier(path),
  }));
  const varNameByPath = makeUniqueVarNames(proposedNames);

  const importLines: string[] = [
    `import { emptyRecordString, emptyRecordStringArray, composeWithLayers, resolveConfig, type AppConfig, type ComputeLayers, type LayerOrGroup, type RunConfig } from "@typed/app";`,
    `import * as Effect from "effect/Effect";`,
    `import * as Layer from "effect/Layer";`,
    `import * as HttpApi from "effect/unstable/httpapi/HttpApi";`,
    `import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";`,
    `import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";`,
    `import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";`,
    `import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";`,
    `import * as HttpApiScalar from "effect/unstable/httpapi/HttpApiScalar";`,
    `import * as HttpApiSwagger from "effect/unstable/httpapi/HttpApiSwagger";`,
    `import * as HttpServer from "effect/unstable/http/HttpServer";`,
    `import * as HttpRouter from "effect/unstable/http/HttpRouter";`,
    `import * as OpenApiModule from "effect/unstable/httpapi/OpenApi";`,
    `import http from "node:http";`,
    `import { NodeHttpServer } from "@effect/platform-node";`,
  ];

  for (const path of endpointPaths) {
    const importSpecifier = toImportSpecifier(importerDir, input.targetDirectory, path);
    importLines.push(
      `import * as ${varNameByPath.get(path)} from ${JSON.stringify(importSpecifier)};`,
    );
  }

  const apiId = apiSpec.defaultIdentifier;

  const groupExprs: string[] = [];
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
      const optionalPresent = input.optionalExportsByPath.get(ep.path) ?? new Set<OptionalExport>();
      const optsParts: string[] = [
        `params: ${m}.route.pathSchema`,
        `query: ${m}.route.querySchema`,
      ];
      for (const exp of OPTIONAL_ENDPOINT_EXPORTS) {
        if (optionalPresent.has(exp)) {
          const optName = EXPORT_TO_OPTION[exp];
          optsParts.push(`${optName}: ${m}.${exp}`);
        }
      }
      const opts = optsParts.join(", ");
      endpointExprs.push(
        `HttpApiEndpoint.${factory}(${JSON.stringify(name)}, ${m}.route.path, { ${opts} })`,
      );
    }

    const groupName = groupSpec.defaultName;
    const groupChain = endpointExprs.map((expr) => `.add(${expr})`).join("");
    groupExprs.push(`HttpApiGroup.make(${JSON.stringify(groupName)})${groupChain}`);
  }

  const apiChain = groupExprs.map((g) => `.add(${g})`).join("");
  const apiExpr = `HttpApi.make(${JSON.stringify(apiId)})${apiChain}`;

  const groupLayerBlocks: string[] = [];
  for (const groupSpec of groupSpecs) {
    const endpointsInGroup = endpointSpecs.filter((e) => e.groupKey === groupSpec.key);
    if (endpointsInGroup.length === 0) continue;
    const groupName = groupSpec.defaultName;
    const handleCalls = endpointsInGroup
      .map((e) => {
        const varName = varNameByPath.get(e.modulePath)!;
        const literals = input.extractedLiteralsByPath.get(e.path);
        const name = literals?.name ?? e.stem;
        const optPresent = input.optionalExportsByPath.get(e.path) ?? new Set<OptionalExport>();
        const headersArg = optPresent.has("headers") ? "ctx.headers" : "emptyRecordString";
        const bodyArg = optPresent.has("body") ? "ctx.payload" : "undefined";
        return `.handle(${JSON.stringify(name)}, (ctx) => ${varName}.handler({ path: ctx.params ?? emptyRecordString, query: ctx.query ?? emptyRecordStringArray, headers: ${headersArg}, body: ${bodyArg} }))`;
      })
      .join("\n      ");
    groupLayerBlocks.push(
      `HttpApiBuilder.group(Api, ${JSON.stringify(groupName)}, (handlers) => handlers${handleCalls})`,
    );
  }

  const baseApiLayer = `HttpApiBuilder.layer(Api)`;
  const mergedApiLayer =
    groupLayerBlocks.length === 0
      ? baseApiLayer
      : groupLayerBlocks.reduce(
          (acc, groupBlock) => `${acc}.pipe(Layer.provideMerge(${groupBlock}))`,
          baseApiLayer,
        );

  const middlewaresPath = apiSpec.directoryCompanions["_middlewares.ts"][0];
  const hasMiddlewares = Boolean(middlewaresPath);
  if (hasMiddlewares) {
    const middlewareSpecifier = toImportSpecifier(
      importerDir,
      input.targetDirectory,
      middlewaresPath,
    );
    importLines.push(`import * as ApiMiddlewares from ${JSON.stringify(middlewareSpecifier)};`);
  }

  const serveOptions = hasMiddlewares
    ? `{ disableListenLog, middleware: ApiMiddlewares.middleware ?? ApiMiddlewares.default }`
    : `{ disableListenLog }`;

  return `${importLines.join("\n")}

export const Api = ${apiExpr};
export const ApiLayer = ${mergedApiLayer};
export const OpenApi = OpenApiModule.fromApi(Api);
export const Swagger = HttpApiSwagger.layer(Api);
export const Scalar = HttpApiScalar.layer(Api);
export const Client = HttpApiClient.make(Api);

export const App = <const Layers extends readonly LayerOrGroup[] = []>(
  config?: AppConfig,
  ...layersToMergeIntoRouter: Layers
): Layer.Layer<
  Layer.Success<ComputeLayers<Layers, typeof ApiLayer>>, 
  Layer.Error<ComputeLayers<Layers, typeof ApiLayer>>, 
  Exclude<Layer.Services<ComputeLayers<Layers, typeof ApiLayer>>, HttpRouter.HttpRouter> | HttpServer.HttpServer
> => {
  const disableListenLog = config?.disableListenLog ?? false;
  const appLayer = composeWithLayers(ApiLayer, layersToMergeIntoRouter) as ComputeLayers<
    Layers,
    typeof ApiLayer
  >;
  return HttpRouter.serve(appLayer, ${serveOptions})
};

export const serve = <const Layers extends readonly LayerOrGroup[] = []>(
  config?: RunConfig,
  ...layersToMergeIntoRouter: Layers
) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const host = yield* resolveConfig(config?.host, "0.0.0.0");
      const port = yield* resolveConfig(config?.port, 3000);
      const disableListenLog = yield* resolveConfig(config?.disableListenLog, false);
      const appConfig: AppConfig = { disableListenLog };
      const appLayer = App(appConfig, ...layersToMergeIntoRouter);
      const serverLayer = NodeHttpServer.layer(http.createServer, { host, port });
      return appLayer.pipe(Layer.provide(serverLayer));
    }),
  );
`;
}
