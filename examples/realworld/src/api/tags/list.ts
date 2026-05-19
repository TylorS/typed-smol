import { ApiHandlerRaw } from "@typed/app/httpapi/ApiHandler";
import * as Route from "@typed/router";
import { Tags } from "../../application/Tags.js";
import { TagsResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";

export const route = Route.Parse("/tags");
export const method = HttpMethod.Get;
export const success = TagsResponse;

export const handler = ApiHandlerRaw({ route, method })(() =>
  respond(Tags.use((tags) => tags.list())));
