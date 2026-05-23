import { assert, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Dialog from "./Dialog.js";
import * as Dom from "./Dom.js";
import * as Form from "./Form.js";
import * as Select from "./Select.js";
import * as Tooltip from "./Tooltip.js";

describe("typed/ui compact usage", () => {
  it("renders dialog, form, select, tooltip, and host composition together", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      Object.assign(window.HTMLDialogElement.prototype, {
        showModal(this: HTMLDialogElement) {
          this.setAttribute("open", "");
        },
      });
      const dialog = yield* Dialog.makeState({ open: false });
      const form = yield* Form.makeState({ values: { status: "draft" } });
      const select = yield* Select.makeState<string>({
        id: "status-select",
        value: "draft",
        activeId: "draft",
      });
      const tooltip = yield* Tooltip.makeState({ id: "status-help" });
      let hiddenInputRefCalled = false;

      yield* render(
        html`
          ${Dialog.Trigger({
            state: dialog,
            controls: "settings",
            content: "Settings",
            host: (props, content) =>
              html`<button ...${props} data-testid="settings-trigger">${content}</button>`,
          })}
          ${Dialog.Content({
            state: dialog,
            id: "settings",
            label: "Settings",
            initialFocus: "#status-trigger",
            content: html`
              ${Tooltip.Anchor({ state: tooltip, content: "Status" })}
              ${Tooltip.Content({ state: tooltip, content: "Choose a publishing state" })}
              ${Form.Form({
                state: form,
                content: html`
                  ${Select.Trigger({
                    state: select,
                    content: "Draft",
                    props: { id: "status-trigger" },
                  })}
                  ${Select.Content({
                    state: select,
                    label: "Status",
                    content: html`
                      ${Select.Option({
                        state: select,
                        id: "draft",
                        value: "draft",
                        content: "Draft",
                      })}
                      ${Select.Option({
                        state: select,
                        id: "published",
                        value: "published",
                        content: "Published",
                      })}
                    `,
                  })}
                  ${Select.HiddenInput({
                    state: select,
                    formState: form,
                    name: "status",
                    props: {
                      ref: () => {
                        hiddenInputRefCalled = true;
                      },
                    },
                    host: (props) => {
                      const split = Dom.splitRef(props);
                      return html`<input ...${split.props} ref=${split.ref} />`;
                    },
                  })}
                `,
              })}
            `,
          })}
        `,
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const trigger = window.document.querySelector("[data-testid=settings-trigger]");
      assert(trigger instanceof window.HTMLButtonElement);
      trigger.click();
      yield* Effect.sleep(10);

      expect((yield* dialog).open).toBe(true);
      expect(window.document.activeElement?.id).toBe("status-trigger");
      expect(hiddenInputRefCalled).toBe(true);

      const published = window.document.getElementById("published");
      assert(published instanceof window.HTMLElement);
      published.click();
      yield* Effect.sleep(10);

      expect((yield* select).value).toBe("published");
      expect((yield* form).values.status).toBe("published");
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
