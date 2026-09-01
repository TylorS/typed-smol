import { html } from "@typed/template";
import { guides } from "../docs/Content.js";
import type { GuideDocumentation } from "../docs/Model.js";

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
    ? html`<a href="/explore/${guide.slug}" aria-current="page">${content}</a>`
    : html`<a href="/explore/${guide.slug}">${content}</a>`;
};

export const ExploreNavigation = (activeSlug?: string) => html`
  <nav class="explore-navigation" aria-label="Explore documentation">
    <a class="explore-navigation__home" href="/explore">Explore</a>
    ${exploreSections.map(
      (section) => html`
        <section aria-labelledby="explore-nav-${section.name.toLowerCase().replaceAll(" ", "-")}">
          <h2 id="explore-nav-${section.name.toLowerCase().replaceAll(" ", "-")}">
            ${section.name}
          </h2>
          ${section.guides.map((guide) => guideLink(guide, activeSlug))}
        </section>
      `,
    )}
    <section aria-labelledby="explore-nav-next">
      <h2 id="explore-nav-next">Go further</h2>
      <a href="/integrate"><span>Integration recipes</span><small>recipes</small></a>
      <a href="/reference"><span>Complete API</span><small>reference</small></a>
    </section>
  </nav>
`;

export const ExplorePagination = (activeSlug: string) => {
  const index = orderedGuides.findIndex((guide) => guide.slug === activeSlug);
  if (index === -1) return null;

  const previous: CurriculumLink =
    index === 0
      ? { href: "/explore", title: "Explore" }
      : {
          href: `/explore/${orderedGuides[index - 1]!.slug}`,
          title: orderedGuides[index - 1]!.title,
        };
  const next: CurriculumLink =
    index === orderedGuides.length - 1
      ? { href: "/integrate", title: "Integration recipes" }
      : {
          href: `/explore/${orderedGuides[index + 1]!.slug}`,
          title: orderedGuides[index + 1]!.title,
        };

  return html`
    <nav class="guide-pagination" aria-label="Explore curriculum">
      ${paginationLink(previous, "previous")} ${paginationLink(next, "next")}
    </nav>
  `;
};
