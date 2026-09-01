import { searchDocumentation } from "../docs/Search.js";
import type { SearchArtifact, SearchResult } from "../docs/Search.js";

export type SearchArtifactLoader = () => Promise<SearchArtifact>;

export const createOnDemandSearch = (
  load: SearchArtifactLoader = async () =>
    import("../generated/search.js").then(({ searchArtifact }) => searchArtifact),
): ((query: string, limit?: number) => Promise<ReadonlyArray<SearchResult>>) => {
  let artifact: Promise<SearchArtifact> | undefined;

  return async (query, limit = 12) => {
    artifact ??= load().catch((error: unknown) => {
      artifact = undefined;
      throw error;
    });
    return searchDocumentation(await artifact, query, limit);
  };
};
