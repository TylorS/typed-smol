import { RouteHandler } from "@typed/app";
import { AuthLoginPage } from "../presentation/App.js";
import { route } from "./login.js";

export const handler = RouteHandler(route)(() => AuthLoginPage);
