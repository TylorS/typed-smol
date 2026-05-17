import { ApiHandlerRaw } from "@typed/app";
import * as Route from "@typed/router";
import { Profiles } from "../../application/Profiles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { ProfileResponse } from "../../domain/RealWorldApi.js";
import { authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/profiles/:username");
export const method = "GET";
export const success = ProfileResponse;
export const error = ErrorResponse;

export const handler = ApiHandlerRaw({ route, method })(({ headers, path }) =>
  respond(Profiles.use((profiles) => profiles.get(path.username, authToken(headers)))));
