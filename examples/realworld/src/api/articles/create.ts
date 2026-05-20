import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { CreateArticleRequest, SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/articles");
export const method = HttpMethod.Post;
export const body = CreateArticleRequest;
export const success = HttpApiSchema.status(201)(SingleArticleResponse);

export const handler: RawHandler<never, Articles> = ({ body, headers }) =>
  respond(
    Articles.use((articles) => articles.create(authToken(headers), body)),
    201,
  );
