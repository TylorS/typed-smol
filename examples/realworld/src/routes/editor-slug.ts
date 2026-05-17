import { RouteHandler } from "@typed/app";
import { PlaceholderPage } from "../presentation/App.js";
import { EditorSlugRoute } from "../routing/Routes.js";

export const route = EditorSlugRoute;
export const handler = RouteHandler(route)(() => PlaceholderPage("Edit Article"));
