import { Effect } from "effect";
import * as Matcher from "@typed/router/Matcher";
import { ServerRouter } from "@typed/router/Router";
import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
import * as Article from "./routes/article.js";
import * as Editor from "./routes/editor.js";
import * as EditorSlug from "./routes/editor-slug.js";
import * as Home from "./routes/index.js";
import * as Layout from "./routes/_layout.js";
import * as Login from "./routes/login.js";
import * as Profile from "./routes/profile.js";
import * as ProfileFavorites from "./routes/profile-favorites.js";
import * as Register from "./routes/register.js";
import * as Settings from "./routes/settings.js";
import * as Tag from "./routes/tag.js";

export const Routes = Matcher.empty
  .match(Home.route, Home.handler)
  .match(Tag.route, Tag.handler)
  .match(Article.route, Article.handler)
  .match(Profile.route, Profile.handler)
  .match(ProfileFavorites.route, ProfileFavorites.handler)
  .match(Login.route, Login.handler)
  .match(Register.route, Register.handler)
  .match(Editor.route, Editor.handler)
  .match(EditorSlug.route, EditorSlug.handler)
  .match(Settings.route, Settings.handler)
  .layout(Layout.layout);

export const renderUrl = (input: string) =>
  renderToHtmlString(Routes).pipe(
    Effect.provide(ServerRouter({ url: input })),
    Effect.provide(StaticHtmlRenderTemplate),
    Effect.scoped,
  );
