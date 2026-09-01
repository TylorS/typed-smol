import { html } from "@typed/template";
import { ExploreNavigation, ExplorePagination } from "../components/ExploreNavigation.js";
import type { GuideDocumentation } from "../docs/Model.js";
import { headingId, renderGuideMarkdown } from "../docs/RenderMarkdown.js";
import { UiAccessibilityCatalog } from "../docs/UiAccessibility.js";

export const Guide = (guide: GuideDocumentation) => html`
  <main
    id="main-content"
    class=${
      guide.slug === "choosing-ui-components"
        ? "page guide-page guide-page--catalog"
        : "page guide-page"
    }
    tabindex="-1"
  >
    <a class="back" href="/explore">← Explore</a>

    <header class="guide-intro">
      <span class="index">${guide.kind ?? "guide"} / ${guide.slug}</span>
      <h1>${guide.title}</h1>
      <p>${guide.summary}</p>
    </header>

    <div class="guide-layout">
      ${ExploreNavigation(guide.slug)}

      <div class="reading-width">
        <article class="markdown-body guide-article">
          ${renderGuideMarkdown(guide.body)}
          ${guide.slug === "choosing-ui-components" ? UiAccessibilityCatalog() : null}
        </article>
        ${ExplorePagination(guide.slug)}
      </div>

      <nav class="local-nav guide-toc" aria-label="On this page">
        <strong>On this page</strong>
        ${guide.headings.map((heading) => html`<a href="#${headingId(heading)}">${heading}</a>`)}
      </nav>
    </div>
  </main>
`;
