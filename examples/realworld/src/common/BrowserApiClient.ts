import * as AsyncData from "@typed/async-data";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { makeClientWith } from "../Api.js";
import { BrowserAuthState } from "./State.js";

export const makeBrowserClient = (options?: {
  readonly baseUrl?: URL | string;
}) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;
    const authenticatedClient = yield* withAuthToken(httpClient);
    return yield* makeClientWith(authenticatedClient, options);
  });

export const withAuthToken = <E, R>(
  httpClient: HttpClient.HttpClient.With<E, R>,
) =>
  Effect.gen(function* () {
    const authState = yield* BrowserAuthState.service;

    return httpClient.pipe(
      HttpClient.mapRequestEffect((request) =>
        Effect.gen(function* () {
          const data = yield* authState;
          const token = Option.flatMap(AsyncData.getSuccess(data), (snapshot) =>
            Option.fromNullishOr(snapshot.token)
          );
          return Option.isNone(token)
            ? request
            : HttpClientRequest.setHeader(request, "authorization", `Token ${token.value}`);
        })),
    );
  });
