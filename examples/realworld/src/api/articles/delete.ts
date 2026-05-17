import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { authToken } from "../../api-support/Common.js";
import { respondNoContent } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug");
export const method = "DELETE";
export const success = HttpApiSchema.NoContent;
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method })(({ headers, path }) =>
  respondNoContent(
    Articles.use((articles) => articles.delete(authToken(headers), path.slug)),
  ));
