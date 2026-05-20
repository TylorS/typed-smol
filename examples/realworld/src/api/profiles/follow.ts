import * as Route from "@typed/router";
import { headers } from "./_headers.js";
import { Profiles } from "../../application/Profiles.js";
import { ProfileResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/profiles/:username/follow");
export const method = HttpMethod.Post;
export const success = ProfileResponse;

export const handler: RawHandler<never, Profiles> = ({ headers, path }) =>
  respond(Profiles.use((profiles) => profiles.follow(authToken(headers), path.username)));
