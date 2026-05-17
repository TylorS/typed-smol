import { ApiHandlerRaw } from "@typed/app";
import * as Route from "@typed/router";
import { Comments } from "../../application/Comments.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { MultipleCommentsResponse } from "../../domain/RealWorldApi.js";
import { authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/comments");
export const method = "GET";
export const success = MultipleCommentsResponse;
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method })(({ headers, path }) =>
  respond(Comments.use((comments) => comments.list(path.slug, authToken(headers)))));
