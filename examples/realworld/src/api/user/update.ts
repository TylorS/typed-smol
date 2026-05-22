import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Users } from "../../application/Users.js";
import { UpdateUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Slash;
export const method = HttpMethod.Put;
export const body = UpdateUserRequest;
export const success = UserResponse;

export const handler = Effect.fn("Users.update")(function* ({ body, headers }) {
  return yield* respond(Users.use((users) => users.update(authToken(headers), body)));
}) satisfies RawHandler<Users>;
