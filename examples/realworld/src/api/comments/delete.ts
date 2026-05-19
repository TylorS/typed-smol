import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Comments } from "../../application/Comments.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respondNoContent } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/comments/:id");
export const method = HttpMethod.Delete;
export const success = HttpApiSchema.NoContent;

export const handler = ApiHandlerRaw({ route, method, headers })(({ headers, path }) =>
  respondNoContent(
    Comments.use((comments) =>
      comments.delete(authToken(headers), path.slug, Number.parseInt(path.id, 10)),
    ),
  ));
