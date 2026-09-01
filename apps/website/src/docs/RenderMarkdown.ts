import type { SymbolDocumentation } from "./Model.js";
import { renderFxMarble } from "./FxMarble.js";
import { highlightCode, normalizeLanguage } from "./SyntaxHighlight.js";
import { HtmlRenderEvent } from "@typed/template";
import { Marked, Renderer } from "marked";
import { siteHref } from "../SiteHref.js";

export interface MarkdownRenderOptions {
  /** Exact, unambiguous Typed symbol names to their generated declaration ids. */
  readonly typedSymbolIds?: Readonly<Record<string, string>>;
}

const webPlatformApiUrls: Readonly<Record<string, string>> = {
  DocumentFragment: "https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment",
  Element: "https://developer.mozilla.org/en-US/docs/Web/API/Element",
  EventTarget: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget",
  HTMLElement: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement",
  Node: "https://developer.mozilla.org/en-US/docs/Web/API/Node",
  ParentNode: "https://developer.mozilla.org/en-US/docs/Web/API/ParentNode",
};

const defaultTypedSymbolIds: Readonly<Record<string, string>> = {
  Wire: "@typed/template#Wire",
};

const htmlAttribute = (value: string): string =>
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

const htmlText = (value: string): string => htmlAttribute(value);

const ownValue = <A>(record: Readonly<Record<string, A>>, key: string): A | undefined =>
  Object.hasOwn(record, key) ? record[key] : undefined;

const inlineCodeLink = (
  value: string,
  options: MarkdownRenderOptions | undefined,
): string | undefined => {
  const external = ownValue(webPlatformApiUrls, value);
  if (external !== undefined) {
    return `<code class="inline-code-link"><a href="${htmlAttribute(external)}" rel="external">${htmlText(value)}</a></code>`;
  }
  const typedId =
    (options?.typedSymbolIds === undefined ? undefined : ownValue(options.typedSymbolIds, value)) ??
    ownValue(defaultTypedSymbolIds, value);
  return typedId === undefined
    ? undefined
    : `<code class="inline-code-link"><a href="${htmlAttribute(siteHref(`/reference/${encodeURIComponent(typedId)}`))}">${htmlText(value)}</a></code>`;
};

const baseHeadingId = (value: string): string =>
  value
    .toLocaleLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const headingId = (value: string, prefix?: string): string => {
  const heading = baseHeadingId(value);
  const scope = prefix === undefined ? "" : baseHeadingId(prefix);
  return scope === "" ? heading : `${scope}-${heading}`;
};

const markdownFor = (prefix?: string, options?: MarkdownRenderOptions): Marked => {
  const renderer = new Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const content = this.parser.parseInline(tokens);
    return `<h${depth} id="${headingId(content, prefix)}">${content}</h${depth}>\n`;
  };
  renderer.code = ({ text, lang }) => {
    if (lang?.trim().toLowerCase() === "fx-marble") {
      const diagram = renderFxMarble(text);
      if (diagram !== undefined) return `${diagram}\n`;
    }
    const language = normalizeLanguage(lang);
    return `<pre class="code-block code-block--${language}"><code class="language-${language}">${highlightCode(language, text)}</code></pre>\n`;
  };
  renderer.codespan = ({ text }) =>
    inlineCodeLink(text, options) ?? `<code>${htmlText(text)}</code>`;
  return new Marked({ gfm: true, renderer });
};

export const renderGuideMarkdown = (
  markdown: string,
  prefix?: string,
  options?: MarkdownRenderOptions,
) => HtmlRenderEvent(markdownFor(prefix, options).parse(markdown, { async: false }), true);

const renderExample = (language: string, code: string): string => {
  const normalized = code.trim();
  return /^```/mu.test(normalized) ? normalized : `\`\`\`${language}\n${normalized}\n\`\`\``;
};

export const validateMarkdownFences = (markdown: string): ReadonlyArray<string> => {
  const errors: Array<string> = [];
  let fence: { readonly marker: "```" | "~~~"; readonly line: number } | undefined;
  for (const [index, line] of markdown.split("\n").entries()) {
    const match = /^\s*(```|~~~)/u.exec(line);
    if (match === null) continue;
    const marker = match[1] as "```" | "~~~";
    if (fence === undefined) fence = { marker, line: index + 1 };
    else if (marker === fence.marker) {
      if (line.slice(match[0].length).trim() !== "") {
        errors.push(`Nested ${marker} fence at line ${index + 1}`);
      } else {
        fence = undefined;
      }
    }
  }
  if (fence !== undefined)
    errors.push(`Unclosed ${fence.marker} fence opened at line ${fence.line}`);
  return errors;
};

export const renderSymbolBodyMarkdown = (symbol: SymbolDocumentation): string => {
  const sections = Object.entries(symbol.sections)
    .map(([heading, body]) => `## ${heading}\n\n${body}`)
    .join("\n\n");
  const signatures = symbol.signatures
    .map((signature) => `\`\`\`ts\n${signature}\n\`\`\``)
    .join("\n\n");
  const examples = symbol.examples
    .map((example) => renderExample(example.language, example.code))
    .join("\n\n");
  return `## Signatures\n\n${signatures}\n\n${sections}${examples ? `\n\n## Examples\n\n${examples}` : ""}\n`;
};

export const renderSymbolMarkdown = (symbol: SymbolDocumentation): string =>
  `# ${symbol.exportName}\n\n${symbol.summary}\n\n${renderSymbolBodyMarkdown(symbol)}`;
