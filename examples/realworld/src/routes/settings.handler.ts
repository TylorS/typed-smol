import { RouteHandler } from "@typed/app";
import { UserSettingsPage } from "../presentation/App.js";
import { route } from "./settings.js";

export const handler = RouteHandler(route)(() => UserSettingsPage);
