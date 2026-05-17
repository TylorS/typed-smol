import * as Route from "@typed/router";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { authToken, pathParam, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/favorite");
export const method = "POST" as const;
export const success = SingleArticleResponse;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext<{ slug: string }>) =>
  respond(Articles.use((articles) => articles.favorite(authToken(ctx), pathParam(ctx, "slug"))));
