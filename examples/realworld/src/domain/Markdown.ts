import { micromark } from "micromark";

const dangerousElement = /<\/?(script|iframe|object|embed|img|svg|math)\b[^>]*>/gi;
const doubleQuotedJavascriptUrl = /\s+(href|src)\s*=\s*"javascript:[^"]*"/gi;
const singleQuotedJavascriptUrl = /\s+(href|src)\s*=\s*'javascript:[^']*'/gi;
const unquotedJavascriptUrl = /\s+(href|src)\s*=\s*javascript:[^\s>]+/gi;
const eventHandlerAttribute = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const javascriptProtocolText = /\bjavascript\s*:/gi;

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const stripUnsafeHtml = (html: string): string =>
  html
    .replace(dangerousElement, "")
    .replace(eventHandlerAttribute, "")
    .replace(doubleQuotedJavascriptUrl, ' $1=""')
    .replace(singleQuotedJavascriptUrl, ' $1=""')
    .replace(unquotedJavascriptUrl, ' $1=""');

export const renderMarkdown = (source: string): string => stripUnsafeHtml(micromark(source));

export const stripExecutableText = (source: string): string =>
  source.replace(javascriptProtocolText, "");

export const safeTextPreview = (source: string): string => escapeHtml(stripExecutableText(source));
