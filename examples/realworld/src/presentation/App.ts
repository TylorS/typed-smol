import { html } from "@typed/template";
import { Fx, RefSubject } from "@typed/fx";
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

export const LoadingFeedPage = () =>
  FeedPage({
    articles: [],
    articlesCount: 0,
    tags: [],
    page: 1,
  });

export const LoadingTagFeedPage = (
  params: RefSubject.RefSubject<{ readonly tag: string }>,
) => {
  const tag = RefSubject.proxy(params).tag;
  return html`<section class="home-page">
    <div class="container page">
      <div class="feed-toggle">
        <ul class="nav nav-pills outline-active">
          <li class="nav-item"><a class="nav-link" href="/">Global Feed</a></li>
          <li class="nav-item">
            <a class="nav-link active" href=${RefSubject.map((value) => `/tag/${value}`)(tag)}>
              # ${tag}
            </a>
          </li>
        </ul>
      </div>
      <p class="empty-feed-message">Loading articles...</p>
    </div>
  </section>`;
};

export const LoadingArticlePage = (
  params: RefSubject.RefSubject<{ readonly slug: string }>,
) => html`<section class="container page">
    <h1>${RefSubject.proxy(params).slug}</h1>
    <p>Loading article...</p>
  </section>`;

export const LoadingProfilePage = (
  params: RefSubject.RefSubject<{ readonly username: string }>,
  favorites: boolean,
) => {
  const username = RefSubject.proxy(params).username;
  const profileHref = RefSubject.map((value) => `/profile/${value}`)(username);
  const favoritesHref = RefSubject.map((value) => `/profile/${value}/favorites`)(username);
  return html`<section class="profile-page">
    <div class="user-info">
      <div class="container">
        <img class="user-img user-pic" src="/default-avatar.svg" />
        <h4>${username}</h4>
        <p>Loading profile...</p>
      </div>
    </div>
    <div class="container">
      <div class="articles-toggle">
        <ul class="nav nav-pills outline-active">
          <li class="nav-item">
            <a class=${`nav-link${favorites ? "" : " active"}`} href=${profileHref}>
              My Articles
            </a>
          </li>
          <li class="nav-item">
            <a
              class=${`nav-link${favorites ? " active" : ""}`}
              href=${favoritesHref}
            >
              Favorited Articles
            </a>
          </li>
        </ul>
      </div>
      <p class="empty-feed-message">Loading articles...</p>
    </div>
  </section>`;
};

export const PlaceholderPage = (title: string) =>
  html`<section class="container page"><h1>${title}</h1></section>`;
