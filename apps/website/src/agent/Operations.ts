import { Effect } from "effect";
import { documentationModel } from "../docs/Content.js";
import { loadExposure } from "../docs/LoadReference.js";
import { searchDocumentation } from "../docs/Search.js";

export const operations = {
  async search(query: string, limit = 10) {
    const { searchArtifact } = await import("../generated/search.js");
    return {
      query,
      results: searchDocumentation(searchArtifact, query, Math.min(Math.max(limit, 1), 50)),
      repositoryRevision: documentationModel.repositoryRevision,
    };
  },
  async symbol(id: string, basePath = "/") {
    return Effect.runPromise(loadExposure(id, basePath)).catch(() => undefined);
  },
  guide(slug: string) {
    return documentationModel.guides.find((guide) => guide.slug === slug);
  },
  glossary(idOrAlias: string) {
    const normalized = idOrAlias.toLocaleLowerCase();
    return documentationModel.glossary.find(
      (entry) =>
        entry.id === normalized ||
        entry.term.toLocaleLowerCase() === normalized ||
        entry.aliases.some((alias) => alias.toLocaleLowerCase() === normalized),
    );
  },
} as const;
