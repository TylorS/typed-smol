import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { makeBrowserClient } from "./common/BrowserApiClient.js";
import { ApiClient, decodedRouteApiClient } from "./common/routeData.js";
import { apiBaseUrl } from "typed:storybook/runtime?path=/";

export const StorybookApiLayer = ApiClient.layer(
  Effect.gen(function* () {
    const client = yield* makeBrowserClient({ baseUrl: apiBaseUrl });
    return decodedRouteApiClient(client);
  }),
).pipe(Layer.provideMerge(FetchHttpClient.layer));
