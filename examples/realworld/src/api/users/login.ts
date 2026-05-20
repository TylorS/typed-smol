import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Users } from "../../application/Users.js";
import { LoginUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/users/login");
export const method = HttpMethod.Post;
export const body = LoginUserRequest;
export const success = UserResponse;

export const handler = Effect.fn("Users.login")(function* ({ body }) {
  return yield* respond(
    Users.use((users) => users.login(body)),
  );
}) satisfies RawHandler<Users>;
