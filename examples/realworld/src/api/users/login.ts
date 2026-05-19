import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { Users } from "../../application/Users.js";
import { LoginUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/users/login");
export const method = HttpMethod.Post;
export const body = LoginUserRequest;
export const success = UserResponse;

export const handler = ApiHandlerRaw({ route, method, body })(({ body }) =>
  respond(
    Users.use((users) => users.login(body)),
  ));
