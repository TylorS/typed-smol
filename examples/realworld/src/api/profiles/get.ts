import * as Route from "@typed/router";
import { Profiles } from "../../application/Profiles.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { ProfileResponse } from "../../domain/RealWorldApi.js";
import { authToken, pathParam, type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/profiles/:username");
export const method = "GET" as const;
export const success = ProfileResponse;
export const error = ErrorResponse;

export const handler = (ctx: RawApiContext<{ username: string }>) =>
  respond(Profiles.use((profiles) => profiles.get(pathParam(ctx, "username"), authToken(ctx))));
