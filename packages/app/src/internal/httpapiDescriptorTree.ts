/**
 * Filesystem tree AST for HttpApi virtual module discovery.
 * Converts role-classified artifacts into a deterministic tree (ApiRoot, Group, PathlessDirectory, Endpoint, Convention metadata).
 * Parenthesized pathless directories do not create a named group but preserve composition order.
 */

import type {
  HttpApiDirectoryCompanionKind,
  HttpApiEndpointCompanionKind,
  HttpApiFileRole,
} from "./httpapiFileRoles.js";
import { compareHttpApiPathOrder, sortHttpApiPaths } from "./httpapiFileRoles.js";

/** Path segment is pathless when it matches (name) and does not create an HttpApiGroup. */
const PATHLESS_DIRECTORY_PATTERN = /^\([^)]*\)$/;

export function isPathlessDirectorySegment(segment: string): boolean {
  return PATHLESS_DIRECTORY_PATTERN.test(segment);
}

/** Reference to a directory-level convention file (e.g. _dependencies.ts). */
export type DirectoryConventionRef = {
  readonly path: string;
  readonly kind: HttpApiDirectoryCompanionKind;
};

/** Reference to API root or group override convention. */
export type RootOrGroupConventionRef = {
  readonly path: string;
  readonly kind: "api_root" | "group_override";
};

/** Reference to an endpoint companion file (e.g. list.openapi.ts). */
export type EndpointCompanionRef = {
  readonly path: string;
  readonly kind: HttpApiEndpointCompanionKind;
};

/** Leaf node: endpoint primary with optional companion refs. */
export type HttpApiEndpointNode = {
  readonly type: "endpoint";
  readonly path: string;
  /** Filename stem without extension (e.g. "list"). */
  readonly stem: string;
  readonly companions: readonly EndpointCompanionRef[];
};

/** Directory that does not create a named group (e.g. (internal)). */
export type HttpApiPathlessDirectoryNode = {
  readonly type: "pathless_directory";
  /** Full relative dir path (e.g. "users/(internal)"). */
  readonly dirPath: string;
  readonly conventions: readonly (DirectoryConventionRef | RootOrGroupConventionRef)[];
  readonly children: readonly HttpApiTreeNode[];
};

/** Named group directory (creates HttpApiGroup). */
export type HttpApiGroupNode = {
  readonly type: "group";
  /** Group name (default from directory segment, override from _group.ts). */
  readonly groupName: string;
  /** Full relative dir path (e.g. "users"). */
  readonly dirPath: string;
  readonly children: readonly HttpApiTreeNode[];
  readonly conventions: readonly (DirectoryConventionRef | RootOrGroupConventionRef)[];
};

export type HttpApiTreeNode = HttpApiEndpointNode | HttpApiGroupNode | HttpApiPathlessDirectoryNode;

/** Root of the descriptor tree. */
export type HttpApiDescriptorTree = {
  readonly type: "api_root";
  readonly dirPath: "";
  readonly children: readonly HttpApiTreeNode[];
  readonly conventions: readonly (DirectoryConventionRef | RootOrGroupConventionRef)[];
  /** Diagnostics-ready: unsupported roles collected during parse. */
  readonly diagnostics: readonly HttpApiTreeDiagnostic[];
};

export type HttpApiTreeDiagnostic = {
  readonly code: string;
  readonly message: string;
  readonly path: string;
};

export type BuildHttpApiDescriptorTreeInput = {
  /** Classified file roles (supported and unsupported_reserved). */
  readonly roles: readonly HttpApiFileRole[];
  /** Optional: only include paths under this base (relative); not used for filtering if empty. */
  readonly baseDir?: string;
};

/**
 * Builds a deterministic tree AST from classified file roles.
 * Pathless directory segments (e.g. "(internal)") are represented as PathlessDirectoryNode and do not create a group name.
 */
