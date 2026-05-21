export class TypeModuleSource {
  readonly #imports: string[] = [];
  readonly #helpers = new Map<string, string>();
  readonly #body: string[] = [];

  importTypeNamespace(alias: string, moduleSpecifier: string): void {
    this.#imports.push(`import type * as ${alias} from ${JSON.stringify(moduleSpecifier)};`);
  }

  importLine(source: string): void {
    this.#imports.push(source);
  }

  helper(name: string, source: string): string {
    if (!this.#helpers.has(name)) {
      this.#helpers.set(name, source);
    }
    return name;
  }

  add(source: string): void {
    if (source.trim().length > 0) {
      this.#body.push(source);
    }
  }

  emit(): string {
    return joinSections([this.#imports, [...this.#helpers.values()], this.#body]);
  }
}

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

function joinSections(sections: readonly (readonly string[])[]): string {
  return sections
    .map((section) => section.join("\n"))
    .filter((section) => section.trim().length > 0)
    .join("\n\n");
}
