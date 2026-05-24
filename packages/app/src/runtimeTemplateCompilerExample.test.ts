import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { runRuntimeTemplateCompilerExample } from "./runtimeTemplateCompilerExample.js";

describe("runtime template compiler example", () => {
  it("runs optimized server render, DOM hydrate, and route service HMR together", async () => {
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;
    const root = window.document.createElement("div");
    const globalObject: Record<PropertyKey, unknown> = {};

    const result = await runRuntimeTemplateCompilerExample({ globalObject, root });

    expect(result.serverHtml).toMatchInlineSnapshot(`"<!--t_fRRFUsDffAM=--><main><p>Count: <!--n_0-->1<!--/n_0--></p></main><!--/t_fRRFUsDffAM=-->"`);
    expect(result.domHtml).toMatchInlineSnapshot(`"<main><p>Count: 1<!--/n_0--></p></main>"`);
    expect(result.hmrStateReused).toBe(true);
    expect(result.hmrServiceIds).toEqual([
      "@example/runtime-template-compiler/Count",
      "@example/runtime-template-compiler/Count",
    ]);
  });
});
