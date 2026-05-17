import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { Users } from "../../application/Users.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { UpdateUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/user");
export const method = "PUT";
export const body = UpdateUserRequest;
export const success = UserResponse;
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method, body })(({ body, headers }) =>
  respond(
    Users.use((users) => users.update(authToken(headers), body)),
  ));
