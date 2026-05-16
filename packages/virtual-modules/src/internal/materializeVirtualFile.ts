import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import * as ts from "typescript";
import { toPosixPath } from "./path.js";

interface LiteralReplacement {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

const isRelativeModuleSpecifier = (specifier: string): boolean =>
  specifier.startsWith("./") || specifier.startsWith("../");

const rewriteModuleSpecifierText = (
  specifier: string,
  importerDir: string,
  previewDir: string,
): string => {
  if (!isRelativeModuleSpecifier(specifier)) return specifier;

  const absoluteTarget = resolve(importerDir, specifier);
  const newRel = toPosixPath(relative(previewDir, absoluteTarget));
  return newRel.startsWith(".") ? newRel : `./${newRel}`;
};

const createLiteralReplacement = (
  literal: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
  sourceFile: ts.SourceFile,
  importerDir: string,
  previewDir: string,
): LiteralReplacement | undefined => {
  const rewritten = rewriteModuleSpecifierText(literal.text, importerDir, previewDir);
  if (rewritten === literal.text) return undefined;
  const original = literal.getText(sourceFile);
  return {
    start: literal.getStart(sourceFile),
    end: literal.getEnd(),
    text: quoteLikeOriginal(original, rewritten),
  };
};

const quoteLikeOriginal = (original: string, value: string): string => {
  const quote = original.startsWith("'") ? "'" : original.startsWith("`") ? "`" : '"';
  if (quote === "`") return `\`${escapeTemplateLiteralText(value)}\``;
  return `${quote}${escapeStringLiteralText(value, quote)}${quote}`;
};

const escapeStringLiteralText = (value: string, quote: "'" | '"'): string =>
  value.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);

const escapeTemplateLiteralText = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");

const rewriteModuleSpecifiers = (
  sourceFile: ts.SourceFile,
  importerDir: string,
  previewDir: string,
): string => {
  const replacements: LiteralReplacement[] = [];
  const add = (literal: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): void => {
    const replacement = createLiteralReplacement(literal, sourceFile, importerDir, previewDir);
    if (replacement) replacements.push(replacement);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [moduleSpecifier] = node.arguments;
      if (
        ts.isStringLiteral(moduleSpecifier) ||
        ts.isNoSubstitutionTemplateLiteral(moduleSpecifier)
      ) {
        add(moduleSpecifier);
      }
    } else if (ts.isImportTypeNode(node)) {
      const argument = node.argument;
      if (ts.isLiteralTypeNode(argument) && ts.isStringLiteral(argument.literal)) {
        add(argument.literal);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return applyReplacements(sourceFile.text, replacements);
};

const applyReplacements = (
  sourceText: string,
  replacements: readonly LiteralReplacement[],
): string => {
  let rewritten = sourceText;
  for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
    rewritten =
      rewritten.slice(0, replacement.start) + replacement.text + rewritten.slice(replacement.end);
  }
  return rewritten;
};

/**
 * Rewrite relative import specifiers in sourceText so they resolve correctly when
 * the file is placed in previewDir instead of importerDir.
 */
export function rewriteSourceForPreviewLocation(
  sourceText: string,
  importer: string,
  virtualFilePath: string,
): string {
  const importerDir = dirname(resolve(importer));
  const previewDir = dirname(resolve(virtualFilePath));
  const scriptKind = virtualFilePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    virtualFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  return rewriteModuleSpecifiers(sourceFile, importerDir, previewDir);
}

/**
 * Materialize virtual module content to disk at virtualFilePath. Rewrites relative
 * imports so they resolve from the virtual file's location. Used so go-to-definition
 * can open the file (path must exist on disk).
 */
export function materializeVirtualFile(
  virtualFilePath: string,
  importer: string,
  sourceText: string,
): void {
  const rewritten = rewriteSourceForPreviewLocation(sourceText, importer, virtualFilePath);
  mkdirSync(dirname(resolve(virtualFilePath)), { recursive: true });
  writeFileSync(virtualFilePath, rewritten, "utf8");
}
