import * as Route from "@typed/router";
import { Tags } from "../../application/Tags.js";
import { ErrorResponse } from "../../domain/Errors.js";
import { TagsResponse } from "../../domain/RealWorldApi.js";
import { type RawApiContext } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/tags");
export const method = "GET" as const;
export const success = TagsResponse;
export const error = ErrorResponse;

export const handler = (_ctx: RawApiContext) =>
  respond(Tags.use((tags) => tags.list()));
