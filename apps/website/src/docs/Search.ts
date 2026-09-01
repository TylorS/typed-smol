import type { DocumentationModel, ReferenceInventory } from "./Model.js";

export type SearchEntryKind = "package" | "module" | "exposure" | "resource" | "guide" | "glossary";

export interface SearchEntry {
  readonly id: string;
  readonly canonicalId?: string;
  readonly declarationKey?: string;
  readonly title: string;
  readonly kind: SearchEntryKind;
  readonly text: string;
  readonly href: string;
  readonly specifier?: string;
}

export const canonicalExposureIds = (inventory: ReferenceInventory): ReadonlyMap<string, string> =>
  new Map(
    [
      ...Map.groupBy(
        inventory.exposures.filter(
          (
            exposure,
          ): exposure is Extract<
            ReferenceInventory["exposures"][number],
            { readonly recordKind: "declaration" }
          > => exposure.recordKind === "declaration",
        ),
        (exposure) => exposure.declarationKey,
      ),
    ].map(([declarationKey, exposures]) => {
      const candidates = exposures.some(({ isAlias }) => !isAlias)
        ? exposures.filter(({ isAlias }) => !isAlias)
        : exposures;
      return [
        declarationKey,
        candidates.toSorted(
          (left, right) => left.id.length - right.id.length || left.id.localeCompare(right.id),
        )[0]!.id,
      ];
    }),
  );

export interface SearchResult extends SearchEntry {
  readonly score: number;
}

export interface SearchArtifact {
  readonly schemaVersion: 1;
  readonly entries: ReadonlyArray<SearchEntry>;
  readonly prefixes: Readonly<Record<string, ReadonlyArray<number>>>;
  readonly trigrams: Readonly<Record<string, ReadonlyArray<number>>>;
}

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9@]+/g, " ")
    .trim();

const distance = (left: string, right: string): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from<number>({ length: right.length + 1 });

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1]! + 1,
        previous[rightIndex]! + 1,
        previous[rightIndex - 1]! + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length]!;
};

const similarity = (left: string, right: string): number => {
  if (left === right) return 1;
  if (left.startsWith(right) || right.startsWith(left)) {
    const lengthRatio = Math.min(left.length, right.length) / Math.max(left.length, right.length);
    return 0.75 + lengthRatio * 0.25;
  }
  return 1 - distance(left, right) / Math.max(left.length, right.length);
};

const fuzzyScore = (
  queryTokens: ReadonlyArray<string>,
  candidateTokens: ReadonlyArray<string>,
): number | undefined => {
  let score = 0;
  for (const queryToken of queryTokens) {
    const best = candidateTokens.reduce(
      (highest, candidate) => Math.max(highest, similarity(queryToken, candidate)),
      0,
    );
    if (best < 0.65) return undefined;
    score += best * 25;
  }
  return score;
};

export const buildSearchIndex = (
  model: DocumentationModel,
  inventory?: ReferenceInventory,
): ReadonlyArray<SearchEntry> => {
  const editorial: ReadonlyArray<SearchEntry> = [
    ...model.guides.map((guide) => ({
      id: `guide:${guide.slug}`,
      title: guide.title,
      kind: "guide" as const,
      href: `/explore/${guide.slug}`,
      text: [guide.title, guide.summary, ...guide.headings].join(" "),
    })),
    ...model.glossary.map((entry) => ({
      id: `glossary:${entry.id}`,
      title: entry.term,
      kind: "glossary" as const,
      href: `/glossary#${entry.id}`,
      text: [entry.term, ...entry.aliases, entry.definition].join(" "),
    })),
  ];
  if (inventory === undefined) {
    return [
      ...editorial,
      ...model.symbols.map((symbol) => ({
        id: symbol.id,
        title: symbol.exportName,
        kind: (symbol.kind === "resource" ? "resource" : "exposure") as SearchEntryKind,
        href: `/reference/${encodeURIComponent(symbol.id)}`,
        text: [symbol.id, symbol.exportName, symbol.summary, symbol.category ?? ""].join(" "),
      })),
    ];
  }
  const declarations = new Map(
    inventory.declarations.map((declaration) => [declaration.declarationKey, declaration]),
  );
  const canonicalByDeclaration = canonicalExposureIds(inventory);
  return [
    ...editorial,
    ...inventory.packages.map((pkg) => ({
      id: `package:${pkg.packageName}`,
      title: pkg.packageName,
      kind: "package" as const,
      href: `/reference/packages/${encodeURIComponent(pkg.packageName)}`,
      text: `${pkg.packageName} ${pkg.packageVersion}`,
    })),
    ...inventory.modules.map((module) => ({
      id: `module:${module.consumerSpecifier}`,
      title: module.consumerSpecifier,
      kind: "module" as const,
      href: `/reference/modules/${encodeURIComponent(module.consumerSpecifier)}`,
      text: [
        module.consumerSpecifier,
        module.packageName,
        module.exportSubpath,
        ...module.categories.map(({ name }) => name),
      ].join(" "),
    })),
    ...inventory.exposures.map((exposure) => {
      const declaration =
        exposure.recordKind === "declaration"
          ? declarations.get(exposure.declarationKey)
          : undefined;
      return {
        id: exposure.id,
        canonicalId:
          exposure.recordKind === "resource"
            ? exposure.id
            : canonicalByDeclaration.get(exposure.declarationKey),
        declarationKey: exposure.recordKind === "declaration" ? exposure.declarationKey : undefined,
        title: exposure.qualifiedName,
        kind: exposure.recordKind === "resource" ? ("resource" as const) : ("exposure" as const),
        href: `/reference/${encodeURIComponent(exposure.id)}`,
        specifier: exposure.consumerSpecifier,
        text: [
          exposure.id,
          exposure.packageName,
          exposure.consumerSpecifier,
          exposure.exportName,
          exposure.qualifiedName,
          exposure.family,
          ...exposure.aliases,
          declaration?.name ?? "",
          declaration?.summary ?? "",
          declaration?.category ?? "",
          declaration?.since ?? "",
          declaration?.stability ?? "",
        ].join(" "),
      };
    }),
  ];
};

