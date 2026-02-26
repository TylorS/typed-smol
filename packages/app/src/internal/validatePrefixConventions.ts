/**
 * Validates prefix exports in convention files and extracts path strings.
 * All prefix sources must export a Route from @typed/router.
 */
import type {
  DirectoryConventionRef,
  HttpApiDescriptorTree,
  HttpApiEndpointNode,
  HttpApiTreeNode,
  RootOrGroupConventionRef,
} from "./httpapiDescriptorTree.js";
import {
  extractPrefixFromConvention,
  type ExtractPrefixFromConventionResult,
} from "./extractHttpApiLiterals.js";
import type { TypeInfoApi, TypeInfoFileSnapshot } from "@typed/virtual-modules";

export type PrefixConventionViolation = { readonly code: string; readonly message: string };

export type PrefixByScope = {
  readonly apiRoot?: string;
  readonly byGroupDir: ReadonlyMap<string, string>;
  readonly byDirectory: ReadonlyMap<string, string>;
  readonly byEndpoint: ReadonlyMap<string, string>;
};

function collectPrefixPaths(tree: HttpApiDescriptorTree): {
  apiRootPaths: string[];
  groupPaths: Array<{ path: string; dirPath: string }>;
  directoryPrefixPaths: Array<{ path: string; dirPath: string }>;
  endpointPrefixPaths: Array<{ path: string; endpointPath: string }>;
} {
  const apiRootPaths: string[] = [];
  const groupPaths: Array<{ path: string; dirPath: string }> = [];
  const directoryPrefixPaths: Array<{ path: string; dirPath: string }> = [];
  const endpointPrefixPaths: Array<{ path: string; endpointPath: string }> = [];

  for (const c of tree.conventions) {
    if ((c as RootOrGroupConventionRef).kind === "api_root") {
      apiRootPaths.push((c as RootOrGroupConventionRef).path);
    }
  }

  const visit = (nodes: readonly HttpApiTreeNode[]): void => {
    for (const node of nodes) {
      if (node.type === "endpoint") {
        for (const comp of node.companions) {
          if (comp.kind === ".prefix") {
            endpointPrefixPaths.push({ path: comp.path, endpointPath: node.path });
          }
        }
        continue;
      }
      for (const c of node.conventions) {
        if ((c as RootOrGroupConventionRef).kind === "group_override") {
          groupPaths.push({
            path: (c as RootOrGroupConventionRef).path,
            dirPath: node.dirPath,
          });
        } else if ((c as DirectoryConventionRef).kind === "_prefix.ts") {
          directoryPrefixPaths.push({
            path: (c as DirectoryConventionRef).path,
            dirPath: node.dirPath,
          });
        }
      }
      visit(node.children);
    }
  };
  visit(tree.children);

  return {
    apiRootPaths,
    groupPaths,
    directoryPrefixPaths,
    endpointPrefixPaths,
  };
}

function validateOne(
  path: string,
  snapshot: TypeInfoFileSnapshot | undefined,
  api: TypeInfoApi,
  exportName: "prefix" | "default",
): { violation?: PrefixConventionViolation; result?: ExtractPrefixFromConventionResult } {
  if (!snapshot) {
    return {
      violation: { code: "AVM-CONTRACT-007", message: `prefix convention file not found: ${path}` },
    };
  }
  const result = extractPrefixFromConvention(snapshot, api, exportName);
  if (!result.ok) {
    return {
      violation: { code: "AVM-CONTRACT-007", message: result.reason },
      result,
    };
  }
  return { result };
}

export function validatePrefixConventions(
  tree: HttpApiDescriptorTree,
  snapshotsByPath: ReadonlyMap<string, TypeInfoFileSnapshot>,
  api: TypeInfoApi,
): {
  violations: readonly PrefixConventionViolation[];
  prefixByScope: PrefixByScope;
} {
  const violations: PrefixConventionViolation[] = [];
  const prefixByScope: PrefixByScope = {
    apiRoot: undefined,
    byGroupDir: new Map(),
    byDirectory: new Map(),
    byEndpoint: new Map(),
  };

  const paths = collectPrefixPaths(tree);

  for (const path of paths.apiRootPaths) {
    const snapshot = snapshotsByPath.get(path);
    const { violation, result } = validateOne(path, snapshot, api, "prefix");
    if (violation) violations.push(violation);
    if (result?.ok && result.path) {
      (prefixByScope as { apiRoot?: string }).apiRoot = result.path;
    }
  }

  for (const { path, dirPath } of paths.groupPaths) {
    const snapshot = snapshotsByPath.get(path);
    const { violation, result } = validateOne(path, snapshot, api, "prefix");
    if (violation) violations.push(violation);
    if (result?.ok && result.path) {
      (prefixByScope.byGroupDir as Map<string, string>).set(dirPath, result.path);
    }
  }

  for (const { path, dirPath } of paths.directoryPrefixPaths) {
    const snapshot = snapshotsByPath.get(path);
    const { violation, result } = validateOne(path, snapshot, api, "default");
    if (violation) violations.push(violation);
    if (result?.ok && result.path) {
      (prefixByScope.byDirectory as Map<string, string>).set(dirPath, result.path);
    }
  }

  for (const { path, endpointPath } of paths.endpointPrefixPaths) {
    const snapshot = snapshotsByPath.get(path);
    const { violation, result } = validateOne(path, snapshot, api, "default");
    if (violation) violations.push(violation);
    if (result?.ok && result.path) {
      (prefixByScope.byEndpoint as Map<string, string>).set(endpointPath, result.path);
    }
  }

  return {
    violations: violations.sort((a, b) => a.message.localeCompare(b.message, "en")),
    prefixByScope,
  };
}
