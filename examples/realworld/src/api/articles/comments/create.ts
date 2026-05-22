import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../../application/Comments.js";
import { CreateCommentRequest, SingleCommentResponse } from "../../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../../common/http.js";
import { respond } from "../../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Slash;
export const method = HttpMethod.Post;
export const body = CreateCommentRequest;
export const success = HttpApiSchema.status(201)(SingleCommentResponse);

export const handler = Effect.fn("Comments.create")(function* ({ body, headers, path }) {
  return yield* respond(
    Comments.use((comments) => comments.create(authToken(headers), path.slug, body)),
    201,
  );
}) satisfies RawHandler<Comments>;
