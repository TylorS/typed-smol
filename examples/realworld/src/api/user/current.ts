import * as Route from "@typed/router";
import { Users } from "../../application/Users.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { UserResponse } from "../../domain/RealWorldApi.js";
import { authToken, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/user");
export const method = "GET" as const;
export const success = UserResponse;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext) =>
  respond(Users.use((users) => users.current(authToken(ctx))));
