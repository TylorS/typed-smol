import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import * as Schema from "effect/Schema";
import { Articles } from "../../application/Articles.js";
import { NonNegativeInt } from "../../domain/Ids.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, articleFilter, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Join(
  Route.Parse("/articles"),
  Route.QueryParams(
    Route.OptionalParam("author"),
    Route.OptionalParam("favorited"),
    Route.OptionalParamWithSchema("limit", Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt))),
    Route.OptionalParamWithSchema("offset", Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt))),
    Route.OptionalParam("tag"),
  ),
);
export const method = HttpMethod.Get;
export const success = MultipleArticlesResponse;

export const handler: RawHandler<never, Articles> = ({ headers, query }) =>
  respond(Articles.use((articles) => articles.list(articleFilter(query), authToken(headers))));
