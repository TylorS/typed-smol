export class ModuleSource {
  readonly #imports = new Map<string, string>();
  readonly #helpers = new Map<string, string>();
  readonly #body: string[] = [];

  importLine(source: string): void {
    if (source.trim().length > 0) {
      this.#imports.set(source, source);
    }
  }

  importNamespace(alias: string, moduleSpecifier: string): string {
    this.importLine(`import * as ${alias} from ${JSON.stringify(moduleSpecifier)};`);
    return alias;
  }

  importTypeNamespace(alias: string, moduleSpecifier: string): string {
    this.importLine(`import type * as ${alias} from ${JSON.stringify(moduleSpecifier)};`);
    return alias;
  }

  importNamed(specifier: string, moduleSpecifier: string): void {
    this.importLine(`import { ${specifier} } from ${JSON.stringify(moduleSpecifier)};`);
  }

  importTypeNamed(specifier: string, moduleSpecifier: string): void {
    this.importLine(`import type { ${specifier} } from ${JSON.stringify(moduleSpecifier)};`);
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
    return joinSections([this.#imports.values(), this.#helpers.values(), this.#body]);
  }
}

function joinSections(sections: readonly Iterable<string>[]): string {
  return sections
    .map((section) => [...section].join("\n"))
    .filter((section) => section.trim().length > 0)
    .join("\n\n");
}
