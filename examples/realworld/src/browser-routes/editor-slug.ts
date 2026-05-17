import { Fx } from "@typed/fx";
import { ArticleEditorPage } from "../presentation/App.js";
import { EditorSlugRoute as route } from "../routing/Routes.js";

export { route };
export const handler = (paramsRef: Fx.Fx<{ readonly slug: string }>) =>
  Fx.map(paramsRef, (params) => ArticleEditorPage(params));