const grams = (token: string): ReadonlyArray<string> => {
  const padded = `  ${token}  `;
  return token.length < 3
    ? [token]
    : [
        ...new Set(
          Array.from({ length: padded.length - 2 }, (_, index) => padded.slice(index, index + 3)),
        ),
      ];
};

const addPosting = (index: Map<string, Set<number>>, key: string, entry: number): void => {
  const existing = index.get(key);
  if (existing === undefined) index.set(key, new Set([entry]));
  else existing.add(entry);
};

const postings = (
  index: Map<string, Set<number>>,
): Readonly<Record<string, ReadonlyArray<number>>> =>
  Object.fromEntries(
    [...index]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, values]) => [key, [...values].sort((left, right) => left - right)]),
  );

/** Precomputes bounded candidate indexes so consumers never scan the full corpus per query. */
export const buildSearchArtifact = (
  model: DocumentationModel,
  inventory?: ReferenceInventory,
): SearchArtifact => {
  const entries = buildSearchIndex(model, inventory);
  const prefixes = new Map<string, Set<number>>();
  const trigrams = new Map<string, Set<number>>();
  entries.forEach((entry, entryIndex) => {
    const titleTokens = [
      ...new Set(normalize(`${entry.id} ${entry.title}`).split(" ").filter(Boolean)),
    ];
    const tokens = [
      ...new Set([...titleTokens, ...normalize(entry.text).split(" ").filter(Boolean)]),
    ];
    for (const token of tokens) {
      for (let length = 1; length <= Math.min(token.length, 8); length++) {
        addPosting(prefixes, token.slice(0, length), entryIndex);
      }
    }
    for (const token of titleTokens)
      for (const gram of grams(token)) addPosting(trigrams, gram, entryIndex);
  });
  return { schemaVersion: 1, entries, prefixes: postings(prefixes), trigrams: postings(trigrams) };
};

const candidatesFor = (
  artifact: SearchArtifact,
  tokens: ReadonlyArray<string>,
): ReadonlyArray<SearchEntry> => {
  const candidates = new Set<number>();
  for (const token of tokens) {
    for (const index of artifact.prefixes[token] ?? []) candidates.add(index);
    for (const gram of grams(token)) {
      for (const index of artifact.trigrams[gram] ?? []) candidates.add(index);
    }
  }
  return [...candidates]
    .sort((left, right) => left - right)
    .flatMap((index) => {
      const entry = artifact.entries[index];
      return entry === undefined ? [] : [entry];
    });
};

export const searchDocumentation = (
  index: ReadonlyArray<SearchEntry> | SearchArtifact,
  query: string,
  limit = 20,
): ReadonlyArray<SearchResult> => {
  const normalized = normalize(query);
  if (!normalized) return [];
  const tokens = normalized.split(" ");
  const entries = Array.isArray(index) ? index : candidatesFor(index as SearchArtifact, tokens);
  const ranked = entries
    .flatMap((entry): ReadonlyArray<SearchResult> => {
      const title = normalize(entry.title);
      const text = normalize(entry.text);
      const candidateTokens = [...new Set(`${title} ${text}`.split(" "))];
      const fuzzy = fuzzyScore(tokens, candidateTokens);
      if (fuzzy === undefined) return [];
      let score =
        fuzzy + tokens.reduce((sum, token) => sum + (title.startsWith(token) ? 20 : 1), 0);
      const titleFuzzy = fuzzyScore(tokens, title.split(" "));
      if (titleFuzzy !== undefined) {
        score +=
          titleFuzzy * 1.5 + (entry.kind === "exposure" || entry.kind === "resource" ? 5 : 0);
      }
      if (title === normalized)
        score += 100 + (entry.kind === "exposure" || entry.kind === "resource" ? 10 : 0);
      if (text.includes(normalized)) score += 40;
      if (entry.kind === "guide") score += 2;
      else if (entry.kind === "glossary") score += 1;
      return [{ ...entry, score }];
    })
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  const exactIds = new Set(
    ranked
      .filter((entry) => {
        const exactQuery = query.trim();
        if (entry.id === exactQuery || entry.specifier === exactQuery) return true;
        if (entry.kind === "package") return entry.id.slice("package:".length) === exactQuery;
        if (entry.kind === "module") return entry.id.slice("module:".length) === exactQuery;
        return false;
      })
      .map(({ id }) => id),
  );
  const exactCanonicalIds = new Set(
    ranked
      .filter(({ id }) => exactIds.has(id))
      .flatMap(({ canonicalId }) => (canonicalId === undefined ? [] : [canonicalId])),
  );
  const entriesById = new Map(
    (Array.isArray(index) ? index : (index as SearchArtifact).entries).map((entry) => [
      entry.id,
      entry,
    ]),
  );
  const grouped = new Map<string, SearchResult>();
  for (const result of ranked) {
    const isExact = exactIds.has(result.id);
    if (!isExact && result.canonicalId !== undefined && exactCanonicalIds.has(result.canonicalId)) {
      continue;
    }
    const key = isExact ? `exact:${result.id}` : (result.canonicalId ?? result.id);
    if (grouped.has(key)) continue;
    const preferred =
      isExact || result.canonicalId === undefined
        ? result
        : (entriesById.get(result.canonicalId) ?? result);
    grouped.set(key, { ...preferred, score: result.score });
  }
  return [...grouped.values()]
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
};
