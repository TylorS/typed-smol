import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Profiles } from "../../application/Profiles.js";
import { ProfileResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/:username");
export const method = HttpMethod.Get;
export const success = ProfileResponse;

export const handler = Effect.fn("Profiles.get")(function* ({ headers, path }) {
  return yield* respond(Profiles.use((profiles) => profiles.get(path.username, authToken(headers))));
}) satisfies RawHandler<Profiles>;
