import { Api, Client } from "api:./api";
import type * as Effect from "effect/Effect";
import type * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpApiClient from "effect/unstable/httpapi/HttpApiClient";

export { Api, Client, OpenApi } from "api:./api";

export type RealWorldClient = Effect.Success<typeof Client>;
export type ApiClientError = Effect.Error<ReturnType<RealWorldClient["users"]["login"]>>;

export const makeClient = (options?: {
  readonly baseUrl?: URL | string;
}) => HttpApiClient.make(Api, options);

export const makeClientWith = <E, R>(
  httpClient: HttpClient.HttpClient.With<E, R>,
  options?: {
    readonly baseUrl?: URL | string;
  },
) => HttpApiClient.makeWith(Api, { ...options, httpClient });
