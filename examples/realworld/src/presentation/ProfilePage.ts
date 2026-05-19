import * as AsyncData from "@typed/async-data";
import { RefAsyncData, RefSubject } from "@typed/fx";
import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { html, many } from "@typed/template";
import { Link } from "@typed/ui";
import * as Effect from "effect/Effect";
import type { ArticlePreview } from "../domain/Article.js";
import type { ProfilePageData } from "../page-data/PageData.js";
import { safeTextPreview } from "../domain/Markdown.js";
import type { Profile } from "../domain/User.js";
import { ArticleList } from "./Feed.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { FormTargetError, clickIntent } from "./FormEvents.js";
import { avatarSrc } from "./Layout.js";
import { AsyncDataMessages, AsyncDataSuccess } from "./AsyncDataView.js";

export interface ProfilePageInput {
  readonly profile: Profile;
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly favorites: boolean;
}

interface ProfileTabData {
  readonly active: boolean;
  readonly href: string;
  readonly label: string;
}

export const ProfilePage = <E, R>(
  input: RefAsyncData.RefAsyncData<ProfilePageData, E, never, R>,
) => html`${AsyncDataMessages(input)} ${AsyncDataSuccess(input, ProfilePageContent)}`;

const ProfilePageContent = <E, R>(
  input: RefSubject.Computed<ProfilePageInput, E, R>,
) => {
  const data = RefSubject.proxy(input);
  const profile = RefSubject.proxy(data.profile);
  const avatar = RefSubject.map(profile.image, avatarSrc);
  const username = RefSubject.map(profile.username, safeTextPreview);
  const bio = RefSubject.map(profile.bio, (value) => safeTextPreview(value ?? ""));
  const tabs = RefSubject.map(input, profileTabs);

  return html`<section class="profile-page">
    <div class="user-info">
      <div class="container">
        <img class="user-img user-pic" src=${avatar} />
        <h4>${username}</h4>
        <p>${bio}</p>
        <button class="btn btn-sm btn-outline-primary" onclick=${followProfile(data.profile)}>
          Follow ${username}
        </button>
      </div>
    </div>
    <div class="container">
      <div class="articles-toggle">
        <ul class="nav nav-pills outline-active">
          ${many(tabs, (tab) => tab.href, ProfileTab)}
        </ul>
      </div>
      ${ArticleList({
        articles: data.articles,
        articlesCount: data.articlesCount,
        page: RefSubject.map(data.articlesCount, () => 1),
        selectedTag: RefSubject.map(data.articlesCount, () => undefined),
      })}
    </div>
  </section>`;
};

export type ProfileAsyncData<E = never> = AsyncData.AsyncData<ProfilePageData, E>;

const profileTabs = (input: ProfilePageInput): readonly ProfileTabData[] => [
  {
    active: !input.favorites,
    href: `/profile/${input.profile.username}`,
    label: "My Articles",
  },
  {
    active: input.favorites,
    href: `/profile/${input.profile.username}/favorites`,
    label: "Favorited Articles",
  },
] as const;

const ProfileTab = (tabRef: RefSubjectType<ProfileTabData>) => {
  const tab = RefSubject.proxy(tabRef);
  const tabClass = RefSubject.map(tab.active, (active) => `nav-link${active ? " active" : ""}`);
  return html`<li class="nav-item">
    ${Link({ class: tabClass, href: tab.href, content: tab.label })}
  </li>`;
};

const followProfile = <E, R>(profile: RefSubject.Computed<Profile, E, R>) =>
  clickIntent(
    Effect.fn(function* () {
      const current = yield* profile.pipe(
        Effect.mapError(() => new FormTargetError({ reason: "reactive value is unavailable" })),
      );
      const auth = yield* BrowserAuth;
      return yield* auth.followProfile(current.username, current.following);
    }),
  );
