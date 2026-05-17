import { RouteHandler } from "@typed/app";
import { AuthRegisterPage } from "../presentation/App.js";
import { route } from "./register.js";

export const handler = RouteHandler(route)(() => AuthRegisterPage);
