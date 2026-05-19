import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { AuthSessionStorage } from "./presentation/AuthSessionStorage.js";
import { makeBrowserClient } from "./presentation/BrowserApiClient.js";
import { run } from "typed:browser?routes=./routes";
import { BrowserPageData } from "./page-data/BrowserPageData.js";
import { BrowserAuth } from "./presentation/BrowserAuth.js";
import { BrowserAuthState } from "./presentation/State.js";

const client = makeBrowserClient({ baseUrl: window.location.origin }).pipe(
  Effect.provide(FetchHttpClient.layer),
);
const authSessionLayer = AuthSessionStorage.local(() => window.localStorage);
const authStateLayer = BrowserAuthState.make(AuthSessionStorage.authSnapshot);

export const browserRuntime = run({
  layers: [BrowserAuth.WithState(window, client), BrowserPageData(client)],
}).pipe(
  Effect.provide(authStateLayer),
  Effect.provide(authSessionLayer),
);
await Effect.runPromise(browserRuntime);
