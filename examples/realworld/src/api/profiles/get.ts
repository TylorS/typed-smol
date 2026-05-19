import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import { Profiles } from "../../application/Profiles.js";
import { ProfileResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/profiles/:username");
export const method = HttpMethod.Get;
export const success = ProfileResponse;

export const handler = ApiHandlerRaw({ route, method, headers })(({ headers, path }) =>
  respond(Profiles.use((profiles) => profiles.get(path.username, authToken(headers)))));
