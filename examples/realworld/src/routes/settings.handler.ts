import { RouteHandler } from "@typed/app/RouteHandler";
import { UserSettingsPage } from "../presentation/App.js";
import { route } from "./settings.js";

export const handler = RouteHandler(route)(() => UserSettingsPage);
