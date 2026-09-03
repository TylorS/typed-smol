import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template";
import { Effect } from "effect";
import { Window } from "happy-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { curriculumDemo } from "../../tutorial/Demos.js";

describe("curriculum hydration", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("adopts the server Counter node, restores its value, and wires interaction", async () => {
    const markup = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(
          html`<section data-curriculum-demo="counter-hydrated">
            ${curriculumDemo("counter-hydrated")!}
          </section>`,
        ).pipe(Effect.provide(HtmlRenderTemplate)),
      ),
    );
    const window = new Window({ url: "https://example.test/typed-smol/explore/quick-start" });
    window.document.body.innerHTML = markup;
    const document = window.document as unknown as Document;
    const output = document.querySelector<HTMLOutputElement>("output")!;
    const increase = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "Increase",
    )!;

    expect(output.textContent).toBe("7");
    vi.stubGlobal("window", window);
    vi.stubGlobal("document", document);

    await import("../../client.js");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const adopted = document.querySelector<HTMLOutputElement>("output")!;
    increase.click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(adopted).toBe(output);
    expect(adopted.textContent).toBe("8");
  });

  it("removes the conditional Clear completed control when no completed Todos remain", async () => {
    const markup = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(
          html`<section data-curriculum-demo="todo-8">${curriculumDemo("todo-8")!}</section>`,
        ).pipe(Effect.provide(HtmlRenderTemplate)),
      ),
    );
    const window = new Window({
      url: "https://example.test/typed-smol/explore/tutorial/persist-the-list",
    });
    window.document.body.innerHTML = markup;
    const document = window.document as unknown as Document;
    vi.stubGlobal("window", window);
    vi.stubGlobal("document", document);
    vi.stubGlobal("crypto", window.crypto);

    await import("../../client.js");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const clearCompleted = () =>
      [...document.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) => button.textContent?.trim() === "Clear completed",
      );
    await vi.waitFor(() => expect(clearCompleted()).toBeDefined());
    clearCompleted()!.click();
    await vi.waitFor(() => expect(clearCompleted()).toBeUndefined());

    expect(document.querySelector(".todo-demo")?.textContent).toContain("2 items left");
  });
});
