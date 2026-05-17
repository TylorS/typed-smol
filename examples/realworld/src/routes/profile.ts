import { RouteHandler } from "@typed/app/RouteHandler";
import { LoadingProfilePage } from "../presentation/App.js";
import { ProfileRoute } from "../routing/Routes.js";

export const route = ProfileRoute;
export const template = RouteHandler(route)((paramsRef) => LoadingProfilePage(paramsRef, false));
