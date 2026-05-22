import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { AuthSessionStorage } from "./common/AuthSessionStorage.js";
import { makeBrowserClient } from "./common/BrowserApiClient.js";
import { BrowserAuth } from "./common/BrowserAuth.js";
import { ApiClient, decodedRouteApiClient } from "./common/routeData.js";
import { BrowserAuthState } from "./common/State.js";

const client = makeBrowserClient({ baseUrl: window.location.origin });

const browserStateLayer = Layer.mergeAll(
  BrowserAuth.WithState(window, client),
  ApiClient.layer(Effect.map(client, decodedRouteApiClient)),
).pipe(
  Layer.provideMerge(FetchHttpClient.layer),
  Layer.provideMerge(BrowserAuthState.make(AuthSessionStorage.authSnapshot)),
  Layer.provideMerge(AuthSessionStorage.local(() => window.localStorage)),
);

export const layers = [browserStateLayer] as const;
