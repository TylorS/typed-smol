import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Comments } from "../../../application/Comments.js";
import { MultipleCommentsResponse } from "../../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../../api-support/Common.js";
import { respond } from "../../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Slash;
export const method = HttpMethod.Get;
export const success = MultipleCommentsResponse;

export const handler = Effect.fn("Comments.list")(function* ({ headers, path }) {
  return yield* respond(Comments.use((comments) => comments.list(path.slug, authToken(headers))));
}) satisfies RawHandler<Comments>;
