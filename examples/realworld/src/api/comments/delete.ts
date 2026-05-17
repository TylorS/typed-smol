import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../application/Comments.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { authToken, intPathParam, pathParam, type RawApiContext } from "../../api-support/Common.js";
import { respondNoContent } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/comments/:id");
export const method = "DELETE" as const;
export const success = HttpApiSchema.NoContent;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext<{ slug: string; id: string }>) =>
  respondNoContent(
    Comments.use((comments) =>
      comments.delete(authToken(ctx), pathParam(ctx, "slug"), intPathParam(ctx, "id")),
    ),
  );
