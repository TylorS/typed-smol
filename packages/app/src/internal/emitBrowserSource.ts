import type { TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";

export interface EmitBrowserSourceInput {
  readonly parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>;
  readonly companionImportPath?: "./_browser";
}

export function emitBrowserSource(input: EmitBrowserSourceInput): string {
  return [
    ...emitRouteImports(input.parsed.routes),
    ...emitCompanionImport(input.companionImportPath),
    emitRuntime(input.parsed, input.companionImportPath),
  ].join("\n");
}

function emitRouteImports(routes: readonly string[]): readonly string[] {
  return routes.map((target, index) => {
    return `import * as Routes${index} from "router:${target}";`;
  });
}

function emitCompanionImport(importPath: "./_browser" | undefined): readonly string[] {
  return importPath ? [`import * as BrowserCompanion from ${JSON.stringify(importPath)};`] : [];
}

function emitRuntime(
  parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>,
  companionImportPath: "./_browser" | undefined,
): string {
  const companionLayers = companionImportPath ? "BrowserCompanion.layers ?? []" : "[]";
  return [
    `const routeModules = [${parsed.routes.map((_, index) => `Routes${index}`).join(", ")}];`,
    `const companionLayers = ${companionLayers};`,
    "export const BrowserRuntime = {",
    "  routeModules,",
    `  root: ${JSON.stringify(parsed.root)},`,
    `  base: ${JSON.stringify(parsed.base)},`,
    `  mode: ${JSON.stringify(parsed.mode)},`,
    `  name: ${JSON.stringify(parsed.name)},`,
    "  companionLayers,",
    "};",
    "export function hydrate(options = {}) {",
    "  return options.hydrate ? options.hydrate(BrowserRuntime) : BrowserRuntime;",
    "}",
    "export async function run(options = {}) {",
    "  return options.run ? options.run(BrowserRuntime) : hydrate(options);",
    "}",
  ].join("\n");
}
