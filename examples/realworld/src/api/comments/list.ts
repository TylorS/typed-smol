import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import { Comments } from "../../application/Comments.js";
import { MultipleCommentsResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/articles/:slug/comments");
export const method = HttpMethod.Get;
export const success = MultipleCommentsResponse;

export const handler = ApiHandlerRaw({ route, method, headers })(({ headers, path }) =>
  respond(Comments.use((comments) => comments.list(path.slug, authToken(headers)))));
