import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respondNoContent } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug");
export const method = HttpMethod.Delete;
export const success = HttpApiSchema.NoContent;

export const handler = ApiHandlerRaw({ route, method, headers })(({ headers, path }) =>
  respondNoContent(
    Articles.use((articles) => articles.delete(authToken(headers), path.slug)),
  ));
