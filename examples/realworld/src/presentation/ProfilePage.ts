import { html } from "@typed/template";
import type { ArticlePreview } from "../domain/Article.js";
import type { Profile } from "../domain/User.js";
import { ArticleList } from "./Feed.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { clickIntent } from "./FormEvents.js";
import { avatarSrc } from "./Layout.js";

export interface ProfilePageInput {
  readonly profile: Profile;
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly favorites: boolean;
}

export const ProfilePage = (input: ProfilePageInput) => html`<section class="profile-page">
  <div class="user-info">
    <div class="container">
      <img class="user-img user-pic" src=${avatarSrc(input.profile.image)} />
      <h4>${input.profile.username}</h4>
      <p>${input.profile.bio ?? ""}</p>
      <button class="btn btn-sm btn-outline-primary" onclick=${followProfile(input.profile)}>
        Follow ${input.profile.username}
      </button>
    </div>
  </div>
  <div class="container">
    <div class="articles-toggle">
      <ul class="nav nav-pills outline-active">${ProfileTabs(input)}</ul>
    </div>
    ${ArticleList({
      articles: input.articles,
      articlesCount: input.articlesCount,
      page: 1,
    })}
  </div>
</section>`;

const ProfileTabs = (input: ProfilePageInput) => html`<li class="nav-item">
    <a
      class=${`nav-link${input.favorites ? "" : " active"}`}
      href=${`/profile/${input.profile.username}`}
    >
      My Articles
    </a>
  </li>
  <li class="nav-item">
    <a
      class=${`nav-link${input.favorites ? " active" : ""}`}
      href=${`/profile/${input.profile.username}/favorites`}
    >
      Favorited Articles
    </a>
  </li>`;

const followProfile = (profile: Profile) =>
  clickIntent(() =>
    BrowserAuth.use((auth) => auth.followProfile(profile.username, profile.following)));
