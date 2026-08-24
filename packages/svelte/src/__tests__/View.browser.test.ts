import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { tick } from "svelte";
import Stateful from "./fixtures/Stateful.svelte";
import { Dom, view } from "../lib/index.js";

describe("Svelte view DOM renderer", () => {
  const roots = new Set<HTMLElement>();

  afterEach(() => {
    for (const root of roots) root.remove();
    roots.clear();
  });

  it("mounts once, updates props through a store, and unmounts with the Typed scope", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    roots.add(root);

    let mounts = 0;
    let destroys = 0;
    const onMounted = () => mounts++;
    const onDestroyed = () => destroys++;

    await Effect.gen(function* () {
      const props = yield* RefSubject.make({ label: "one", onMounted, onDestroyed });

      yield* view(Stateful, props).pipe(render(root), Fx.drain, Effect.forkScoped);
      yield* waitForText(root, "one:0");

      const button = root.querySelector<HTMLButtonElement>("[data-stateful]")!;
      button.click();
      yield* Effect.promise(() => tick());
      expect(button.textContent).toBe("one:1");

      yield* RefSubject.set(props, { label: "two", onMounted, onDestroyed });
      yield* waitForText(root, "two:1");

      expect(root.querySelector("[data-stateful]")).toBe(button);
      expect(mounts).toBe(1);
      expect(destroys).toBe(0);
    }).pipe(
      Effect.provide(Layer.merge(DomRenderTemplate.using(document), Dom)),
      Effect.scoped,
      Effect.runPromise,
    );

    await expect.poll(() => destroys).toBe(1);
    expect(root.querySelector("[data-stateful]")).toBeNull();
  });

  it("hydrates Svelte server output in place before accepting Typed prop updates", async () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<!--t_avqi8lk/Kco=--><typed-svelte style="display: contents"><!--n_1--><typed-svelte-root style="display: contents"><!--[--><!--[--><button data-stateful="">server:0</button><!--]--><!--]--></typed-svelte-root><!--/n_1--></typed-svelte><!--/t_avqi8lk/Kco=-->';
    document.body.append(root);
    roots.add(root);

    const serverButton = root.querySelector<HTMLButtonElement>("[data-stateful]")!;
    let mounts = 0;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => void 0);
    const error = vi.spyOn(console, "error").mockImplementation(() => void 0);

    try {
      await Effect.gen(function* () {
        const props = yield* RefSubject.make({ label: "server", onMounted: () => mounts++ });

        yield* view(Stateful, props).pipe(render(root), Fx.drain, Effect.forkScoped);
        yield* Effect.promise(() => expect.poll(() => mounts).toBe(1));

        expect(root.querySelector("[data-stateful]")).toBe(serverButton);

        serverButton.click();
        yield* Effect.promise(() => tick());
        expect(serverButton.textContent).toBe("server:1");

        yield* RefSubject.set(props, { label: "client", onMounted: () => mounts++ });
        yield* waitForText(root, "client:1");

        expect(root.querySelector("[data-stateful]")).toBe(serverButton);
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), Dom)),
        Effect.scoped,
        Effect.runPromise,
      );

      expect(warn.mock.calls.flat().join("\n")).not.toContain("hydration");
      expect(error.mock.calls.flat().join("\n")).not.toContain("hydration");
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });
});

function waitForText(root: HTMLElement, text: string): Effect.Effect<void> {
  return Effect.promise(() => expect.poll(() => root.textContent).toContain(text));
}
