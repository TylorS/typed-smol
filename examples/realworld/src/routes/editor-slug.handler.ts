import { RouteHandler } from "@typed/app";
import { RefSubject } from "@typed/fx";
import { ArticleEditorPage } from "../presentation/App.js";
import { route } from "./editor-slug.js";

export const handler = RouteHandler(route)((paramsRef) =>
  ArticleEditorPage({ slug: RefSubject.proxy(paramsRef).slug }));
