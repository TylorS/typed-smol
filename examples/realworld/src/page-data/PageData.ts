import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { ApiClientError } from "../Api.js";
import type { Article, ArticlePreview, Comment } from "../domain/Article.js";
import type { RealWorldError } from "../domain/Errors.js";
import type { Profile } from "../domain/User.js";
import type { ArticleRepositoryError } from "../infrastructure/repositories/ArticleRepository.js";
import type { CommentRepositoryError } from "../infrastructure/repositories/CommentRepository.js";
import type { ProfileRepositoryError } from "../infrastructure/repositories/ProfileRepository.js";
import type { TagRepositoryError } from "../infrastructure/repositories/TagRepository.js";
import type { UserRepositoryError } from "../infrastructure/repositories/UserRepository.js";

export type PageDataError =
  | ApiClientError
  | RealWorldError
  | ArticleRepositoryError
  | CommentRepositoryError
  | ProfileRepositoryError
  | TagRepositoryError
  | UserRepositoryError;

export interface FeedPageData {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly tags: readonly string[];
  readonly page: number;
  readonly selectedTag?: string;
}

export interface ArticlePageData {
  readonly article: Article;
  readonly comments: readonly Comment[];
}

export interface ProfilePageData {
  readonly profile: Profile;
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly favorites: boolean;
}

export interface PageDataService {
  readonly home: (input: {
    readonly page: number;
  }) => Effect.Effect<FeedPageData, PageDataError>;
  readonly tag: (input: {
    readonly page: number;
    readonly tag: string;
  }) => Effect.Effect<FeedPageData, PageDataError>;
  readonly article: (input: {
    readonly slug: string;
  }) => Effect.Effect<ArticlePageData, PageDataError>;
  readonly profile: (input: {
    readonly favorites: boolean;
    readonly username: string;
  }) => Effect.Effect<ProfilePageData, PageDataError>;
}

export class PageData extends Context.Service<PageData, PageDataService>()(
  "@typed/realworld/PageData",
) {}
