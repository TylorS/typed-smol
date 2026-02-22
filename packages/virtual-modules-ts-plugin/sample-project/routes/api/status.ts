import * as Route from "@typed/router";

export const route = Route.Join(Route.Parse("api"), Route.Parse("status"));
export const handler = "api-status";
