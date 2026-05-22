import type { ArticlePreview } from "../../domain/Article.js";

export interface FeedPageInput {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly tags: readonly string[];
  readonly page: number;
  readonly selectedTag?: string;
}

export interface PageLinkData {
  readonly active: boolean;
  readonly href: string;
  readonly page: number;
}
