import { describe, expect, expectTypeOf, it } from "vitest";
import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import {
  analyzeTemplate,
  createTemplateFallback,
  emitDomTemplate,
  emitServerTemplate,
} from "@typed/compiler";
import { hydrate, mount, renderServer, type MountedApp } from "../index.js";

const strings = (...values: readonly string[]): TemplateStringsArray =>
  Object.assign([...values], { raw: [...values] }) as unknown as TemplateStringsArray;

describe("@typed/app runtime templates", () => {
  it("mounts compiled DOM templates", async () => {
    const root = createRoot();
    const template = strings("<main><h1>", "</h1></main>");
    const compiled = emitDomTemplate(analyzeTemplate(template));

    const mounted = await Effect.runPromise(mount(compiled, { root, values: ["Ada"] }));

    expect(mounted.root).toBe(root);
    expect(mounted.nodes).toHaveLength(1);
    expect(root.innerHTML).toBe("<main><h1>Ada<!--/n_0--></h1></main>");
  });

  it("hydrates compiled DOM templates through the same runtime contract", async () => {
    const root = createRoot();
    const template = strings("<section>", "</section>");
    const compiled = emitDomTemplate(analyzeTemplate(template));

    const mounted = await Effect.runPromise(hydrate(compiled, { root, values: ["ready"] }));

    expect(mounted.root).toBe(root);
    expect(root.innerHTML).toBe("<section>ready<!--/n_0--></section>");
  });

  it("renders compiled server templates", async () => {
    const template = strings("<p>", "</p>");
    const compiled = emitServerTemplate(analyzeTemplate(template));

    const result = await Effect.runPromise(renderServer(compiled, { values: ["Ada"] }));

    expect(result.html).toBe(
      "<!--t_KwZ/fKKViAs=--><p><!--n_0-->Ada<!--/n_0--></p><!--/t_KwZ/fKKViAs=-->",
    );
  });

  it("mounts, hydrates, and server-renders fallback runtime templates", async () => {
    const root = createRoot();
    const hydrateRoot = createRoot();
    const fallback = createTemplateFallback<readonly [string]>({
      moduleId: "/src/routes/fallback.ts",
      reason: "explicit opt-out",
      template: strings("<article>", "</article>"),
    });

    await Effect.runPromise(mount(fallback, { root, values: ["mounted"] }));
    await Effect.runPromise(hydrate(fallback, { root: hydrateRoot, values: ["hydrated"] }));
    const rendered = await Effect.runPromise(renderServer(fallback, { values: ["server"] }));

    expect(root.innerHTML).toBe("<article>mounted<!--/n_0--></article>");
    expect(hydrateRoot.innerHTML).toBe("<article>hydrated<!--/n_0--></article>");
    expect(rendered.html).toBe(
      "<!--t_v+c4/dYnCdc=--><article><!--n_0-->server<!--/n_0--></article><!--/t_v+c4/dYnCdc=-->",
    );
  });

  it("preserves Effect value types across runtime functions", () => {
    const root = createRoot();
    const fallback = createTemplateFallback<readonly [Effect.Effect<number>]>({
      moduleId: "/src/routes/types.ts",
      reason: "type test",
      template: strings("<span>", "</span>"),
    });

    expectTypeOf(mount(fallback, { root, values: [Effect.succeed(1)] })).toExtend<
      Effect.Effect<MountedApp>
    >();
    expectTypeOf(renderServer(fallback, { values: [Effect.succeed(1)] })).toExtend<
      Effect.Effect<{ readonly html: string }>
    >();
  });
});

function createRoot(): HTMLElement {
  return (new Window() as unknown as globalThis.Window & typeof globalThis).document.createElement(
    "div",
  );
}
