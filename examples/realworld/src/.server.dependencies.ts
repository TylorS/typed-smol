import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { DependenciesLayer as ApiDependenciesLayer } from "typed:api?dir=./api";
import { BrowserAuth } from "./common/BrowserAuth.js";
import type { AuthStore } from "./common/State.js";
import { RealWorldConfig } from "./infrastructure/Config.js";
import { SqliteLive } from "./infrastructure/Sql.js";
import { ServerApiClient } from "./common/serverApiClient.js";

const authRequired = Effect.fail({ _tag: "AuthRequired" as const });

const browserOnly = Effect.die(
  new Error("Browser auth mutations are unavailable during server SSR"),
);

const ServerBrowserAuth = Layer.succeed(BrowserAuth, {
  createArticle: () => authRequired,
  createComment: () => authRequired,
  deleteArticle: () => authRequired,
  deleteComment: () => authRequired,
  favoriteArticle: () => authRequired,
  followProfile: () => authRequired,
  login: () => browserOnly,
  logout: Effect.void,
  register: () => browserOnly,
  updateArticle: () => authRequired,
  updateSettings: () => authRequired,
  getToken: Effect.succeed(null),
  getAuthState: Effect.succeed("unauthenticated"),
  getCurrentUser: Effect.succeed(null),
} satisfies AuthStore);

export const layers = [
  ServerBrowserAuth,
  ServerApiClient.pipe(Layer.provideMerge(ApiDependenciesLayer)),
  SqliteLive,
  RealWorldConfig.Live,
] as const;
