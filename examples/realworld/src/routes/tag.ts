import { RouteHandler } from "@typed/app/RouteHandler";
import { LoadingTagFeedPage } from "../presentation/App.js";
import { TagRoute } from "../routing/Routes.js";

export const route = TagRoute;
export const template = RouteHandler(route)(LoadingTagFeedPage);
