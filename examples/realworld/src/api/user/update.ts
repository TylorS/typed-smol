import * as Effect from "effect/Effect";
import * as Route from "@typed/router";
import { Users } from "../../application/Users.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { UpdateUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { authToken, jsonBody, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/user");
export const method = "PUT" as const;
export const body = UpdateUserRequest;
export const success = UserResponse;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext) =>
  respond(
    jsonBody<UpdateUserRequest>(ctx).pipe(
      Effect.flatMap((input) => Users.use((users) => users.update(authToken(ctx), input))),
    ),
  );
