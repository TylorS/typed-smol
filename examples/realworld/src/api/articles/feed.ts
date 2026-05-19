import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import * as Schema from "effect/Schema";
import { Articles } from "../../application/Articles.js";
import { NonNegativeInt } from "../../domain/Ids.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken, feedFilter } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Join(
  Route.Parse("/articles/feed"),
  Route.QueryParams(
    Route.OptionalParamWithSchema("limit", Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt))),
    Route.OptionalParamWithSchema("offset", Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt))),
  ),
);
export const method = HttpMethod.Get;
export const success = MultipleArticlesResponse;

export const handler = ApiHandlerRaw({ route, method, headers })(({ headers, query }) =>
  respond(Articles.use((articles) => articles.feed(authToken(headers), feedFilter(query)))));
