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

function joinSections(sections: readonly (readonly string[])[]): string {
  return sections
    .map((section) => section.join("\n"))
    .filter((section) => section.trim().length > 0)
    .join("\n\n");
}
