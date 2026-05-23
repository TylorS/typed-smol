import { describe, expect, it } from "vitest";
import { typedRouteVitePlugin } from "./routeVitePlugin.js";

describe("typedRouteVitePlugin", () => {
  it("transforms route continuations and appends guarded Vite HMR runtime", async () => {
    const plugin = typedRouteVitePlugin();
    const result = await transform(
      plugin,
      `
        const title = "Count";
        export const route = () => {
          const renderTitle = () => title;
          return html\`<button>\${renderTitle}</button>\`;
        };
      `,
      "/src/routes/counter.ts",
    );

    expect(result?.code).toContain("__typedRouteContinuations");
    expect(result?.code).toContain("import.meta");
    expect(result?.code).toContain("__typedRouteHot.accept()");
    expect(result?.code).toContain("__typedRouteHot.dispose");
    expect(result?.code).toContain("__typedRouteContinuationSerializables");
  });

  it("invalidates dev HMR when route diagnostics fail closed", async () => {
    const plugin = typedRouteVitePlugin({ diagnostics: "warn" });
    const sent: unknown[] = [];
    const invalidated: unknown[] = [];
    const result = await handleHotUpdate(plugin, {
      file: "/src/routes/mutable.ts",
      modules: [{ id: "/src/routes/mutable.ts" }],
      read: () => `
        let count = 0;
        export const route = () => {
          const increment = () => count++;
          return html\`<button>\${increment}</button>\`;
        };
      `,
      server: {
        moduleGraph: {
          invalidateModule: (mod: unknown) => invalidated.push(mod),
        },
        ws: {
          send: (message: unknown) => sent.push(message),
        },
      },
      timestamp: 1,
    });

    expect(result).toEqual([]);
    expect(invalidated).toEqual([{ id: "/src/routes/mutable.ts" }]);
    expect(sent).toEqual([{ type: "full-reload" }]);
  });
});

async function transform(
  plugin: ReturnType<typeof typedRouteVitePlugin>,
  sourceText: string,
  id: string,
): Promise<{ readonly code: string; readonly map: null } | null> {
  const hook = plugin.transform;
  if (typeof hook !== "function") throw new Error("Expected function transform hook.");
  return (await hook.call({ warn: () => {}, error: (error: unknown) => { throw error; } }, sourceText, id)) as
    | { readonly code: string; readonly map: null }
    | null;
}

async function handleHotUpdate(
  plugin: ReturnType<typeof typedRouteVitePlugin>,
  context: unknown,
): Promise<unknown> {
  const hook = plugin.handleHotUpdate;
  if (typeof hook !== "function") throw new Error("Expected function handleHotUpdate hook.");
  return hook.call({}, context as never);
}
