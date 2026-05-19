import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import { Articles } from "../../application/Articles.js";
import { SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/favorite");
export const method = HttpMethod.Delete;
export const success = SingleArticleResponse;

export const handler = ApiHandlerRaw({ route, method, headers })(({ headers, path }) =>
  respond(
    Articles.use((articles) => articles.unfavorite(authToken(headers), path.slug)),
  ));
