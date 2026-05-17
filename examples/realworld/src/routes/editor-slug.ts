import { RouteHandler } from "@typed/app";
import { RefSubject } from "@typed/fx";
import { ArticleEditorPage } from "../presentation/App.js";
import { EditorSlugRoute } from "../routing/Routes.js";

export const route = EditorSlugRoute;
export const handler = RouteHandler(route)((paramsRef) =>
  ArticleEditorPage({ slug: RefSubject.proxy(paramsRef).slug }));
