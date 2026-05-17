import { RouteHandler } from "@typed/app/RouteHandler";
import { AuthRegisterPage } from "../presentation/App.js";
import { route } from "./register.js";

export const handler = RouteHandler(route)(() => AuthRegisterPage);
