import { RouteHandler } from "@typed/app";
import { PlaceholderPage } from "../presentation/App.js";
import { SettingsRoute } from "../routing/Routes.js";

export const route = SettingsRoute;
export const handler = RouteHandler(route)(() => PlaceholderPage("Update Settings"));
