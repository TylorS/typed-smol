import { RouteHandler } from "@typed/app";
import { PlaceholderPage } from "../presentation/App.js";
import { EditorRoute } from "../routing/Routes.js";

export const route = EditorRoute;
export const handler = RouteHandler(route)(() => PlaceholderPage("Publish Article"));
