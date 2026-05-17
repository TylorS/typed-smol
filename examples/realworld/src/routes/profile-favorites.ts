import { RouteHandler } from "@typed/app";
import { LoadingProfilePage } from "../presentation/App.js";
import { ProfileFavoritesRoute } from "../routing/Routes.js";

export const route = ProfileFavoritesRoute;
export const template = RouteHandler(route)((paramsRef) => LoadingProfilePage(paramsRef, true));
