import { html } from "@typed/template";
import type { Article, ArticlePreview, Comment } from "../domain/Article.js";
import type { Profile } from "../domain/User.js";
import { ArticlePage } from "./ArticlePage.js";
import { EditorPage, type EditorPageInput } from "./EditorPage.js";
import { FeedPage } from "./Feed.js";
import { ProfilePage } from "./ProfilePage.js";
import { LoginPage, RegisterPage } from "./AuthPages.js";
import { SettingsPage } from "./SettingsPage.js";

export const HomePage = (input: {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly tags: readonly string[];
  readonly page: number;
  readonly selectedTag?: string;
}) => FeedPage(input);

export const ArticleDetailPage = (
  article: Article,
  comments: readonly Comment[],
) => ArticlePage(article, comments);

export const ProfileDetailPage = (input: {
  readonly profile: Profile;
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly favorites: boolean;
}) => ProfilePage(input);

export const AuthLoginPage = LoginPage;
export const AuthRegisterPage = RegisterPage;
export const UserSettingsPage = SettingsPage;
export const ArticleEditorPage = (input?: EditorPageInput) => EditorPage(input);

export const PlaceholderPage = (title: string) =>
  html`<section class="container page"><h1>${title}</h1></section>`;
