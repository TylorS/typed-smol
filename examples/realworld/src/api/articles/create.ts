import { ApiHandlerRaw } from "@typed/app";
import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { CreateArticleRequest, SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles");
export const method = "POST";
export const body = CreateArticleRequest;
export const success = HttpApiSchema.status(201)(SingleArticleResponse);
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method, body })(({ body, headers }) =>
  respond(
    Articles.use((articles) => articles.create(authToken(headers), body)),
    201,
  ));
