import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Button, Disclosure, Select } from "@typed/ui";
import { Effect, Scope } from "effect";

const root = document.getElementById("typed-hmr-root");
if (!(root instanceof HTMLElement)) throw new Error("Missing #typed-hmr-root");
const compiledRoot = document.getElementById("typed-hmr-compiled-root");
if (!(compiledRoot instanceof HTMLElement)) throw new Error("Missing #typed-hmr-compiled-root");

const CompiledShell = html`<p data-testid="compiled-title">Typed compiler HMR before</p>`;

const HmrUi = Fx.gen(function* () {
  const disclosure = yield* Disclosure.makeState({ open: false });
  const select = yield* Select.makeState<string>({ id: "realworld-hmr-select", value: "global" });

  return html`<section class="container page" data-testid="hmr-ui-entry">
    <h1 data-testid="hmr-title">Typed UI HMR before</h1>
    ${Button.Button({
      content: "Native button primitive",
      props: { class: "btn btn-sm btn-secondary", "data-testid": "hmr-button" },
    })}
    ${Disclosure.Button({
      content: "Toggle disclosure",
      props: { class: "btn btn-sm btn-outline-primary", "data-testid": "hmr-disclosure-trigger" },
      state: disclosure,
    })}
    ${Disclosure.Content({
      content: "Disclosure state survived",
      props: { class: "card card-block", "data-testid": "hmr-disclosure-content" },
      state: disclosure,
    })}
    ${Select.Trigger({
      content: "Open select",
      props: { class: "btn btn-sm btn-outline-secondary", "data-testid": "hmr-select-trigger" },
      state: select,
    })}
    ${Select.Value({
      props: { "data-testid": "hmr-select-value" },
      state: select,
    })}
    ${Select.Content({
      content: html`${Select.Option({
        content: "Global feed",
        id: "hmr-select-global",
        state: select,
        value: "global",
      })}
      ${Select.Option({
        content: "Personal",
        id: "hmr-select-personal",
        state: select,
        value: "personal",
      })}`,
      label: "Feed mode",
      state: select,
    })}
  </section>`;
});

const hot = (
  import.meta as ImportMeta & {
    readonly hot?: { readonly dispose: (callback: () => void) => void };
  }
).hot;

const stateScope = Effect.runSync(Scope.make());

Effect.runFork(
  render(HmrUi, root).pipe(
    Fx.provide(DomRenderTemplate.using(root.ownerDocument)),
    Fx.drain,
    Effect.provideService(Scope.Scope, stateScope),
  ),
);

Effect.runFork(Effect.promise(() => CompiledShell.renderInto(compiledRoot)));

hot?.dispose(() => {
  compiledRoot.replaceChildren();
  root.replaceChildren();
});
