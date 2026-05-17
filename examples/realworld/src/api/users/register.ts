import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Users } from "../../application/Users.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { RegisterUserRequest, UserResponse } from "../../domain/RealWorldApi.js";

import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/users");
export const method = "POST";
export const body = RegisterUserRequest;
export const success = HttpApiSchema.status(201)(UserResponse);
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method, body })(({ body }) =>
  respond(
    Users.use((users) => users.register(body)),
    201,
  ));
