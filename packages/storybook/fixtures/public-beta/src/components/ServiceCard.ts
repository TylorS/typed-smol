import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { html } from "@typed/template";

export class ComponentGreeting extends Context.Service<
  ComponentGreeting,
  { readonly message: string }
>()("public-beta/ComponentGreeting") {}

export type ServiceCardInput = {
  readonly label: string;
};

export default (input: ServiceCardInput) =>
  html`<output data-testid="component-test-layer">
    ${input.label}: ${ComponentGreeting.pipe(Effect.map((service) => service.message))}
  </output>`;
