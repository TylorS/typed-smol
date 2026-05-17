import { RouteHandler } from "@typed/app";
import { PlaceholderPage } from "../presentation/App.js";
import { LoginRoute } from "../routing/Routes.js";

export const route = LoginRoute;
export const handler = RouteHandler(route)(() => PlaceholderPage("Sign in"));
