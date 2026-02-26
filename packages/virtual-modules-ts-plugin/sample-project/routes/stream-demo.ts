import { RouteHandler } from "@typed/app";
import * as Route from "@typed/router";
import { html } from "@typed/template";
import { Stream } from "effect";

export const route = Route.Parse("stream-demo");
export const handler = RouteHandler(route)(() => html`<div>${Stream.succeed("stream-demo")}</div>`);
