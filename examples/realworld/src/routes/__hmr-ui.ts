import { Fx } from "@typed/fx";
import * as Route from "@typed/router";
import { html } from "@typed/template";
import { Button, Dialog, Disclosure, Popover, Select } from "@typed/ui";

export const route = Route.Parse("__typed/hmr-ui");

export const template = Fx.gen(function* () {
  const dialog = yield* Dialog.makeState({ open: false });
  const disclosure = yield* Disclosure.makeState({ open: false });
  const popover = yield* Popover.makeState({ id: "realworld-hmr-popover", open: false, mode: "auto" });
  const select = yield* Select.makeState<string>({ id: "realworld-hmr-select", value: "global" });

  return html`<section class="container page" data-testid="hmr-ui-route">
    <h1 data-testid="hmr-title">Typed UI HMR before</h1>
    <p>This route is intentionally local-test-only coverage for Typed UI and compiler HMR.</p>
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
    ${Dialog.Trigger({
      content: "Open dialog",
      props: { class: "btn btn-sm btn-outline-secondary", "data-testid": "hmr-dialog-trigger" },
      state: dialog,
    })}
    ${Dialog.Content({
      content: html`${Dialog.Close({
        content: "Close",
        state: dialog,
      })}`,
      label: "Typed UI HMR dialog",
      props: { "data-testid": "hmr-dialog" },
      state: dialog,
    })}
    ${Popover.Trigger({
      content: "Toggle popover",
      props: { class: "btn btn-sm btn-outline-secondary", "data-testid": "hmr-popover-trigger" },
      state: popover,
    })}
    ${Popover.Content({
      content: "Popover content",
      props: { class: "card card-block", "data-testid": "hmr-popover" },
      state: popover,
    })}
    ${Select.Trigger({
      content: "Feed mode",
      props: { class: "btn btn-sm btn-outline-secondary", "data-testid": "hmr-select-trigger" },
      state: select,
    })}
    ${Select.Content({
      content: html`${Select.Option({
        content: "Global feed",
        id: "hmr-select-global",
        state: select,
        value: "global",
      })}`,
      label: "Feed mode",
      state: select,
    })}
  </section>`;
});
