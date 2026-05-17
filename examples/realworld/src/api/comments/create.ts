import * as Effect from "effect/Effect";
import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../application/Comments.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { CreateCommentRequest, SingleCommentResponse } from "../../domain/RealWorldApi.js";
import { authToken, jsonBody, pathParam, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/comments");
export const method = "POST" as const;
export const body = CreateCommentRequest;
export const success = HttpApiSchema.status(201)(SingleCommentResponse);
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext<{ slug: string }>) =>
  respond(
    jsonBody<CreateCommentRequest>(ctx).pipe(
      Effect.flatMap((input) =>
        Comments.use((comments) => comments.create(authToken(ctx), pathParam(ctx, "slug"), input)),
      ),
    ),
    201,
  );
