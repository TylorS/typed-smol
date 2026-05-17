import * as Effect from "effect/Effect";
import * as Route from "@typed/router";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { SingleArticleResponse, UpdateArticleRequest } from "../../domain/RealWorldApi.js";
import { authToken, jsonBody, pathParam, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug");
export const method = "PUT" as const;
export const body = UpdateArticleRequest;
export const success = SingleArticleResponse;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext<{ slug: string }>) =>
  respond(
    jsonBody<UpdateArticleRequest>(ctx).pipe(
      Effect.flatMap((input) =>
        Articles.use((articles) => articles.update(authToken(ctx), pathParam(ctx, "slug"), input)),
      ),
    ),
  );
