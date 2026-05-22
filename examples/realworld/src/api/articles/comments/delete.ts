import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../../application/Comments.js";
import { HttpMethod, authToken } from "../../../common/http.js";
import { respondNoContent } from "../../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Int("commentId");
export const method = HttpMethod.Delete;
export const success = HttpApiSchema.NoContent;

export const handler = Effect.fn("Comments.delete")(function* ({ headers, path }) {
  return yield* respondNoContent(
    Comments.use((comments) => comments.delete(authToken(headers), path.slug, path.commentId)),
  );
}) satisfies RawHandler<Comments>;
