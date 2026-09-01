/**
 * A deliberately small, deterministic highlighter for generated documentation.
 *
 * This runs while Markdown is rendered for the static site. It is not intended
 * to validate or execute source: every source fragment is escaped before it is
 * placed in a token span, and unknown languages fall back to plain text.
 */

export type HighlightLanguage =
  | "ts"
  | "tsx"
  | "js"
  | "jsx"
  | "html"
  | "svelte"
  | "css"
  | "sh"
  | "json"
  | "text";

const aliases: Readonly<Record<string, HighlightLanguage>> = {
  bash: "sh",
  css: "css",
  htm: "html",
  html: "html",
  javascript: "js",
  javaScript: "js",
  jsx: "jsx",
  json: "json",
  jsonc: "json",
  shell: "sh",
  sh: "sh",
  svelte: "svelte",
  text: "text",
  ts: "ts",
  tsx: "tsx",
  typescript: "ts",
  typescriptreact: "tsx",
  txt: "text",
};

const typescriptKeywords = new Set([
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "keyof",
  "let",
  "new",
  "of",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "set",
  "static",
  "super",
  "switch",
  "throw",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

const typescriptTypes = new Set([
  "Array",
  "bigint",
  "boolean",
  "never",
  "number",
  "object",
  "Promise",
  "Record",
  "string",
  "symbol",
  "unknown",
  "void",
]);

const shellKeywords = new Set([
  "case",
  "do",
  "done",
  "elif",
  "else",
  "esac",
  "fi",
  "for",
  "function",
  "if",
  "in",
  "then",
  "until",
  "while",
]);

const htmlEscape = (value: string): string =>
  value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

const token = (kind: string, value: string): string =>
  `<span class="tok-${kind}">${htmlEscape(value)}</span>`;

const isIdentifierStart = (character: string | undefined): boolean =>
  character !== undefined && /[A-Za-z_$]/u.test(character);

const isIdentifierPart = (character: string | undefined): boolean =>
  character !== undefined && /[A-Za-z0-9_$]/u.test(character);

const isWordBoundary = (character: string | undefined): boolean =>
  character === undefined || !/[A-Za-z0-9_$]/u.test(character);

const readQuoted = (source: string, start: number, quote: string): number => {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
    } else if (source[index] === quote) {
      return index + 1;
    } else {
      index += 1;
    }
  }
  return source.length;
};

const readLine = (source: string, start: number): number => {
  const newline = source.indexOf("\n", start);
  return newline === -1 ? source.length : newline;
};

const readBlockComment = (source: string, start: number): number => {
  const end = source.indexOf("*/", start + 2);
  return end === -1 ? source.length : end + 2;
};

const isScriptLanguage = (language: HighlightLanguage): boolean =>
  language === "ts" || language === "tsx" || language === "js" || language === "jsx";

const isEscapedAt = (source: string, index: number): boolean => {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) slashes += 1;
  return slashes % 2 === 1;
};

const readInterpolationEnd = (source: string, start: number): number => {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    if (source.slice(index, index + 2) === "//") {
      index = readLine(source, index);
      continue;
    }
    if (source.slice(index, index + 2) === "/*") {
      index = readBlockComment(source, index);
      continue;
    }
    const character = source[index]!;
    if (character === '"' || character === "'" || character === "`") {
      index = readQuoted(source, index, character);
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
    index += 1;
  }
  return source.length;
};

const readMarkupTagEnd = (source: string, start: number): number => {
  let index = start + 1;
  while (index < source.length) {
    const character = source[index]!;
    if (character === '"' || character === "'") {
      index = readQuoted(source, index, character);
      continue;
    }
    if (character === "{") {
      index = readInterpolationEnd(source, index + 1);
      continue;
    }
    if (character === ">") return index + 1;
    index += 1;
  }
  return source.length;
};

