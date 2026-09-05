import client from "@typed/astro/client";
import server from "@typed/astro/server";
import { Window } from "happy-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Demo from "../../site/components/CurriculumDemo.js";

const cleanup: Array<() => void> = [];

const island = (markup: string) => {
  const window = new Window({ url: "https://example.test/typed-smol/explore/quick-start" });
  const document = window.document as unknown as Document;
  const host = document.createElement("astro-island");
  host.innerHTML = markup;
  document.body.append(host);
  vi.stubGlobal("window", window);
  vi.stubGlobal("document", document);
  cleanup.push(() => {
    host.dispatchEvent(new window.Event("astro:unmount") as unknown as Event);
    host.remove();
  });
  return host;
};

describe("curriculum Astro islands", () => {
  afterEach(async () => {
    for (const unmount of cleanup.splice(0)) unmount();
    await Promise.resolve();
    vi.unstubAllGlobals();
  });

  it("adopts the server Counter node, restores its value, and wires interaction", async () => {
    const { html } = await server.renderToStaticMarkup(Demo, { id: "counter-hydrated" });
    const host = island(html);
    const output = host.querySelector<HTMLOutputElement>("output")!;
    const increase = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "Increase",
    )!;

    expect(output.textContent).toBe("7");
    await client(host)(Demo, { id: "counter-hydrated" });
    expect(host.querySelector("output")).toBe(output);
    increase.click();
    await vi.waitFor(() => expect(output.textContent).toBe("8"));
  });

  it("mounts the client-only Todo preview and removes its conditional completed control", async () => {
    const host = island("<p>The interactive example loads in the browser.</p>");
    await client(host)(Demo, { id: "todo-8" }, {}, { client: "only" });
    const clearCompleted = () =>
      [...host.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) => button.textContent?.trim() === "Clear completed",
      );

    expect(host.textContent).not.toContain("The interactive example loads in the browser.");
    expect(host.innerHTML).not.toContain("data-typed-refsubject");
    expect(clearCompleted()).toBeDefined();
    clearCompleted()!.click();
    await vi.waitFor(() => expect(clearCompleted()).toBeUndefined());
    expect(host.querySelector(".todo-demo")?.textContent).toContain("2 items left");
  });
});
