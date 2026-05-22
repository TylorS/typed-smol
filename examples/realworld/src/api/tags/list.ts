import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Tags } from "../../application/Tags.js";
import { TagsResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Slash;
export const method = HttpMethod.Get;
export const success = TagsResponse;

export const handler = Effect.fn("Tags.list")(function* () {
  return yield* respond(Tags.use((tags) => tags.list()));
}) satisfies RawHandler<Tags>;
