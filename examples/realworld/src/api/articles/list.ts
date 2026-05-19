import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import { Articles } from "../../application/Articles.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, articleFilter, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles");
export const method = HttpMethod.Get;
export const success = MultipleArticlesResponse;

export const handler = ApiHandlerRaw({ route, method, headers })(({ headers, query = {} }) =>
  respond(Articles.use((articles) => articles.list(articleFilter(query), authToken(headers)))));
