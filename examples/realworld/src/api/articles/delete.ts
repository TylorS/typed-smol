import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { authToken, pathParam, type RawApiContext } from "../../api-support/Common.js";
import { respondNoContent } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug");
export const method = "DELETE" as const;
export const success = HttpApiSchema.NoContent;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext<{ slug: string }>) =>
  respondNoContent(
    Articles.use((articles) => articles.delete(authToken(ctx), pathParam(ctx, "slug"))),
  );
