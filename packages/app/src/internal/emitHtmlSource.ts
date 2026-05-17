const DEFAULT_OUTLET = "<!--typed-ssr-outlet-->";

export interface EmitHtmlSourceInput {
  readonly sourcePath: string;
  readonly outlet?: string;
}

export function emitHtmlSource(input: EmitHtmlSourceInput): string {
  const outlet = input.outlet ?? DEFAULT_OUTLET;
  return [
    "// @ts-nocheck",
    'import { readFile } from "node:fs/promises";',
    'import * as TypedConfigModule from "typed:config";',
    `const sourceHtmlPath = ${JSON.stringify(input.sourcePath)};`,
    "const typedConfig = TypedConfigModule;",
    "const typedBuildConfig = typedConfig.build ?? {};",
    "const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);",
    `const outlet = ${JSON.stringify(outlet)};`,
    "export const html = sourceHtmlPath;",
    clientBuildPathSource(),
    loadHtmlSource(),
    renderHtmlSource(),
  ].join("\n");
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

function loadHtmlSource(): string {
  return [
    "export async function loadHtml(options = {}) {",
    "  const read = options.readFile ?? readFile;",
    "  if (options.dev && options.devServer) {",
    "    const source = await read(sourceHtmlPath, \"utf8\");",
    "    return options.devServer.transformIndexHtml(options.url ?? \"/\", source);",
    "  }",
    "  return read(builtHtmlPath, \"utf8\");",
    "}",
  ].join("\n");
}

function clientBuildPathSource(): string {
  return [
    "function joinClientBuildPath(sourcePath) {",
    "  const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? \"dist\", \"client\");",
    "  return joinPath(clientOutDir, sourcePath.replace(/^\\.\\//, \"\"));",
    "}",
    "function joinPath(...parts) {",
    "  return parts.flatMap((part) => part.split(\"/\")).filter(Boolean).join(\"/\");",
    "}",
  ].join("\n");
}

function renderHtmlSource(): string {
  return [
    "export function renderHtml(template, markup) {",
    "  if (template.includes(outlet)) return template.replace(outlet, markup);",
    "  const bodyMatch = /<body\\b[^>]*>/i.exec(template);",
    "  if (!bodyMatch) return `${template}${markup}`;",
    "  const insertAt = bodyMatch.index + bodyMatch[0].length;",
    "  return `${template.slice(0, insertAt)}${markup}${template.slice(insertAt)}`;",
    "}",
  ].join("\n");
}
