import { RouteHandler } from "@typed/app/RouteHandler";
import { ArticleEditorPage } from "../presentation/App.js";
import { route } from "./editor.js";

export const handler = RouteHandler(route)(() => ArticleEditorPage());
