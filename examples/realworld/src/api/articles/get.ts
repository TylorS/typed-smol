import { ApiHandlerRaw } from "@typed/app";
import * as Route from "@typed/router";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug");
export const method = "GET";
export const success = SingleArticleResponse;
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method })(({ headers, path }) =>
  respond(Articles.use((articles) => articles.get(authToken(headers), path.slug))));
