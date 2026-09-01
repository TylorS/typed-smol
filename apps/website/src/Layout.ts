import { CurrentPath } from "@typed/navigation";
import { html } from "@typed/template";
import { Effect } from "effect";
import clientUrl from "./client.js?url";
import { pageTitle } from "./PageTitle.js";
import { canonicalSiteOrigin } from "./Site.js";
import { siteHref } from "./SiteHref.js";

const basePath = import.meta.env.BASE_URL.replace(/\/$/u, "");
const clientScriptUrl = import.meta.env.DEV ? clientUrl : siteHref("/client.js");
const title = Effect.map(CurrentPath, (path) => pageTitle(path, basePath));
const primaryLink = (currentPath: string, path: string, label: string) => {
  const href = siteHref(path);
  const current = currentPath === path || currentPath.startsWith(`${path}/`);
  return current
    ? html`<a href=${href} aria-current="page">${label}</a>`
    : html`<a href=${href}>${label}</a>`;
};
const primaryNavigation = Effect.map(
  CurrentPath,
  (path) =>
    html`${primaryLink(path, "/explore", "Explore")}${primaryLink(
      path,
      "/integrate",
      "Integrate",
    )}${primaryLink(path, "/reference", "Reference")}`,
);

export const Layout = ({ content }: { readonly content: unknown }) => html`
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#030806" />
      <base href=${siteHref("/")} />
      <meta
        name="description"
        content="Typed is cooperative, Effect-native infrastructure for applications, design systems, and frameworks."
      />
      <link rel="canonical" href="${canonicalSiteOrigin}/" />
      <link rel="alternate" type="text/markdown" href="${canonicalSiteOrigin}/index.md" />
      <link rel="icon" type="image/png" href=${siteHref("/favicon.png")} />
      <link rel="stylesheet" href=${siteHref("/styles.css")} />
      <title>${title}</title>
    </head>
    <body>
      <a class="skip" href="#main-content">Skip to content</a>
      <header class="site-header">
        <a class="brand" href=${siteHref("/")} aria-label="Typed home">
          <span class="typewriter" aria-hidden="true"></span>
        </a>
        <nav aria-label="Primary navigation">${primaryNavigation}</nav>
        <div class="header-utilities">
          <a class="utility" href=${siteHref("/glossary")}>Glossary</a>
          <button
            class="search-trigger"
            type="button"
            data-search-open
            aria-haspopup="dialog"
            aria-controls="docs-search-dialog"
            aria-expanded="false"
          >
            Search <span aria-hidden="true">⌘K</span>
          </button>
        </div>
      </header>

      <div id="app">${content}</div>

      <dialog
        id="docs-search-dialog"
        class="search-dialog"
        data-search-dialog
        aria-labelledby="search-title"
      >
        <div class="search-dialog__form" role="search">
          <div class="search-dialog__header">
            <div>
              <span class="index">REFERENCE / FIND</span>
              <h2 id="search-title">Search Typed</h2>
            </div>
            <button class="search-close" type="button" data-search-close aria-label="Close search">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <label class="search-label" for="docs-search-input"
            >Search guides, packages, and symbols</label
          >
          <input
            id="docs-search-input"
            name="q"
            type="search"
            autocomplete="off"
            placeholder="Try RefSubject or DomRenderEvent"
            data-search-input
          />
          <div class="search-results" data-search-results aria-live="polite">
            <p>Start typing to search the documentation.</p>
          </div>
        </div>
      </dialog>

      <footer>
        <a class="brand" href=${siteHref("/")} aria-label="Typed home">
          <span class="typewriter" aria-hidden="true"></span>
        </a>
        <p>Cooperative infrastructure for the web, built on Effect.</p>
        <nav aria-label="Resources">
          <a href="https://www.effect.website/docs/v4">Effect v4</a>
          <a href=${siteHref("/glossary")}>Glossary</a>
          <a href=${siteHref("/llms.txt")}>llms.txt</a>
          <a href=${siteHref("/.well-known/agent-skills/index.json")}>Agent Skill</a>
          <a href=${siteHref("/docs-manifest.json")}>Manifest</a>
        </nav>
      </footer>
      <script type="module" src=${clientScriptUrl}></script>
    </body>
  </html>
`;
