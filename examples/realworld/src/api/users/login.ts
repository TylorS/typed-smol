import { ApiHandlerRaw } from "@typed/app";
import * as Route from "@typed/router";
import { Users } from "../../application/Users.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { LoginUserRequest, UserResponse } from "../../domain/RealWorldApi.js";

import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/users/login");
export const method = "POST";
export const body = LoginUserRequest;
export const success = UserResponse;
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method, body })(({ body }) =>
  respond(
    Users.use((users) => users.login(body)),
  ));
