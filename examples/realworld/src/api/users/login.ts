import * as Effect from "effect/Effect";
import * as Route from "@typed/router";
import { Users } from "../../application/Users.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { LoginUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { jsonBody, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/users/login");
export const method = "POST" as const;
export const body = LoginUserRequest;
export const success = UserResponse;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext) =>
  respond(
    jsonBody<LoginUserRequest>(ctx).pipe(
      Effect.flatMap((input) => Users.use((users) => users.login(input))),
    ),
  );
