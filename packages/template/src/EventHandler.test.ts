import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as EventHandler from "./EventHandler.js";

describe("EventHandler.action", () => {
  it("creates an EventHandler with a serializable action descriptor", () => {
    const handler = EventHandler.action(
      "profile.save",
      "submit",
      () => Effect.void,
      { component: "ProfileForm", preventDefault: true },
    );

    expect(EventHandler.isEventHandler(handler)).toBe(true);
    expect(EventHandler.isAction(handler)).toBe(true);
    expect(handler.action).toMatchInlineSnapshot(`
      {
        "component": "ProfileForm",
        "event": "submit",
        "id": "profile.save",
      }
    `);
    expect(handler.options).toMatchInlineSnapshot(`
      {
        "preventDefault": true,
      }
    `);
  });

  it("lets compiler-provided descriptors override local action descriptors for DataAttrs", () => {
    const handler = EventHandler.action("toggle", "click", () => Effect.void);

    expect(
      EventHandler.actionDataAttributes("click", handler, {
        component: "cmp:/src/Disclosure.ts#Disclosure",
        event: "click",
        id: "cmp:/src/Disclosure.ts#Disclosure:action:toggle",
      }),
    ).toMatchInlineSnapshot(`
      {
        "typed-action-click-component": "cmp:/src/Disclosure.ts#Disclosure",
        "typed-action-click-event": "click",
        "typed-action-click-id": "cmp:/src/Disclosure.ts#Disclosure:action:toggle",
      }
    `);
  });
});
