/**
 * Demo: router virtual module. Use "typed:router?dir=routes" or "typed:router?dir=./routes".
 * Resolves in VS Code when the TS plugin loads plugins/router-plugin.mjs.
 * After `pnpm build:plugins`, run `pnpm verify:virtual-modules` or `pnpm typecheck`.
 */
import routes from "typed:router?dir=routes";
import * as Router from "@typed/router";

export const demo = routes.pipe(Router.redirectTo("/home"));
