import {
  analyzeTemplate,
  createTemplateFallback,
  emitDomTemplate,
  emitServerTemplate,
} from "@typed/compiler";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { hydrate, mount, renderServer } from "./runtimeTemplates/index.js";

const strings = (...values: readonly string[]): TemplateStringsArray =>
  Object.assign([...values], { raw: [...values] }) as unknown as TemplateStringsArray;

describe("runtime template functions", () => {
  it("mounts and hydrates compiled DOM templates", async () => {
    const root = createRoot();
    const hydrateRoot = createRoot();
    const template = strings("<main><h1>", "</h1></main>");
    const compiled = emitDomTemplate(analyzeTemplate(template));

    await Effect.runPromise(mount(compiled, { root, values: ["Ada"] }));
    await Effect.runPromise(hydrate(compiled, { root: hydrateRoot, values: ["Grace"] }));

    expect(root.innerHTML).toBe("<main><h1>Ada<!--/n_0--></h1></main>");
    expect(hydrateRoot.innerHTML).toBe("<main><h1>Grace<!--/n_0--></h1></main>");
  });

  it("renders compiled and fallback templates on the server", async () => {
    const template = strings("<p>", "</p>");
    const compiled = emitServerTemplate(analyzeTemplate(template));
    const fallback = createTemplateFallback<readonly [string]>({
      moduleId: "/src/routes/fallback.tsx",
      reason: "test fallback",
      template,
    });

    const compiledResult = await Effect.runPromise(renderServer(compiled, { values: ["Ada"] }));
    const fallbackResult = await Effect.runPromise(renderServer(fallback, { values: ["Ada"] }));

    expect(compiledResult.html).toContain("<p><!--n_0-->Ada<!--/n_0--></p>");
    expect(fallbackResult.html).toContain("<p><!--n_0-->Ada<!--/n_0--></p>");
  });
});

function createRoot(): HTMLElement {
  return (new Window() as unknown as globalThis.Window & typeof globalThis).document.createElement(
    "div",
  );
}
