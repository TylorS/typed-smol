import * as Route from "@typed/router";

export const route = Route.Parse("profile");
export const handler = "profile";
// Uses profile.dependencies.ts (sibling) for provide step
