import { RouteHandler } from "@typed/app/RouteHandler";
import { ArticleEditorPage } from "../presentation/App.js";
import { EditorRoute } from "../routing/Routes.js";

export const route = EditorRoute;
export const template = ArticleEditorPage();
