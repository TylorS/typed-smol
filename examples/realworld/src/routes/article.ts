import { RouteHandler } from "@typed/app/RouteHandler";
import { LoadingArticlePage } from "../presentation/App.js";
import { ArticleRoute } from "../routing/Routes.js";

export const route = ArticleRoute;
export const template = RouteHandler(route)(LoadingArticlePage);
