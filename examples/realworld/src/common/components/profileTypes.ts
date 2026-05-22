import type { ArticlePreview } from "../../domain/Article.js";
import type { Profile } from "../../domain/User.js";

export interface ProfilePageInput {
  readonly profile: Profile;
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly favorites: boolean;
}

export interface ProfileTabData {
  readonly active: boolean;
  readonly href: string;
  readonly label: string;
}
