import * as Effect from "effect/Effect";
import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Users } from "../../application/Users.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { RegisterUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { jsonBody, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/users");
export const method = "POST" as const;
export const body = RegisterUserRequest;
export const success = HttpApiSchema.status(201)(UserResponse);
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext) =>
  respond(
    jsonBody<RegisterUserRequest>(ctx).pipe(
      Effect.flatMap((input) => Users.use((users) => users.register(input))),
    ),
    201,
  );
