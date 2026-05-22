import { ModuleSource } from "./moduleSource.js";

export class TypeModuleSource extends ModuleSource {}

export function typeUnion(types: readonly string[]): string {
  return types.length === 0 ? "never" : types.join("\n  | ");
}

export function typeTuple(types: readonly string[]): string {
  return types.length === 0 ? "readonly []" : `readonly [\n  ${types.join(",\n  ")},\n]`;
}

export function dependencyLayerType(
  source: TypeModuleSource,
  entries: readonly string[],
  layerAlias = "Layer",
): string {
  if (entries.length === 0) return `${layerAlias}.Layer<never, never, never>`;
  source.add(`type DependencyInput = ${typeUnion(entries)};`);
  source.helper(
    "DependencyLayerValue",
    "type DependencyLayerValue<T> = T extends readonly (infer Value)[] ? Value : T;",
  );
  source.helper(
    "DependencyLayer",
    `type DependencyLayer<T> = DependencyLayerValue<T> extends infer Value
  ? Value extends ${layerAlias}.Layer<any, any, any>
    ? Value
    : never
  : never;`,
  );
  return `${layerAlias}.Layer<
  ${layerAlias}.Success<DependencyLayer<DependencyInput>>,
  ${layerAlias}.Error<DependencyLayer<DependencyInput>>,
  ${layerAlias}.Services<DependencyLayer<DependencyInput>>
>`;
}
