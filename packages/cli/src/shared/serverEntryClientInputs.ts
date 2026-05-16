import { readFileSync } from "node:fs";
import { dirname } from "node:path";

export interface ClientHtmlEntry {
  readonly name: string;
  readonly html: string;
}

export interface InferredClientHtmlEntries {
  readonly root: string;
  readonly entries: readonly ClientHtmlEntry[];
}

export function inferClientHtmlEntries(entry: string): InferredClientHtmlEntries {
  const root = dirname(entry);
  const source = readFileSync(entry, "utf8");
  return { root, entries: uniqueEntries(extractTypedServerIds(source).flatMap(parseEntries)) };
}

function extractTypedServerIds(source: string): string[] {
  const ids: string[] = [];
  const stringLiteral = /(["'`])([^"'`]*typed:server\?[^"'`]*)\1/g;
  for (const match of source.matchAll(stringLiteral)) ids.push(match[2]);
  return ids;
}

function parseEntries(id: string): ClientHtmlEntry[] {
  const queryStart = id.indexOf("?");
  if (queryStart < 0) return [];
  const params = new URLSearchParams(id.slice(queryStart + 1));
  const pages = params.getAll("page").map(parsePageEntry).filter(isEntry);
  const html = params.get("html");
  return pages.length > 0 || !html ? pages : [{ name: params.get("name") ?? "default", html }];
}

function parsePageEntry(value: string): ClientHtmlEntry | undefined {
  const [name, html, client, ...rest] = value.split(":");
  if (!name || !html || !client || rest.length > 0) return undefined;
  return { name, html };
}

function isEntry(value: ClientHtmlEntry | undefined): value is ClientHtmlEntry {
  return value !== undefined;
}

function uniqueEntries(entries: readonly ClientHtmlEntry[]): readonly ClientHtmlEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.name}\0${entry.html}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
