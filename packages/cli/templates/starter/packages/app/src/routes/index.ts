import * as Route from "@typed/router";
import { message } from "@__APP_NAME__/shared";

export const route = Route.Slash;
export const handler = () => `<main id="home">${message}</main>`;
