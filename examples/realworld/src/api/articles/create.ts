import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { CreateArticleRequest, SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Slash;
export const method = HttpMethod.Post;
export const body = CreateArticleRequest;
export const success = HttpApiSchema.status(201)(SingleArticleResponse);

export const handler = Effect.fn("Articles.create")(({ body, headers }) =>
  respond(
    Articles.use((articles) => articles.create(authToken(headers), body)),
    201,
  ),
) satisfies RawHandler<Articles>;
