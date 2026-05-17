import { RouteHandler } from "@typed/app";
import { PlaceholderPage } from "../presentation/App.js";
import { RegisterRoute } from "../routing/Routes.js";

export const route = RegisterRoute;
export const handler = RouteHandler(route)(() => PlaceholderPage("Sign up"));
