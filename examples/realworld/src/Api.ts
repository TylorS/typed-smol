import { Api } from "typed:api?dir=./api&mode=client";
import type * as Effect from "effect/Effect";
import type * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";

export { Api };

export type RealWorldClient<E = never, R = never> = HttpApiClient.ForApi<typeof Api, E, R>;
export type ApiClientError = Effect.Error<ReturnType<RealWorldClient["users"]["login"]>>;

export const makeClient = (options?: {
  readonly baseUrl?: URL | string;
}): Effect.Effect<RealWorldClient, never, HttpClient.HttpClient> =>
  HttpApiClient.make(Api, options);

export const makeClientWith = <E, R>(
  httpClient: HttpClient.HttpClient.With<E, R>,
  options?: {
    readonly baseUrl?: URL | string;
  },
): Effect.Effect<RealWorldClient<E, R>, never, R> =>
  HttpApiClient.makeWith(Api, { ...options, httpClient });
