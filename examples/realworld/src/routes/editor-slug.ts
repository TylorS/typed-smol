import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { RouteHandler } from "@typed/app";
import { ArticleEditorPage } from "../presentation/App.js";
import { EditorSlugRoute } from "../routing/Routes.js";

export const route = EditorSlugRoute;
export const handler = RouteHandler(route)((paramsRef) =>
  Fx.unwrap(Effect.gen(function* () {
    const params = yield* paramsRef;
    return ArticleEditorPage(params);
  })),
);
