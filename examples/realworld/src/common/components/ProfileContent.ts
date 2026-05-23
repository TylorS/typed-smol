import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html, many } from "@typed/template";
import { Button } from "@typed/ui";
import * as Effect from "effect/Effect";
import type { ProfileViewData } from "../routeData.js";
import { safeTextPreview } from "../../domain/Markdown.js";
import type { Profile } from "../../domain/User.js";
import { avatarSrc } from "../Layout.js";
import { BrowserAuth } from "../BrowserAuth.js";
import { FormTargetError, renderWorkflowFailure, targetForm } from "../workflowErrors.js";
import { ArticleList } from "./ArticleList.js";
import { ProfileTab } from "./ProfileTab.js";
import type { ProfilePageInput, ProfileTabData } from "./profileTypes.js";

export const ProfileContent = Fx.fn("ProfileContent")(<E, R>(
  input: RefSubject.Computed<ProfileViewData, E, R>,
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
        ${Button.Button({
          content: html`Follow ${username}`,
          onclick: followProfile(data.profile),
          props: { class: "btn btn-sm btn-outline-primary" },
        })}
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
});

const profileTabs = (input: ProfilePageInput): readonly ProfileTabData[] =>
  [
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

const followProfile = <E, R>(profile: RefSubject.Computed<Profile, E, R>) =>
  EventHandler.make(
    (event: MouseEvent) =>
      toggleFollow(profile).pipe(
        Effect.catch((error) => renderWorkflowFailure(targetForm(event), error)),
        Effect.asVoid,
      ),
    { preventDefault: true },
  );

const toggleFollow = Effect.fn(function* <E, R>(profile: RefSubject.Computed<Profile, E, R>) {
  const current = yield* profile.pipe(
    Effect.mapError(() => new FormTargetError({ reason: "reactive value is unavailable" })),
  );
  const auth = yield* BrowserAuth;
  return yield* auth.followProfile(current.username, current.following);
});
