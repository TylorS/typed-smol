import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import { Articles } from "../../application/Articles.js";
import { SingleArticleResponse, UpdateArticleRequest } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/articles/:slug");
export const method = HttpMethod.Put;
export const body = UpdateArticleRequest;
export const success = SingleArticleResponse;

export const handler: RawHandler<never, Articles> = ({ body, headers, path }) =>
  respond(
    Articles.use((articles) => articles.update(authToken(headers), path.slug, body)),
  );
