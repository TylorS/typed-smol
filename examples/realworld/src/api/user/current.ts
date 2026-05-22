import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Users } from "../../application/Users.js";
import { UserResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Slash;
export const method = HttpMethod.Get;
export const success = UserResponse;

export const handler = Effect.fn("Users.current")(function* ({ headers }) {
  return yield* respond(Users.use((users) => users.current(authToken(headers))));
}) satisfies RawHandler<Users>;
