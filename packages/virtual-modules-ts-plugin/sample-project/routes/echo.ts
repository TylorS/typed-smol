import * as Route from "@typed/router";

export const route = Route.Parse("echo");
/** Plain function handler: (params) => value. */
export const handler = (params: Record<string, unknown>): string => JSON.stringify(params);
