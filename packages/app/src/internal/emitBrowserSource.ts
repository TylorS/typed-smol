import type { TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";
import type { BrowserCompanionImport } from "./browserCompanions.js";

export interface EmitBrowserSourceInput {
  readonly parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>;
  readonly companions?: readonly BrowserCompanionImport[];
}

export function emitBrowserSource(input: EmitBrowserSourceInput): string {
  return [
    ...emitRouteImports(input.parsed.routes),
    ...emitCompanionImports(input.companions ?? []),
    emitRuntime(input.parsed, input.companions ?? []),
  ].join("\n");
}

function emitRouteImports(routes: readonly string[]): readonly string[] {
  return routes.map((target, index) => {
    return `import * as Routes${index} from "router:${target}";`;
  });
}

function emitCompanionImports(companions: readonly BrowserCompanionImport[]): readonly string[] {
  return companions.map((companion) => {
    return `import * as ${companion.binding} from ${JSON.stringify(companion.importPath)};`;
  });
}

function emitRuntime(
  parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>,
  companions: readonly BrowserCompanionImport[],
): string {
  const dependenciesCompanion = companions.find((companion) => companion.name === "dependencies");
  const companionLayers = dependenciesCompanion
    ? `${dependenciesCompanion.binding}.layers ?? []`
    : "[]";
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
