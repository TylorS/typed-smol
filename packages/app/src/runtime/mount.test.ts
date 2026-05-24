import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { mount } from "./mount.js";

describe("mount compiled templates", () => {
  it("passes the DOM runtime to compiled renderInto", async () => {
    const document = new Window().document;
    const root = document.createElement("main");
    const runtime = { resumeAction: () => Effect.void };
    const calls: unknown[] = [];
    const template = {
      renderInto: async (
        _root: HTMLElement,
        _values?: ArrayLike<unknown>,
        received?: unknown,
      ) => {
        calls.push(received);
        root.replaceChildren(document.createTextNode("ok"));
        return Array.from(root.childNodes);
      },
    };

    await Effect.runPromise(mount(template, { root, runtime }));

    expect(calls).toEqual([runtime]);
  });
});
