import ts from "typescript";
import type { VirtualModuleRequestedExports } from "./types.js";

type MutableRequestedNames = {
  readonly names: Set<string>;
  readonly typeOnlyNames: Set<string>;
};

const all = (reason: string): VirtualModuleRequestedExports => ({ kind: "all", reason });

export function analyzeRequestedExports(
  sourceText: string,
  moduleSpecifier: string,
): VirtualModuleRequestedExports {
  const sourceFile = ts.createSourceFile("importer.ts", sourceText, ts.ScriptTarget.Latest, true);
  const requested: MutableRequestedNames = { names: new Set(), typeOnlyNames: new Set() };
  const namespaces = new Set<string>();

  for (const statement of sourceFile.statements) {
    const importResult = collectImportDeclaration(statement, moduleSpecifier, requested);
    if (importResult.kind === "all") return importResult;
    if (importResult.kind === "namespace") namespaces.add(importResult.name);

    const exportResult = collectExportDeclaration(statement, moduleSpecifier, requested);
    if (exportResult.kind === "all") return exportResult;
  }

  for (const namespace of namespaces) {
    const result = collectNamespaceUsage(sourceFile, namespace, requested);
    if (result.kind === "all") return result;
  }

  return { kind: "names", names: requested.names, typeOnlyNames: requested.typeOnlyNames };
}

type ImportCollectResult =
  | { readonly kind: "ok" }
  | { readonly kind: "namespace"; readonly name: string }
  | VirtualModuleRequestedExports;

function collectImportDeclaration(
  statement: ts.Statement,
  moduleSpecifier: string,
  requested: MutableRequestedNames,
): ImportCollectResult {
  if (!ts.isImportDeclaration(statement)) return { kind: "ok" };
  if (!isMatchingSpecifier(statement.moduleSpecifier, moduleSpecifier)) return { kind: "ok" };
  const clause = statement.importClause;
  if (!clause) return all("side-effect import");
  if (clause.name) return all("default import");
  const bindings = clause.namedBindings;
  if (!bindings) return { kind: "ok" };
  if (ts.isNamespaceImport(bindings)) return { kind: "namespace", name: bindings.name.text };
  for (const element of bindings.elements) {
    const exportName = (element.propertyName ?? element.name).text;
    if (clause.isTypeOnly || element.isTypeOnly) {
      requested.typeOnlyNames.add(exportName);
    } else {
      requested.names.add(exportName);
    }
  }
  return { kind: "ok" };
}

function collectExportDeclaration(
  statement: ts.Statement,
  moduleSpecifier: string,
  requested: MutableRequestedNames,
): VirtualModuleRequestedExports | { readonly kind: "ok" } {
  if (!ts.isExportDeclaration(statement)) return { kind: "ok" };
  if (!isMatchingSpecifier(statement.moduleSpecifier, moduleSpecifier)) return { kind: "ok" };
  const clause = statement.exportClause;
  if (!clause) return all("export star");
  if (!ts.isNamedExports(clause)) return all("namespace re-export");
  for (const element of clause.elements) {
    const exportName = (element.propertyName ?? element.name).text;
    if (statement.isTypeOnly) {
      requested.typeOnlyNames.add(exportName);
    } else {
      requested.names.add(exportName);
    }
  }
  return { kind: "ok" };
}

function collectNamespaceUsage(
  sourceFile: ts.SourceFile,
  namespace: string,
  requested: MutableRequestedNames,
): VirtualModuleRequestedExports | { readonly kind: "ok" } {
  let escaped = false;
  let computed = false;

  const visit = (node: ts.Node): void => {
    if (escaped || computed) return;
    if (isNamespaceImportIdentifier(node, namespace)) return;

    if (ts.isIdentifier(node) && node.text === namespace) {
      const parent = node.parent;
      if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
        requested.names.add(parent.name.text);
        return;
      }
      if (ts.isElementAccessExpression(parent) && parent.expression === node) {
        computed = true;
        return;
      }
      if (isObjectDestructuringFromNamespace(parent, node)) {
        collectObjectBindingNames(parent.name, requested);
        return;
      }
      escaped = true;
      return;
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  if (computed) return all("computed namespace access");
  if (escaped) return all("escaped namespace import");
  return { kind: "ok" };
}

function collectObjectBindingNames(
  pattern: ts.ObjectBindingPattern,
  requested: MutableRequestedNames,
): void {
  for (const element of pattern.elements) {
    if (element.dotDotDotToken) {
      requested.names.clear();
      requested.typeOnlyNames.clear();
      return;
    }
    const propertyName = element.propertyName;
    if (propertyName && ts.isIdentifier(propertyName)) {
      requested.names.add(propertyName.text);
      continue;
    }
    if (ts.isIdentifier(element.name)) requested.names.add(element.name.text);
  }
}

function isObjectDestructuringFromNamespace(
  parent: ts.Node,
  node: ts.Identifier,
): parent is ts.VariableDeclaration & { readonly name: ts.ObjectBindingPattern } {
  return (
    ts.isVariableDeclaration(parent) &&
    parent.initializer === node &&
    ts.isObjectBindingPattern(parent.name)
  );
}

function isNamespaceImportIdentifier(node: ts.Node, namespace: string): boolean {
  return (
    ts.isIdentifier(node) &&
    node.text === namespace &&
    ts.isNamespaceImport(node.parent) &&
    node.parent.name === node
  );
}

function isMatchingSpecifier(
  specifier: ts.Expression | undefined,
  moduleSpecifier: string,
): boolean {
  return specifier !== undefined && ts.isStringLiteralLike(specifier) && specifier.text === moduleSpecifier;
}
