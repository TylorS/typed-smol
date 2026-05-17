import { RouteHandler } from "@typed/app/RouteHandler";
import { AuthLoginPage } from "../presentation/App.js";
import { route } from "./login.js";

export const handler = RouteHandler(route)(() => AuthLoginPage);
