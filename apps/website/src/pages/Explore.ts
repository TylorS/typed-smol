import { html } from "@typed/template";
import {
  ExploreMobileNavigation,
  ExploreNavigation,
  exploreSections,
} from "../components/ExploreNavigation.js";
import { siteHref } from "../SiteHref.js";

export const Explore = html`
  <main id="main-content" class="page explore-page" tabindex="-1">
    <header class="page-intro">
      <span class="index">EXPLORE / LEARN TYPED</span>
      <h1>Build up the system</h1>
      <p>
        Follow Typed in the order it composes: push-based work, renderer-independent state,
        renderable structure, accessible UI behavior, and cooperative ownership of the web platform.
      </p>
    </header>

    ${ExploreMobileNavigation()}

    <div class="explore-layout">
      ${ExploreNavigation()}

      <div class="explore-curriculum">
        <section class="explore-section" aria-labelledby="explore-start-here">
          <header>
            <span class="index">START</span>
            <h2 id="explore-start-here">Build an application</h2>
          </header>
          <div class="guide-list">
            <article>
              <span class="guide-kind guide-kind--guide">quick start</span>
              <div>
                <h3>
                  <a href=${siteHref("/explore/quick-start")}>Build your first Counter</a>
                </h3>
                <p>Progress from client-only markup to reactive state and hydration.</p>
              </div>
              <span aria-hidden="true">→</span>
            </article>
            <article>
              <span class="guide-kind guide-kind--guide">tutorial</span>
              <div>
                <h3><a href=${siteHref("/explore/tutorial")}>Build TodoMVC</a></h3>
                <p>Build the complete application one clean architecture boundary at a time.</p>
              </div>
              <span aria-hidden="true">→</span>
            </article>
          </div>
        </section>

        ${exploreSections.map(
          (s, i) => html`
            <section class="explore-section" aria-labelledby="explore-section-${i + 1}">
              <header>
                <span class="index">${String(i + 1).padStart(2, "0")}</span>
                <h2 id="explore-section-${i + 1}">${s.name}</h2>
              </header>
              <div class="guide-list">
                ${s.guides.map(
                  (guide) => html`
                    <article>
                      <span class="guide-kind guide-kind--${guide.kind ?? "concept"}">
                        ${guide.kind ?? "concept"}
                      </span>
                      <div>
                        <h3><a href=${siteHref(`/explore/${guide.slug}`)}>${guide.title}</a></h3>
                        <p>${guide.summary}</p>
                      </div>
                      <span aria-hidden="true">→</span>
                    </article>
                  `,
                )}
              </div>
            </section>
          `,
        )}
      </div>
    </div>
  </main>
`;
