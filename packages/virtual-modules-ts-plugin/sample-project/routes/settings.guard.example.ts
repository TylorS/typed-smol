import { RouteGuard } from "@typed/app";
import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";

const route = Route.Parse("settings");
export const guard = RouteGuard(route)(() => Effect.succeed(Option.none()));
