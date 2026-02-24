/**
 * Deterministic ordering for HttpApi discovery: paths, roles, and AST nodes.
 * Centralizes stable sort so AST nodes and file roles have consistent order.
 */

import type { HttpApiTreeNode } from "./httpapiDescriptorTree.js";
import {
  compareHttpApiPathOrder,
  normalizeHttpApiRelativePath,
  sortHttpApiPaths,
} from "./httpapiFileRoles.js";

export { compareHttpApiPathOrder, normalizeHttpApiRelativePath, sortHttpApiPaths };

function nodeOrderKey(n: HttpApiTreeNode): string {
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

/**
 * Stable comparison for tree nodes (by path or dirPath).
 */
export function compareHttpApiTreeNodeOrder(a: HttpApiTreeNode, b: HttpApiTreeNode): number {
  return compareHttpApiPathOrder(nodeOrderKey(a), nodeOrderKey(b));
}

/**
 * Returns a new array of tree nodes in deterministic order.
 */
export function sortHttpApiTreeNodes(nodes: readonly HttpApiTreeNode[]): HttpApiTreeNode[] {
  return [...nodes].sort(compareHttpApiTreeNodeOrder);
}
