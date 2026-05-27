import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { EventHandler, html } from "@typed/template";
import { mount } from "./mount.js";

describe("mount compiled templates", () => {
  it("passes the DOM runtime to compiled renderInto", async () => {
    const document = new Window().document;
    const root = document.createElement("main");
    const runtime = { resumeAction: () => Effect.void };
    const calls: unknown[] = [];
    const template = {
      renderInto: async (_root: HTMLElement, _values?: ArrayLike<unknown>, received?: unknown) => {
        calls.push(received);
        root.replaceChildren(document.createTextNode("ok"));
        return Array.from(root.childNodes);
      },
    };

    await Effect.runPromise(mount(template, { root, runtime }));

    expect(calls).toEqual([runtime]);
  });

  it("keeps runtime template event handlers active until dispose", async () => {
    const window = new Window();
    const root = window.document.createElement("main");
    let submits = 0;
    const template = html`<form
      onsubmit=${EventHandler.make(
        () => {
          submits += 1;
        },
        { preventDefault: true },
      )}
    >
      <button type="submit">Save</button>
    </form>`;

    const mounted = await Effect.runPromise(mount(template, { root }));
    const form = root.querySelector("form");
    if (!(form instanceof window.HTMLFormElement)) throw new Error("missing form");

    const event = new window.Event("submit", { bubbles: true, cancelable: true });
    const allowedDefault = form.dispatchEvent(event);
    expect(submits).toBe(1);
    expect(allowedDefault).toBe(false);

    await Effect.runPromise(mounted.dispose);
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    expect(submits).toBe(1);
  });

  it("keeps delayed child renderables active after mount returns", async () => {
    const window = new Window();
    const root = window.document.createElement("main");
    const template = html`<section>
      ${Fx.mergeAll(Fx.succeed(html`<p>Loading</p>`), Fx.at(html`<p>Loaded</p>`, "10 millis"))}
    </section>`;

    const mounted = await Effect.runPromise(mount(template, { root }));

    expect(root.textContent).toContain("Loading");
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(root.textContent).toContain("Loaded");

    await Effect.runPromise(mounted.dispose);
  });

  it("passes the DOM devtools observer to runtime html fallback templates", async () => {
    const window = new Window();
    const root = window.document.createElement("main");
    const mountedTemplates: string[] = [];

    const mounted = await Effect.runPromise(
      mount(html`<section class="instrumented">Mounted</section>`, {
        root,
        runtime: {
          devtools: {
            onTemplateMounted: (event) => {
              mountedTemplates.push(event.root.className);
            },
          },
        },
      }),
    );

    expect(mountedTemplates).toEqual(["instrumented"]);
    await Effect.runPromise(mounted.dispose);
  });

  it("preserves form control edits made before hydration finishes", async () => {
    const window = new Window();
    const root = window.document.createElement("main");
    root.innerHTML = `<form><input name="username" /><button type="submit">Save</button></form>`;
    const existing = root.querySelector("input");
    if (!(existing instanceof window.HTMLInputElement)) throw new Error("missing input");
    existing.value = "reader";

    let submitted = "";
    const template = html`<form
      onsubmit=${EventHandler.make(
        (event: SubmitEvent) => {
          const form = event.currentTarget as HTMLFormElement;
          const input = form.elements.namedItem("username") as HTMLInputElement | null;
          submitted = input?.value ?? "";
        },
        { preventDefault: true },
      )}
    >
      <input name="username" /><button type="submit">Save</button>
    </form>`;

    await Effect.runPromise(mount(template, { root }));
    const hydrated = root.querySelector("input");
    const form = root.querySelector("form");
    if (!(hydrated instanceof window.HTMLInputElement)) throw new Error("missing hydrated input");
    if (!(form instanceof window.HTMLFormElement)) throw new Error("missing hydrated form");

    expect(hydrated.value).toBe("reader");
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    expect(submitted).toBe("reader");
  });
});
