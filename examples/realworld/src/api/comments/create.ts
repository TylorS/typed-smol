import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../application/Comments.js";
import { CreateCommentRequest, SingleCommentResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/articles/:slug/comments");
export const method = HttpMethod.Post;
export const body = CreateCommentRequest;
export const success = HttpApiSchema.status(201)(SingleCommentResponse);

export const handler: RawHandler<never, Comments> = ({ body, headers, path }) =>
  respond(
    Comments.use((comments) => comments.create(authToken(headers), path.slug, body)),
    201,
  );
