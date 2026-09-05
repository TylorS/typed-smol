// @effect-diagnostics missingEffectContext:off
import { expectTypeOf, it } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { html } from "@typed/template";
import * as Component from "../Component.js";

it("retains props and errors and requires callers to provide application services", () => {
  const View = Component.make((props: { title: string }) => html`<h1>${props.title}</h1>`);
  expectTypeOf(View).toExtend<Component.Component<{ title: string }>>();
  const failed = Component.make(() => Effect.fail("failure" as const));
  expectTypeOf(failed).toExtend<Component.Component<unknown, "failure">>();
  class App extends Context.Service<App, { readonly title: string }>()("App") {}
  const needsApp = () =>
    Effect.gen(function* () {
      const app = yield* App;
      return html`<h1>${app.title}</h1>`;
    });
  // @ts-expect-error Application services cannot escape the Astro component boundary.
  Component.make(needsApp);
  Component.make(() => needsApp().pipe(Effect.provideService(App, { title: "Provided" })));
});