export function buildHttpApiDescriptorTree(
  input: BuildHttpApiDescriptorTreeInput,
): HttpApiDescriptorTree {
  const { roles } = input;
  const diagnostics: HttpApiTreeDiagnostic[] = [];
  const supported: HttpApiFileRole[] = [];
  for (const r of roles) {
    if (r.role === "unsupported_reserved") {
      diagnostics.push({
        code: r.diagnosticCode,
        message: r.diagnosticMessage,
        path: r.path,
      });
    } else {
      supported.push(r);
    }
  }

  const apiRootConventions: (DirectoryConventionRef | RootOrGroupConventionRef)[] = [];
  const directoryConventionsByDir = new Map<
    string,
    (DirectoryConventionRef | RootOrGroupConventionRef)[]
  >();
  const endpointCompanionsByKey = new Map<string, EndpointCompanionRef[]>();

  for (const r of supported) {
    if (r.role === "api_root") {
      apiRootConventions.push({ path: r.path, kind: "api_root" });
      continue;
    }
    if (r.role === "group_override") {
      const dir = dirname(r.path);
      directoryConventionsByDir.set(dir, [
        ...(directoryConventionsByDir.get(dir) ?? []),
        { path: r.path, kind: "group_override" },
      ]);
      continue;
    }
    if (r.role === "directory_companion") {
      const dir = dirname(r.path);
      const list = directoryConventionsByDir.get(dir) ?? [];
      list.push({ path: r.path, kind: r.kind });
      directoryConventionsByDir.set(dir, list);
      continue;
    }
    if (r.role === "endpoint_primary") {
      continue;
    }
    if (r.role === "endpoint_companion") {
      const dir = dirname(r.path);
      const key = dir ? `${dir}/${r.endpointStem}` : r.endpointStem;
      const list = endpointCompanionsByKey.get(key) ?? [];
      list.push({ path: r.path, kind: r.kind });
      endpointCompanionsByKey.set(key, list);
    }
  }

  const allDirs = new Set<string>();
  function addDirAndAncestors(d: string): void {
    allDirs.add(d);
    const idx = d.lastIndexOf("/");
    if (idx > 0) addDirAndAncestors(d.slice(0, idx));
  }
  for (const r of supported) {
    const p = "path" in r ? r.path : "";
    addDirAndAncestors(dirname(p));
  }
  for (const [dir] of directoryConventionsByDir) {
    addDirAndAncestors(dir);
  }
  const sortedDirs = sortHttpApiPaths([...allDirs]);

  const dirSegments = (dirPath: string): string[] =>
    dirPath ? dirPath.split("/").filter(Boolean) : [];

  const childrenByParentDir = new Map<string, string[]>();
  for (const d of sortedDirs) {
    const segments = dirSegments(d);
    if (segments.length === 0) continue;
    const parent = segments.length === 1 ? "" : segments.slice(0, -1).join("/");
    const list = childrenByParentDir.get(parent) ?? [];
    if (!list.includes(d)) list.push(d);
    childrenByParentDir.set(parent, list);
  }

  function buildNode(dirPath: string): HttpApiTreeNode[] {
    const directFiles = supported
      .filter((r) => {
        if (r.role !== "endpoint_primary") return false;
        const p = r.path;
        const d = dirname(p);
        return d === dirPath;
      })
      .map((r) => r as { role: "endpoint_primary"; path: string })
      .sort((a, b) => compareHttpApiPathOrder(a.path, b.path));

    const childDirs = (childrenByParentDir.get(dirPath) ?? [])
      .slice()
      .sort(compareHttpApiPathOrder);
    const nodes: HttpApiTreeNode[] = [];

    for (const f of directFiles) {
      const stem = stemFromPath(f.path);
      const companionKey = dirPath ? `${dirPath}/${stem}` : stem;
      const companions = endpointCompanionsByKey.get(companionKey) ?? [];
      nodes.push({
        type: "endpoint",
        path: f.path,
        stem,
        companions: [...companions].sort((a, b) => compareHttpApiPathOrder(a.path, b.path)),
      });
    }

    for (const childDir of childDirs) {
      const segments = dirSegments(childDir);
      const segmentName = segments[segments.length - 1] ?? "";
      if (isPathlessDirectorySegment(segmentName)) {
        const childNodes = buildNode(childDir);
        const conventions = directoryConventionsByDir.get(childDir) ?? [];
        nodes.push({
          type: "pathless_directory",
          dirPath: childDir,
          conventions: [...conventions].sort((a, b) => compareHttpApiPathOrder(a.path, b.path)),
          children: childNodes.length === 0 ? [] : childNodes.slice().sort(compareTreeNodes),
        });
      } else {
        const groupName = segmentName;
        const childNodes = buildNode(childDir);
        const conventions = directoryConventionsByDir.get(childDir) ?? [];
        nodes.push({
          type: "group",
          groupName,
          dirPath: childDir,
          children: childNodes.length === 0 ? [] : childNodes.slice().sort(compareTreeNodes),
          conventions: [...conventions].sort((a, b) => compareHttpApiPathOrder(a.path, b.path)),
        });
      }
    }

    return nodes.slice().sort(compareTreeNodes);
  }

  const rootChildren = buildNode("");
  const rootConventions = [...apiRootConventions];
  const rootDirConventions = directoryConventionsByDir.get("") ?? [];
  for (const c of rootDirConventions) {
    rootConventions.push(c);
  }
  rootConventions.sort((a, b) => compareHttpApiPathOrder(a.path, b.path));

  return {
    type: "api_root",
    dirPath: "",
    children: rootChildren,
    conventions: rootConventions,
    diagnostics,
  };
}

function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}

function stemFromPath(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1);
  const extIdx = base.lastIndexOf(".");
  return extIdx <= 0 ? base : base.slice(0, extIdx);
}

function nodeSortKey(n: HttpApiTreeNode): string {
  switch (n.type) {
    case "endpoint":
      return n.path;
    case "group":
    case "pathless_directory":
      return n.dirPath;
    default:
      return "";
  }
}

function compareTreeNodes(a: HttpApiTreeNode, b: HttpApiTreeNode): number {
  return compareHttpApiPathOrder(nodeSortKey(a), nodeSortKey(b));
}
