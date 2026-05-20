import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../application/Comments.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respondNoContent } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Join(Route.Parse("/articles/:slug/comments"), Route.Int("commentId"));
export const method = HttpMethod.Delete;
export const success = HttpApiSchema.NoContent;

export const handler: RawHandler<never, Comments> = ({ headers, path }) =>
  respondNoContent(
    Comments.use((comments) =>
      comments.delete(authToken(headers), path.slug, path.commentId),
    ),
  );
