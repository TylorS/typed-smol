import type { TypedServerPage, TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";
import type { ServerCompanionImport } from "./serverCompanions.js";

export interface EmitServerSourceInput {
  readonly parsed: Extract<TypedVirtualModuleId, { readonly kind: "server" }>;
  readonly id: string;
  readonly companions?: readonly ServerCompanionImport[];
}

type OrderedImport =
  | { readonly kind: "api"; readonly index: number; readonly target: string }
  | { readonly kind: "routes"; readonly index: number; readonly target: string };

export function emitServerSource(input: EmitServerSourceInput): string {
  const imports = createOrderedImports(input.id);
  const pages = createPageEntries(input.parsed);
  return [
    ...emitImports(imports),
    ...emitHtmlImports(pages),
    ...emitCompanionImports(input.companions ?? []),
    emitConstants(imports, pages),
    emitExports(input.companions ?? []),
  ].join("\n");
}

function createOrderedImports(id: string): OrderedImport[] {
  const query = id.slice(id.indexOf("?") + 1);
  const counts = { api: 0, routes: 0 };
  const imports: OrderedImport[] = [];
  for (const [key, target] of new URLSearchParams(query)) {
    if (key !== "api" && key !== "routes") continue;
    imports.push({ kind: key, index: counts[key]++, target });
  }
  return imports;
}

function createPageEntries(
  parsed: Extract<TypedVirtualModuleId, { readonly kind: "server" }>,
): readonly TypedServerPage[] {
  if (parsed.pages.length > 0) return parsed.pages;
  if (!parsed.html) return [];
  return [{ name: parsed.name ?? "default", html: parsed.html, client: parsed.client ?? "" }];
}

function emitImports(imports: readonly OrderedImport[]): readonly string[] {
  return imports.map((entry) => {
    const moduleId = entry.kind === "api" ? `api:${entry.target}` : `router:${entry.target}`;
    const binding = entry.kind === "api" ? `Api${entry.index}` : `Routes${entry.index}`;
    return `import * as ${binding} from ${JSON.stringify(moduleId)};`;
  });
}

function emitHtmlImports(pages: readonly TypedServerPage[]): readonly string[] {
  return pages.map((page, index) => {
    return `import * as Html${index} from "typed:html?path=${page.html}";`;
  });
}

function emitCompanionImports(companions: readonly ServerCompanionImport[]): readonly string[] {
  return companions.map((companion) => {
    return `import * as ${companion.binding} from ${JSON.stringify(companion.importPath)};`;
  });
}

function emitConstants(
  imports: readonly OrderedImport[],
  pages: readonly TypedServerPage[],
): string {
  return [
    `const apiModules = [${imports.filter((i) => i.kind === "api").map((i) => `Api${i.index}`).join(", ")}];`,
    `const routeModules = [${imports.filter((i) => i.kind === "routes").map((i) => `Routes${i.index}`).join(", ")}];`,
    `const pageEntries = [${pages.map(pageEntrySource).join(", ")}];`,
  ].join("\n");
}

function pageEntrySource(page: TypedServerPage, index: number): string {
  return [
    "{",
    ` name: ${JSON.stringify(page.name)},`,
    ` html: Html${index},`,
    ` client: ${JSON.stringify(page.client)},`,
    "}",
  ].join("");
}

function emitExports(companions: readonly ServerCompanionImport[]): string {
  const pagesCompanion = companions.find((companion) => companion.name === "html");
  const dependenciesCompanion = companions.find((companion) => companion.name === "dependencies");
  const companionPages = pagesCompanion ? `${pagesCompanion.binding}.pages ?? []` : "[]";
  const companionLayers = dependenciesCompanion
    ? `${dependenciesCompanion.binding}.layers ?? []`
    : "[]";
  return [
    `const companionPages = ${companionPages};`,
    `const companionLayers = ${companionLayers};`,
    "export const ServerLayer = { apiModules, routeModules, pageEntries, companionPages, companionLayers };",
    "export const handler = { apiModules, routeModules, pageEntries, companionPages, companionLayers };",
    "export async function run(options = {}) {",
    "  return options.run ? options.run(handler) : handler;",
    "}",
  ].join("\n");
}
