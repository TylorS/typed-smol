import {
  mustEmitAllExports,
  requestsAnyExport,
  requestsExport,
  type VirtualModuleBuildContext,
} from "@typed/virtual-modules";

const DEFAULT_OUTLET = "<!--typed-ssr-outlet-->";
const RUNTIME_EXPORTS = ["loadHtml", "renderHtml"] as const;
const HTML_EXPORTS = ["html", ...RUNTIME_EXPORTS] as const;

export interface EmitHtmlSourceInput {
  readonly sourcePath: string;
  readonly clientPath?: string;
  readonly outlet?: string;
  readonly context?: VirtualModuleBuildContext;
}

export function emitHtmlSource(input: EmitHtmlSourceInput): string {
  if (!requestsAnyExport(input.context, HTML_EXPORTS)) return "export {};";
  if (mustEmitAllExports(input.context)) return fullHtmlSource(input);
  return prunedHtmlSource(input, input.context);
}

function fullHtmlSource(input: EmitHtmlSourceInput): string {
  const outlet = input.outlet ?? DEFAULT_OUTLET;
  return [
    'import { readFile } from "node:fs/promises";',
    'import * as TypedConfigModule from "typed:config";',
    "interface LoadHtmlOptions {",
    '  readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;',
    "  readonly dev?: boolean;",
    "  readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };",
    "  readonly url?: string;",
    "}",
    "type TypedConfigBuildOptions = {",
    "  readonly build?: {",
    "    readonly outDir?: string;",
    "    readonly clientOutDir?: string;",
    "  };",
    "};",
    `const sourceHtmlPath = ${JSON.stringify(input.sourcePath)};`,
    `const clientHtmlPath = ${JSON.stringify(input.clientPath ?? input.sourcePath)};`,
    "const typedConfig = TypedConfigModule as TypedConfigBuildOptions;",
    "const typedBuildConfig = typedConfig.build ?? {};",
    "const builtHtmlPath = joinClientBuildPath(clientHtmlPath);",
    `const outlet = ${JSON.stringify(outlet)};`,
    "export const html = sourceHtmlPath;",
    clientBuildPathSource(),
    loadHtmlSource(),
    renderHtmlSource(),
  ].join("\n");
}

function prunedHtmlSource(
  input: EmitHtmlSourceInput,
  context: VirtualModuleBuildContext,
): string {
  const needsHtml = requestsExport(context, "html");
  const needsLoadHtml = requestsExport(context, "loadHtml");
  const needsRenderHtml = requestsExport(context, "renderHtml");
  const outlet = input.outlet ?? DEFAULT_OUTLET;
  return [
    ...(needsLoadHtml ? loadHtmlImportsAndTypes() : []),
    ...(needsLoadHtml ? loadHtmlPathState(input) : []),
    needsRenderHtml ? `const outlet = ${JSON.stringify(outlet)};` : "",
    needsHtml ? htmlExportSource(input.sourcePath, needsLoadHtml) : "",
    needsLoadHtml ? clientBuildPathSource() : "",
    needsLoadHtml ? loadHtmlSource() : "",
    needsRenderHtml ? renderHtmlSource() : "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

export function applySsrOutlet(
  template: string,
  markup: string,
  outlet: string = DEFAULT_OUTLET,
): string {
  if (template.includes(outlet)) return template.replace(outlet, markup);
  const bodyMatch = /<body\b[^>]*>/i.exec(template);
  if (!bodyMatch) return `${template}${markup}`;
  const insertAt = bodyMatch.index + bodyMatch[0].length;
  return `${template.slice(0, insertAt)}${markup}${template.slice(insertAt)}`;
}

export function normalizeClientHtmlPath(sourcePath: string): string {
  return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");
}

function loadHtmlSource(): string {
  return [
    "export async function loadHtml(options: LoadHtmlOptions = {}) {",
    "  const read = options.readFile ?? readFile;",
    "  if (options.dev) {",
    '    const source = await read(sourceHtmlPath, "utf8");',
    '    return options.devServer ? options.devServer.transformIndexHtml(options.url ?? "/", source) : source;',
    "  }",
    '  return read(builtHtmlPath, "utf8");',
    "}",
  ].join("\n");
}

function htmlSource(value: string): string {
  return `export const html = ${JSON.stringify(value)};`;
}

function htmlExportSource(sourcePath: string, usesSourceConst: boolean): string {
  return usesSourceConst ? "export const html = sourceHtmlPath;" : htmlSource(sourcePath);
}

function loadHtmlImportsAndTypes(): readonly string[] {
  return [
    'import { readFile } from "node:fs/promises";',
    'import * as TypedConfigModule from "typed:config";',
    "interface LoadHtmlOptions {",
    '  readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;',
    "  readonly dev?: boolean;",
    "  readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };",
    "  readonly url?: string;",
    "}",
    "type TypedConfigBuildOptions = {",
    "  readonly build?: {",
    "    readonly outDir?: string;",
    "    readonly clientOutDir?: string;",
    "  };",
    "};",
  ];
}

function loadHtmlPathState(input: EmitHtmlSourceInput): readonly string[] {
  return [
    `const sourceHtmlPath = ${JSON.stringify(input.sourcePath)};`,
    `const clientHtmlPath = ${JSON.stringify(input.clientPath ?? input.sourcePath)};`,
    "const typedConfig = TypedConfigModule as TypedConfigBuildOptions;",
    "const typedBuildConfig = typedConfig.build ?? {};",
    "const builtHtmlPath = joinClientBuildPath(clientHtmlPath);",
  ];
}

function clientBuildPathSource(): string {
  return [
    "function joinClientBuildPath(sourcePath: string): string {",
    '  const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? "dist", "client");',
    "  return joinPath(clientOutDir, normalizeClientHtmlPath(sourcePath));",
    "}",
    "function normalizeClientHtmlPath(sourcePath: string): string {",
    '  return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");',
    "}",
    "function isClientHtmlPathSegment(segment: string): boolean {",
    '  return segment !== "" && segment !== "." && segment !== "..";',
    "}",
    "function joinPath(...parts: readonly string[]): string {",
    '  return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");',
    "}",
  ].join("\n");
}

function isClientHtmlPathSegment(segment: string): boolean {
  return segment !== "" && segment !== "." && segment !== "..";
}

function renderHtmlSource(): string {
  return [
    "export function renderHtml(template: string, markup: string): string {",
    "  if (template.includes(outlet)) return template.replace(outlet, markup);",
    "  const bodyMatch = /<body\\b[^>]*>/i.exec(template);",
    "  if (!bodyMatch) return `${template}${markup}`;",
    "  const insertAt = bodyMatch.index + bodyMatch[0].length;",
    "  return `${template.slice(0, insertAt)}${markup}${template.slice(insertAt)}`;",
    "}",
  ].join("\n");
}