const isJsxStart = (source: string, index: number): boolean => {
  const next = source[index + 1];
  if (
    isIdentifierPart(source[index - 1]) ||
    source[index - 1] === ")" ||
    source[index - 1] === "]"
  ) {
    return false;
  }
  let nameEnd = index + 1;
  while (isIdentifierPart(source[nameEnd])) nameEnd += 1;
  if (/^\s*,/u.test(source.slice(nameEnd))) return false;
  return (
    next === ">" ||
    (next === "/" && (source[index + 2] === ">" || isIdentifierStart(source[index + 2]))) ||
    isIdentifierStart(next)
  );
};

const readJsxElementEnd = (source: string, start: number): number => {
  let depth = 0;
  let index = start;
  while (index < source.length) {
    const nextTag = source.indexOf("<", index);
    if (nextTag === -1 || !isJsxStart(source, nextTag)) return source.length;
    const end = readMarkupTagEnd(source, nextTag);
    const tag = source.slice(nextTag, end);
    const closing = tag.startsWith("</");
    const selfClosing = /\/\s*>$/u.test(tag);
    if (!closing && !selfClosing) depth += 1;
    if (closing) depth -= 1;
    if (depth === 0) return end;
    index = end;
  }
  return source.length;
};

const classifyWord = (
  word: string,
  language: HighlightLanguage,
  source: string,
  end: number,
  lineStart: boolean,
): string | undefined => {
  if (language === "json") {
    if (source.slice(end).match(/^\s*:/u) !== null) return "property";
    if (word === "true" || word === "false") return "boolean";
    if (word === "null") return "constant";
    return undefined;
  }
  if (language === "sh") {
    if (lineStart || source.slice(end).match(/^\s*(?:&&|\|\||\||;)/u) !== null) {
      return "command";
    }
    return shellKeywords.has(word) ? "keyword" : undefined;
  }
  if (language === "css") return undefined;
  if (typescriptKeywords.has(word)) return "keyword";
  if (typescriptTypes.has(word)) return "type";
  if (word === "true" || word === "false") return "boolean";
  if (word === "null" || word === "NaN" || word === "Infinity") return "constant";
  if (source.slice(end).match(/^\s*\(/u) !== null) return "function";
  if (/^[A-Z]/u.test(word)) return "type";
  return undefined;
};

const highlightGeneric = (language: HighlightLanguage, source: string): string => {
  let result = "";
  let index = 0;
  let lineStart = true;

  const append = (value: string, kind?: string): void => {
    result += kind === undefined ? htmlEscape(value) : token(kind, value);
    if (value.endsWith("\n")) lineStart = true;
    else if (value.trim() !== "") lineStart = false;
  };

  while (index < source.length) {
    const character = source[index]!;
    if (/\s/u.test(character)) {
      const start = index;
      while (index < source.length && /\s/u.test(source[index]!)) index += 1;
      append(source.slice(start, index));
      continue;
    }

    if (
      (language === "sh" && character === "#") ||
      ((language === "ts" ||
        language === "tsx" ||
        language === "js" ||
        language === "jsx" ||
        language === "css") &&
        source.slice(index, index + 2) === "//")
    ) {
      const end = readLine(source, index);
      append(source.slice(index, end), "comment");
      index = end;
      continue;
    }

    if (
      (language === "ts" ||
        language === "tsx" ||
        language === "js" ||
        language === "jsx" ||
        language === "css") &&
      source.slice(index, index + 2) === "/*"
    ) {
      const end = readBlockComment(source, index);
      append(source.slice(index, end), "comment");
      index = end;
      continue;
    }

    if (character === '"' || character === "'" || (character === "`" && language !== "json")) {
      const end = readQuoted(source, index, character);
      const kind =
        language === "json" && source.slice(end).match(/^\s*:/u) !== null ? "property" : "string";
      append(source.slice(index, end), kind);
      index = end;
      continue;
    }

    if ((language === "tsx" || language === "jsx") && character === "<" && isJsxStart(source, index)) {
      const end = readJsxElementEnd(source, index);
      result += highlightMarkup(source.slice(index, end), language, "braces");
      index = end;
      lineStart = false;
      continue;
    }

    if (/[0-9]/u.test(character) && (index === 0 || isWordBoundary(source[index - 1]))) {
      const match = /^(?:0[xob][0-9a-f]+|(?:\d[\d_]*\.?[\d_]*|\.\d+)(?:e[+-]?\d+)?n?)/iu.exec(
        source.slice(index),
      );
      if (match !== null) {
        append(match[0], "number");
        index += match[0].length;
        continue;
      }
    }

    if (isIdentifierStart(character)) {
      const start = index;
      index += 1;
      while (isIdentifierPart(source[index])) index += 1;
      const word = source.slice(start, index);
      if (word === "html" && isScriptLanguage(language) && source[index] === "`") {
        append(word, "template-tag");
        const template = highlightHtmlTemplate(source, index, language);
        result += template.highlighted;
        index = template.end;
        lineStart = false;
        continue;
      }
      append(word, classifyWord(word, language, source, index, lineStart));
      continue;
    }

    if (/[=+\-*\/%!<>&|?~^:]/u.test(character)) {
      const start = index;
      index += 1;
      while (index < source.length && /[=+\-*\/%!<>&|?~^:]/u.test(source[index]!)) index += 1;
      append(source.slice(start, index), "operator");
      continue;
    }

    if (/[{}[\]();,.]/u.test(character)) {
      append(character, "punctuation");
      index += 1;
      continue;
    }

    append(character);
    index += 1;
  }
  return result;
};

const highlightInterpolation = (
  source: string,
  start: number,
  language: HighlightLanguage,
): { readonly highlighted: string; readonly end: number } => {
  const end = readInterpolationEnd(source, start + 2);
  const expressionEnd = end > start + 2 && source[end - 1] === "}" ? end - 1 : end;
  return {
    highlighted:
      token("template-punctuation", "${") +
      highlightGeneric(language, source.slice(start + 2, expressionEnd)) +
      (expressionEnd < end ? token("template-punctuation", "}") : ""),
    end,
  };
};

type MarkupExpressionStyle = "template" | "braces";

const highlightBraceExpression = (
  source: string,
  start: number,
  language: HighlightLanguage,
  svelteBlock: boolean,
): { readonly highlighted: string; readonly end: number } => {
  const end = readInterpolationEnd(source, start + 1);
  const expressionEnd = end > start + 1 && source[end - 1] === "}" ? end - 1 : end;
  const expression = source.slice(start + 1, expressionEnd);
  const directive = svelteBlock ? /^(?:[#:/][A-Za-z][\w-]*)/u.exec(expression) : null;
  const directiveEnd = directive?.[0].length ?? 0;
  return {
    highlighted:
      token("punctuation", "{") +
      (directive === null ? "" : token("keyword", directive[0])) +
      highlightGeneric(language, expression.slice(directiveEnd)) +
      (expressionEnd < end ? token("punctuation", "}") : ""),
    end,
  };
};

const highlightMarkup = (
  source: string,
  embeddedLanguage?: HighlightLanguage,
  expressionStyle: MarkupExpressionStyle = "template",
  svelteBlocks = false,
): string => {
  let result = "";
  let index = 0;

  const interpolationAt = (cursor: number): boolean => {
    if (embeddedLanguage === undefined || isEscapedAt(source, cursor)) return false;
    return expressionStyle === "template"
      ? source.slice(cursor, cursor + 2) === "${"
      : source[cursor] === "{";
  };

  const appendInterpolation = (): void => {
    const interpolation =
      expressionStyle === "template"
        ? highlightInterpolation(source, index, embeddedLanguage!)
        : highlightBraceExpression(source, index, embeddedLanguage!, svelteBlocks);
    result += interpolation.highlighted;
    index = interpolation.end;
  };

  while (index < source.length) {
    if (source.slice(index, index + 4) === "<!--") {
      const end = source.indexOf("-->", index + 4);
      const finish = end === -1 ? source.length : end + 3;
      result += token("comment", source.slice(index, finish));
      index = finish;
      continue;
    }
    if (interpolationAt(index)) {
      appendInterpolation();
      continue;
    }
    if (source[index] !== "<") {
      let finish = index + 1;
      while (finish < source.length && source[finish] !== "<" && !interpolationAt(finish)) {
        finish += 1;
      }
      result += htmlEscape(source.slice(index, finish));
      index = finish;
      continue;
    }

    if (source.slice(index, index + 3) === "</>") {
      result += token("punctuation", "</>");
      index += 3;
      continue;
    }
    if (source.slice(index, index + 2) === "<>") {
      result += token("punctuation", "<>");
      index += 2;
      continue;
    }

    const opening = source[index + 1] === "/" ? "</" : "<";
    const nameStart = index + opening.length;
    const name = /^[A-Za-z][\w:.-]*/u.exec(source.slice(nameStart));
    if (name === null) {
      result += htmlEscape("<");
      index += 1;
      continue;
    }

    result += token("punctuation", opening);
    result += token("tag", name[0]);
    index = nameStart + name[0].length;

    while (index < source.length) {
      if (source.slice(index, index + 2) === "/>") {
        result += token("punctuation", "/>");
        index += 2;
        break;
      }
      if (source[index] === ">") {
        result += token("punctuation", ">");
        index += 1;
        break;
      }
      if (interpolationAt(index)) {
        appendInterpolation();
        continue;
      }

      const whitespace = /^\s+/u.exec(source.slice(index));
      if (whitespace !== null) {
        result += htmlEscape(whitespace[0]);
        index += whitespace[0].length;
        continue;
      }

      const attribute = /^(?:\.\.\.|[.?@]?[A-Za-z_][\w:.-]*)/u.exec(source.slice(index));
      if (attribute === null) {
        result += htmlEscape(source[index]!);
        index += 1;
        continue;
      }
      result += token("attribute", attribute[0]);
      index += attribute[0].length;

      const beforeEquals = /^\s*/u.exec(source.slice(index))![0];
      const equalsIndex = index + beforeEquals.length;
      if (source[equalsIndex] !== "=") {
        continue;
      }

      const afterEquals = /^\s*/u.exec(source.slice(equalsIndex + 1))![0];
      result += htmlEscape(beforeEquals);
      result += token("operator", "=");
      result += htmlEscape(afterEquals);
      index = equalsIndex + 1 + afterEquals.length;

      if (interpolationAt(index)) {
        appendInterpolation();
        continue;
      }

      const quote = source[index];
      if (quote === '"' || quote === "'") {
        result += token("string", quote);
        index += 1;
        let literalStart = index;
        while (index < source.length) {
          if (source[index] === quote && !isEscapedAt(source, index)) {
            if (literalStart < index) result += token("string", source.slice(literalStart, index));
            result += token("string", quote);
            index += 1;
            break;
          }
          if (interpolationAt(index)) {
            if (literalStart < index) result += token("string", source.slice(literalStart, index));
            appendInterpolation();
            literalStart = index;
            continue;
          }
          index += 1;
        }
        if (literalStart < index && source[index - 1] !== quote) {
          result += token("string", source.slice(literalStart, index));
        }
        continue;
      }

      const valueStart = index;
      while (
        index < source.length &&
        !/\s|>/u.test(source[index]!) &&
        source.slice(index, index + 2) !== "/>" &&
        !interpolationAt(index)
      ) {
        index += 1;
      }
      if (valueStart < index) result += token("string", source.slice(valueStart, index));
    }
  }
  return result;
};

const highlightHtml = (source: string, embeddedLanguage?: HighlightLanguage): string =>
  highlightMarkup(source, embeddedLanguage);

const highlightHtmlTemplate = (
  source: string,
  start: number,
  language: HighlightLanguage,
): { readonly highlighted: string; readonly end: number } => {
  let end = start + 1;
  while (end < source.length) {
    if (source[end] === "`" && !isEscapedAt(source, end)) break;
    if (source.slice(end, end + 2) === "${" && !isEscapedAt(source, end)) {
      end = readInterpolationEnd(source, end + 2);
    } else {
      end += 1;
    }
  }
  const closed = end < source.length;
  return {
    highlighted:
      token("template-punctuation", "`") +
      highlightHtml(source.slice(start + 1, end), language) +
      (closed ? token("template-punctuation", "`") : ""),
    end: closed ? end + 1 : end,
  };
};

const highlightSvelte = (source: string): string => {
  let result = "";
  let index = 0;
  const lowerSource = source.toLowerCase();

  while (index < source.length) {
    const specialElement = /^<(script|style)\b/iu.exec(source.slice(index));
    if (specialElement === null) {
      const next = source.slice(index).search(/<(?:script|style)\b/iu);
      const end = next === -1 ? source.length : index + next;
      result += highlightMarkup(source.slice(index, end), "ts", "braces", true);
      index = end;
      continue;
    }

    const element = specialElement[1]!.toLowerCase();
    const openingEnd = readMarkupTagEnd(source, index);
    const closing = `</${element}>`;
    const contentEnd = lowerSource.indexOf(closing, openingEnd);
    result += highlightMarkup(source.slice(index, openingEnd), "ts", "braces", true);
    if (contentEnd === -1) {
      result +=
        element === "style"
          ? highlightCss(source.slice(openingEnd))
          : highlightGeneric("js", source.slice(openingEnd));
      return result;
    }

    const content = source.slice(openingEnd, contentEnd);
    if (element === "style") {
      result += highlightCss(content);
    } else {
      const lang = /\blang\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/iu.exec(
        source.slice(index, openingEnd),
      );
      const scriptLanguage = normalizeLanguage(lang?.[1] ?? lang?.[2]);
      result += highlightGeneric(isScriptLanguage(scriptLanguage) ? scriptLanguage : "js", content);
    }
    result += highlightMarkup(source.slice(contentEnd, contentEnd + closing.length), "ts", "braces", true);
    index = contentEnd + closing.length;
  }
  return result;
};

const highlightCss = (source: string): string => {
  let result = "";
  let index = 0;
  let inBlock = false;
  while (index < source.length) {
    if (!inBlock && (index === 0 || source[index - 1] === "}" || source[index - 1] === "\n")) {
      const brace = source.indexOf("{", index);
      const newline = source.indexOf("\n", index);
      if (brace !== -1 && (newline === -1 || brace < newline)) {
        const selector = source.slice(index, brace).trim();
        const leading = source.slice(index, index + source.slice(index, brace).indexOf(selector));
        result += htmlEscape(leading);
        result += token("selector", selector);
        result += token("punctuation", "{");
        index = brace + 1;
        inBlock = true;
        continue;
      }
    }
    if (source[index] === "}") inBlock = false;
    if (source.slice(index, index + 2) === "/*") {
      const end = readBlockComment(source, index);
      result += token("comment", source.slice(index, end));
      index = end;
      continue;
    }
    if (source[index] === '"' || source[index] === "'") {
      const end = readQuoted(source, index, source[index]!);
      result += token("string", source.slice(index, end));
      index = end;
      continue;
    }
    if (/[0-9]/u.test(source[index]!)) {
      const match = /^(?:\d[\d.]*|#[\da-f]+)/iu.exec(source.slice(index));
      if (match !== null) {
        result += token("number", match[0]);
        index += match[0].length;
        continue;
      }
    }
    if (source[index] === "}") {
      result += token("punctuation", "}");
      index += 1;
      continue;
    }
    if (/[;:,()[\]]/u.test(source[index]!)) {
      result += token("punctuation", source[index]!);
      index += 1;
      continue;
    }
    if (/[=]/u.test(source[index]!)) {
      result += token("operator", source[index]!);
      index += 1;
      continue;
    }
    result += htmlEscape(source[index]!);
    index += 1;
  }
  return result;
};

/** Normalize fence language labels to the stable classes emitted by the site. */
export const normalizeLanguage = (language: string | undefined): HighlightLanguage => {
  const normalized = (language ?? "text")
    .trim()
    .toLowerCase()
    .replace(/^language-/u, "");
  return aliases[normalized] ?? "text";
};

/** Highlight source into escaped HTML spans. Unknown languages remain plain text. */
export const highlightCode = (language: string | undefined, source: string): string => {
  const normalized = normalizeLanguage(language);
  switch (normalized) {
    case "html":
      return highlightHtml(source);
    case "svelte":
      return highlightSvelte(source);
    case "css":
      return highlightCss(source);
    case "text":
      return htmlEscape(source);
    default:
      return highlightGeneric(normalized, source);
  }
};
