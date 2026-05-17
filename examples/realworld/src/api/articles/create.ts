import * as Effect from "effect/Effect";
import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { CreateArticleRequest, SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { authToken, jsonBody, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles");
export const method = "POST" as const;
export const body = CreateArticleRequest;
export const success = HttpApiSchema.status(201)(SingleArticleResponse);
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext) =>
  respond(
    jsonBody<CreateArticleRequest>(ctx).pipe(
      Effect.flatMap((input) => Articles.use((articles) => articles.create(authToken(ctx), input))),
    ),
    201,
  );
