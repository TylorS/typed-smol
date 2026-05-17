import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../application/Comments.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { CreateCommentRequest, SingleCommentResponse } from "../../domain/RealWorldApi.js";
import { authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/comments");
export const method = "POST";
export const body = CreateCommentRequest;
export const success = HttpApiSchema.status(201)(SingleCommentResponse);
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method, body })(({ body, headers, path }) =>
  respond(
    Comments.use((comments) => comments.create(authToken(headers), path.slug, body)),
    201,
  ));
