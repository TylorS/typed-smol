import * as Route from "@typed/router";

export const route = Route.Join(Route.Parse("users"), Route.Param("id"));
export const handler = "user-by-id";
