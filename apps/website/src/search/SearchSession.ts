import type { SearchResult } from "../docs/Search.js";

export type SearchState =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly query: string }
  | {
      readonly status: "results";
      readonly query: string;
      readonly matches: ReadonlyArray<SearchResult>;
    }
  | { readonly status: "error"; readonly query: string; readonly error: unknown };

export const createSearchSession = (
  search: (query: string) => Promise<ReadonlyArray<SearchResult>>,
  render: (state: SearchState) => void,
) => {
  let revision = 0;

  return {
    invalidate(): void {
      revision += 1;
    },
    async query(value: string): Promise<void> {
      const query = value.trim();
      const current = ++revision;
      if (query.length === 0) {
        render({ status: "idle" });
        return;
      }

      render({ status: "loading", query });
      try {
        const matches = await search(query);
        if (current === revision) render({ status: "results", query, matches });
      } catch (error) {
        if (current === revision) render({ status: "error", query, error });
      }
    },
  } as const;
};
