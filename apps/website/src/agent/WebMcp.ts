interface WebMcpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly annotations: { readonly readOnlyHint: true };
  readonly execute: (input: Record<string, unknown>) => unknown;
}

interface ModelContext {
  registerTool(tool: WebMcpTool): void | (() => void) | { unregister(): void };
}

export const registerWebMcp = (document: Document): (() => void) => {
  const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (modelContext === undefined) return () => {};
  const siteBase = document.documentElement.dataset.siteBase ?? "/";
  const registrations = [
    {
      name: "search_docs",
      description: "Search Typed guides, glossary terms, and public symbols.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number" } },
        required: ["query"],
        additionalProperties: false,
      },
      execute: (input: Record<string, unknown>) =>
        import("./Operations.js").then(({ operations }) =>
          operations.search(String(input.query ?? ""), Number(input.limit ?? 10)),
        ),
    },
    {
      name: "get_symbol",
      description: "Get one complete normalized public exposure payload by stable ID.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
      execute: (input: Record<string, unknown>) =>
        import("./Operations.js").then(({ operations }) =>
          operations.symbol(String(input.id ?? ""), siteBase),
        ),
    },
    {
      name: "get_current_symbol",
      description: "Get the complete normalized exposure payload for the current reference route.",
      inputSchema: { type: "object", additionalProperties: false },
      execute: () => {
        const id = document.querySelector<HTMLElement>("[data-symbol-id]")?.dataset.symbolId;
        return id === undefined
          ? null
          : import("./Operations.js").then(({ operations }) => operations.symbol(id, siteBase));
      },
    },
    {
      name: "get_related_docs",
      description: "Get the glossary and documentation links visible on the current page.",
      inputSchema: { type: "object", additionalProperties: false },
      execute: () => {
        const base = new URL(siteBase, document.baseURI);
        const prefixes = ["glossary", "explore", "reference"].map(
          (segment) => `${base.pathname}${segment}`,
        );
        return [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
          .filter(({ href }) => {
            const target = new URL(href, document.baseURI);
            return (
              target.origin === base.origin &&
              prefixes.some((prefix) => target.pathname.startsWith(prefix))
            );
          })
          .map(({ href, textContent }) => ({ href, title: textContent?.trim() ?? "" }));
      },
    },
  ] as const;
  const cleanup = registrations.flatMap((tool) => {
    const registration = modelContext.registerTool({
      ...tool,
      annotations: { readOnlyHint: true },
    });
    if (typeof registration === "function") return [registration];
    if (registration !== undefined) return [() => registration.unregister()];
    return [];
  });
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    for (let index = cleanup.length - 1; index >= 0; index--) cleanup[index]!();
  };
};
