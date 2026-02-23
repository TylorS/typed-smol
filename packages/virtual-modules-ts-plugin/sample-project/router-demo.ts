/**
 * Demo: router virtual module. Use "router:routes" or "router:./routes".
 * Resolves in VS Code when the TS plugin loads plugins/router-plugin.cjs.
 * After `pnpm build:plugins`, run `pnpm verify:virtual-modules` or `pnpm typecheck`.
 */
import routes from "router:./routes";
import * as Router from "@typed/router";

const x = Router.run(routes);
