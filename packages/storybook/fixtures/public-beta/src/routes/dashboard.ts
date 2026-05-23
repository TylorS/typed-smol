import * as Effect from "effect/Effect";
import { html } from "@typed/template";
import * as Route from "@typed/router";
import { DashboardGreeting } from "./_dependencies.js";

export const route = Route.Parse("/dashboard");

export const handler = html`<main data-testid="dashboard">
  Dashboard: ${DashboardGreeting.pipe(Effect.map((greeting) => greeting.message))}
</main>`;
