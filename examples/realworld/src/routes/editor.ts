import { RouteHandler } from "@typed/app";
import { ArticleEditorPage } from "../presentation/App.js";
import { EditorRoute } from "../routing/Routes.js";

export const route = EditorRoute;
export const handler = RouteHandler(route)(() => ArticleEditorPage());
