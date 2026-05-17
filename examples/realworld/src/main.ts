export const renderShell = (): string => [
  '<main class="app-shell" data-page="empty">',
  '  <nav class="navbar navbar-light">',
  '    <div class="container">',
  '      <a class="navbar-brand" href="/">conduit</a>',
  "    </div>",
  "  </nav>",
  '  <section class="home-page">',
  '    <div class="banner">',
  '      <div class="container">',
  "        <h1>conduit</h1>",
  "      </div>",
  "    </div>",
  "  </section>",
  "</main>",
].join("\n");

export const mountBrowserShell = (
  root: HTMLElement | null = globalThis.document?.getElementById("app") ?? null,
): void => {
  if (root) {
    root.innerHTML = renderShell();
  }
};
