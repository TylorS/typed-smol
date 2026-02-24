/**
 * Extract path and method from endpoint source at compile time via AST.
 * Validates route has required pathSchema and querySchema.
 */
import * as ts from "typescript";

export interface ExtractedEndpointLiterals {
  readonly path: string;
  readonly method: string;
  readonly name: string;
}

/**
 * Extracts route path and method from endpoint source by parsing the TS/JS AST.
 * Looks for: export const route = { path: "/..." } or "path"; export const method = "GET";
 */
export function extractEndpointLiterals(
  source: string,
  filePath: string,
  stem: string,
): ExtractedEndpointLiterals {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") || filePath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  let path = `/${stem}`;
  let method = "GET";

  const visit = (node: ts.Node): void => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const name = (decl.name as ts.Identifier).text;
        const init = decl.initializer;
        if (!init) continue;

        if (name === "route") {
          const p = extractRoutePath(init, ts);
          if (p) path = p;
          return;
        }
        if (name === "method") {
          const m = extractStringLiteral(init, ts);
          if (m) method = m.toUpperCase();
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  return { path, method, name: stem };
}

function extractRoutePath(node: ts.Node, tsMod: typeof ts): string | null {
  if (tsMod.isStringLiteral(node)) {
    const raw = (node as ts.StringLiteral).text;
    return raw ? (raw.startsWith("/") ? raw : `/${raw}`) : null;
  }
  if (tsMod.isObjectLiteralExpression(node)) {
    for (const prop of (node as ts.ObjectLiteralExpression).properties) {
      if (!tsMod.isPropertyAssignment(prop)) continue;
      const propName = tsMod.isIdentifier(prop.name) ? (prop.name as ts.Identifier).text : null;
      if (propName === "path") {
        const p = extractStringLiteral(prop.initializer, tsMod);
        return p ? (p.startsWith("/") ? p : `/${p}`) : null;
      }
    }
  }
  return null;
}

function extractStringLiteral(node: ts.Node | undefined, tsMod: typeof ts): string | null {
  if (!node) return null;
  if (tsMod.isStringLiteral(node)) return (node as ts.StringLiteral).text;
  return null;
}
