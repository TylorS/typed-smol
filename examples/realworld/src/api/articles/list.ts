import * as Route from "@typed/router";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { articleFilter, authToken, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles");
export const method = "GET" as const;
export const success = MultipleArticlesResponse;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext) =>
  respond(Articles.use((articles) => articles.list(articleFilter(ctx), authToken(ctx))));
