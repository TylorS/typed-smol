import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import { Users } from "../../application/Users.js";
import { UpdateUserRequest, UserResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/user");
export const method = HttpMethod.Put;
export const body = UpdateUserRequest;
export const success = UserResponse;

export const handler: RawHandler<never, Users> = ({ body, headers }) =>
  respond(
    Users.use((users) => users.update(authToken(headers), body)),
  );
