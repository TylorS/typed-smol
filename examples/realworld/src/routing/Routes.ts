import * as Route from "@typed/router";

const PageQuery = Route.QueryParams(Route.Int("page").optional());

export const HomeRoute = Route.Join(Route.Slash, PageQuery);
export const ArticleRoute = Route.Parse("article/:slug");
export const EditorRoute = Route.Parse("editor");
export const EditorSlugRoute = Route.Parse("editor/:slug");
export const LoginRoute = Route.Parse("login");
export const ProfileRoute = Route.Parse("profile/:username");
export const ProfileFavoritesRoute = Route.Parse("profile/:username/favorites");
export const RegisterRoute = Route.Parse("register");
export const SettingsRoute = Route.Parse("settings");
export const TagRoute = Route.Join(Route.Parse("tag/:tag"), PageQuery);
