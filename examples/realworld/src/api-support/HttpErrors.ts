import { Effect } from "effect";
import { HttpServerResponse } from "effect/unstable/http";
import { RealWorldError, makeRealWorldError } from "../domain/Errors.js";

export const jsonResponse = (
  body: unknown,
  status = 200,
): Effect.Effect<HttpServerResponse.HttpServerResponse, never> =>
  HttpServerResponse.json(body, { status }).pipe(Effect.orDie);

export const noContent = (): Effect.Effect<HttpServerResponse.HttpServerResponse> =>
  Effect.succeed(HttpServerResponse.empty({ status: 204 }));

export const respond = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  status = 200,
): Effect.Effect<HttpServerResponse.HttpServerResponse, never, R> =>
  effect.pipe(
    Effect.flatMap((body) => jsonResponse(body, status)),
    Effect.catch((error) => errorResponse(error)),
  );

export const respondNoContent = <E, R>(
  effect: Effect.Effect<void, E, R>,
): Effect.Effect<HttpServerResponse.HttpServerResponse, never, R> =>
  effect.pipe(
    Effect.flatMap(noContent),
    Effect.catch((error) => errorResponse(error)),
  );

export const errorResponse = (
  error: unknown,
): Effect.Effect<HttpServerResponse.HttpServerResponse, never> => {
  const realWorldError = normalizeError(error);
  return jsonResponse({ errors: realWorldError.errors }, realWorldError.status);
};

const normalizeError = (error: unknown): RealWorldError =>
  error instanceof RealWorldError
    ? error
    : makeRealWorldError(500, "error", "internal server error");
