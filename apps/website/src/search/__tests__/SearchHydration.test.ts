import { Effect, Fiber, Layer } from "effect";
import { Window } from "happy-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchResult } from "../../docs/Search.js";
import { searchHydration } from "../SearchHydration.js";

const markup = `
  <button type="button" data-search-open>Search</button>
  <dialog data-search-dialog>
    <button type="button" data-search-close>Close</button>
    <input data-search-input />
    <div data-search-results></div>
  </dialog>
`;

const start = (
  document: Document,
  search: (query: string) => Promise<ReadonlyArray<SearchResult>> = async () => [],
) => Effect.runFork(Layer.launch(searchHydration({ document, search, debounceMillis: 0 })));

describe("search hydration", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("owns the modal focus lifecycle and removes listeners when its Effect scope closes", async () => {
    const window = new Window();
    window.document.body.innerHTML = markup;
    const document = window.document as unknown as Document;
    const trigger = document.querySelector<HTMLElement>("[data-search-open]")!;
    const dialog = document.querySelector<HTMLDialogElement>("[data-search-dialog]")!;
    const close = document.querySelector<HTMLButtonElement>("[data-search-close]")!;
    const input = document.querySelector<HTMLInputElement>("[data-search-input]")!;
    const fiber = start(document);

    trigger.focus();
    trigger.click();
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    input.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }) as unknown as Event,
    );
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    close.click();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await Effect.runPromise(Fiber.interrupt(fiber));
    trigger.click();
    expect(dialog.open).toBe(false);
  });

  it("moves from the query into results and between result links with arrow keys", async () => {
    vi.useFakeTimers();
    const window = new Window();
    window.document.body.innerHTML = markup;
    const document = window.document as unknown as Document;
    const input = document.querySelector<HTMLInputElement>("[data-search-input]")!;
    const fiber = start(document, async () => [
      {
        id: "guide:fx",
        title: "Build an Fx",
        kind: "guide",
        text: "construct producers",
        href: "/explore/building-fx",
        score: 2,
      },
      {
        id: "guide:consume-fx",
        title: "Consume an Fx",
        kind: "guide",
        text: "observe producers",
        href: "/explore/consuming-fx",
        score: 1,
      },
    ]);

    input.value = "Fx";
    input.dispatchEvent(new window.Event("input", { bubbles: true }) as unknown as Event);
    await vi.runAllTimersAsync();
    const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-search-results] a")];
    expect(links).toHaveLength(2);

    input.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }) as unknown as Event,
    );
    expect(document.activeElement).toBe(links[0]);

    links[0]!.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }) as unknown as Event,
    );
    expect(document.activeElement).toBe(links[1]);

    links[1]!.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }) as unknown as Event,
    );
    expect(document.activeElement).toBe(links[0]);

    await Effect.runPromise(Fiber.interrupt(fiber));
  });

  it("opens from the global shortcut and returns body focus to the visible trigger", async () => {
    const window = new Window();
    window.document.body.innerHTML = markup;
    const document = window.document as unknown as Document;
    const trigger = document.querySelector<HTMLElement>("[data-search-open]")!;
    const input = document.querySelector<HTMLInputElement>("[data-search-input]")!;
    const fiber = start(document);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      }) as unknown as Event,
    );
    expect(document.activeElement).toBe(input);

    input.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }) as unknown as Event,
    );
    expect(document.activeElement).toBe(trigger);

    await Effect.runPromise(Fiber.interrupt(fiber));
  });
});
