import type { DocumentationModel } from "./Model.js";

export const validateDocumentation = (model: DocumentationModel): ReadonlyArray<string> => {
  const errors: Array<string> = [];
  const targets = new Set([
    ...model.symbols.map(({ id }) => id),
    ...model.guides.map(({ slug }) => `guide:${slug}`),
    ...model.glossary.map(({ id }) => `glossary:${id}`),
  ]);

  for (const symbol of model.symbols) {
    for (const section of ["Why", "Ownership and lifetime"]) {
      if (!symbol.sections[section]?.trim()) errors.push(`${symbol.id} is missing ${section}`);
    }
    for (const example of symbol.examples) {
      if (!/^import\s.+\sfrom\s["']@typed\//m.test(example.code)) {
        errors.push(`${symbol.id} example must contain an exact public import`);
      }
    }
    for (const relation of symbol.relations) {
      const target =
        relation.kind === "symbol" ? relation.target : `${relation.kind}:${relation.target}`;
      if (!targets.has(target)) errors.push(`${symbol.id} has broken relation ${target}`);
    }
  }
  return errors;
};
