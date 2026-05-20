import * as Route from "@typed/router";
import { Users } from "../../application/Users.js";
import { LoginUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/users/login");
export const method = HttpMethod.Post;
export const body = LoginUserRequest;
export const success = UserResponse;

export const handler: RawHandler<never, Users> = ({ body }) =>
  respond(
    Users.use((users) => users.login(body)),
  );
