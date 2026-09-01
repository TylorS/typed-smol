import { html } from "@typed/template";
import { guides } from "../docs/Content.js";
import type { GuideDocumentation } from "../docs/Model.js";
import { siteHref } from "../SiteHref.js";

export interface ExploreSection {
  readonly name: string;
  readonly guides: ReadonlyArray<GuideDocumentation>;
}

const guideSections = new Map<string, Array<GuideDocumentation>>();

for (const guide of guides) {
  const name = guide.section ?? "Explore";
  const section = guideSections.get(name);
  if (section === undefined) guideSections.set(name, [guide]);
  else section.push(guide);
}

export const exploreSections: ReadonlyArray<ExploreSection> = Array.from(
  guideSections,
  ([name, sectionGuides]) => ({ name, guides: sectionGuides }),
);

const orderedGuides = guides.toSorted((left, right) => (left.order ?? 0) - (right.order ?? 0));

interface CurriculumLink {
  readonly href: string;
  readonly title: string;
}

const paginationLink = (link: CurriculumLink, direction: "previous" | "next") => html`
  <a class="guide-pagination__link guide-pagination__link--${direction}" href=${link.href}>
    <small>${direction === "previous" ? "← Previous" : "Next →"}</small>
    <strong>${link.title}</strong>
  </a>
`;

const guideLink = (guide: GuideDocumentation, activeSlug?: string) => {
  const content = html`<span>${guide.title}</span><small>${guide.kind ?? "concept"}</small>`;
  return guide.slug === activeSlug
    ? html`<a href=${siteHref(`/explore/${guide.slug}`)} aria-current="page">${content}</a>`
    : html`<a href=${siteHref(`/explore/${guide.slug}`)}>${content}</a>`;
};

const navigationSections = (idPrefix: string, activeSlug?: string) => html`
  ${exploreSections.map(
    (section) => html`
      <section aria-labelledby="${idPrefix}-${section.name.toLowerCase().replaceAll(" ", "-")}">
        <h2 id="${idPrefix}-${section.name.toLowerCase().replaceAll(" ", "-")}">
          ${section.name}
        </h2>
        ${section.guides.map((guide) => guideLink(guide, activeSlug))}
      </section>
    `,
  )}
  <section aria-labelledby="${idPrefix}-next">
    <h2 id="${idPrefix}-next">Go further</h2>
    <a href=${siteHref("/integrate")}><span>Integration recipes</span><small>recipes</small></a>
    <a href=${siteHref("/reference")}><span>Complete API</span><small>reference</small></a>
  </section>
`;

export const ExploreNavigation = (activeSlug?: string) => html`
  <nav class="explore-navigation" aria-label="Explore documentation">
    <a class="explore-navigation__home" href=${siteHref("/explore")}>Explore</a>
    ${navigationSections("explore-nav", activeSlug)}
  </nav>
`;

export const ExploreMobileNavigation = (activeSlug?: string) => html`
  <details class="explore-mobile-navigation">
    <summary>
      <span>Browse Explore</span>
      <span aria-hidden="true">+</span>
    </summary>
    <nav aria-label="Explore documentation">
      <a class="explore-navigation__home" href=${siteHref("/explore")}>Explore overview</a>
      ${navigationSections("explore-mobile-nav", activeSlug)}
    </nav>
  </details>
`;

export const ExplorePagination = (activeSlug: string) => {
  const index = orderedGuides.findIndex((guide) => guide.slug === activeSlug);
  if (index === -1) return null;

  const previous: CurriculumLink =
    index === 0
      ? { href: siteHref("/explore"), title: "Explore" }
      : {
          href: siteHref(`/explore/${orderedGuides[index - 1]!.slug}`),
          title: orderedGuides[index - 1]!.title,
        };
  const next: CurriculumLink =
    index === orderedGuides.length - 1
      ? { href: siteHref("/integrate"), title: "Integration recipes" }
      : {
          href: siteHref(`/explore/${orderedGuides[index + 1]!.slug}`),
          title: orderedGuides[index + 1]!.title,
        };

  return html`
    <nav class="guide-pagination" aria-label="Explore curriculum">
      ${paginationLink(previous, "previous")} ${paginationLink(next, "next")}
    </nav>
  `;
};
