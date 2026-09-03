import { html } from "@typed/template";
import { renderGuideMarkdown } from "../docs/RenderMarkdown.js";
import { siteHref } from "../SiteHref.js";
import {
  quickStartSections,
  tutorialSteps,
  type CurriculumFile,
  type TutorialStep,
} from "../tutorial/Content.js";
import { curriculumDemo } from "../tutorial/Demos.js";
import { curriculumDiff, type CurriculumDiffLine } from "../tutorial/Diff.js";

const renderFullFile = (sourceFile: CurriculumFile) =>
  renderGuideMarkdown(`\`\`\`${sourceFile.language}\n${sourceFile.source}\n\`\`\``);

const renderDiffLine = (line: CurriculumDiffLine) =>
  line.kind === "skip"
    ? html`<span class="curriculum-diff__line curriculum-diff__line--skip">
        <span></span><span></span><span></span
        ><span class="curriculum-diff__code">${line.text}</span>
      </span>`
    : html`<span class="curriculum-diff__line curriculum-diff__line--${line.kind}">
        <span class="curriculum-diff__number">${line.oldLine ?? ""}</span>
        <span class="curriculum-diff__number">${line.newLine ?? ""}</span>
        <span class="curriculum-diff__marker" aria-hidden="true"
          >${line.kind === "add" ? "+" : line.kind === "remove" ? "−" : " "}</span
        >
        <span class="curriculum-diff__code">${line.text === "" ? " " : line.text}</span>
      </span>`;

interface PreviousFile {
  readonly file: CurriculumFile;
  readonly step: number;
}

const renderFile = (sourceFile: CurriculumFile, previous?: PreviousFile) => {
  if (previous === undefined) {
    return html`<details class="curriculum-file" open>
      <summary><code>${sourceFile.name}</code><span>new file</span></summary>
      ${renderFullFile(sourceFile)}
    </details>`;
  }
  if (previous.file.source === sourceFile.source) {
    return html`<details class="curriculum-file curriculum-file--unchanged">
      <summary>
        <code>${sourceFile.name}</code><span>unchanged since step ${previous.step}</span>
      </summary>
      ${renderFullFile(sourceFile)}
    </details>`;
  }
  const lines = curriculumDiff(previous.file.source, sourceFile.source);
  return html`<details class="curriculum-file curriculum-file--diff" open>
    <summary>
      <code>${sourceFile.name}</code><span>changes since step ${previous.step}</span>
    </summary>
    <pre class="curriculum-diff" aria-label="Changes to ${sourceFile.name}"><code
        >${lines.map(renderDiffLine)}</code
      ></pre>
    <details class="curriculum-file__current">
      <summary>View current file</summary>
      ${renderFullFile(sourceFile)}
    </details>
  </details>`;
};

const previousFile = <A extends { readonly files: ReadonlyArray<CurriculumFile> }>(
  steps: ReadonlyArray<A>,
  index: number,
  name: string,
): PreviousFile | undefined => {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const match = steps[cursor]!.files.find((sourceFile) => sourceFile.name === name);
    if (match !== undefined) return { file: match, step: cursor + 1 };
  }
  return undefined;
};

const demoHost = (id: string, label: string) => {
  const demo = curriculumDemo(id);
  return html`<section class="curriculum-demo" aria-label=${label} data-curriculum-demo=${id}>
    ${demo ?? html`<p>Unknown preview: ${id}</p>`}
  </section>`;
};

export const QuickStart = html`<main
  id="main-content"
  class="page curriculum-page quick-start-page"
  tabindex="-1"
>
  <header class="curriculum-hero">
    <span class="index">QUICK START / COUNTER</span>
    <h1>Build your first Typed application</h1>
    <p>
      Begin with one client-only template. Add reactive state, make its lifetime explicit, render it
      on the server, and hydrate the same state in the browser.
    </p>
    <div class="curriculum-hero__actions">
      <a class="button-link" href="#install">Install and start</a>
      <a href=${siteHref("/explore/tutorial")}>Continue to TodoMVC →</a>
    </div>
  </header>

  <div class="curriculum-layout">
    <nav class="curriculum-nav" aria-label="Quick Start steps">
      <strong>Counter progression</strong>
      ${quickStartSections.map(
        (section, index) => html`<a href="#${section.id}">
          <span>${String(index + 1).padStart(2, "0")}</span>${section.title}
        </a>`,
      )}
    </nav>

    <div class="curriculum-content">
      ${quickStartSections.map(
        (section, index) => html`<section
          id=${section.id}
          class="curriculum-step"
          aria-labelledby="${section.id}-title"
        >
          <header>
            <span class="index">STEP ${String(index + 1).padStart(2, "0")}</span>
            <h2 id="${section.id}-title">${section.title}</h2>
            <p>${section.summary}</p>
          </header>
          <div class="markdown-body">${renderGuideMarkdown(section.body)}</div>
          <div class="curriculum-files">
            ${section.files.map((sourceFile) =>
              renderFile(sourceFile, previousFile(quickStartSections, index, sourceFile.name)),
            )}
          </div>
          ${
            section.demo === undefined
              ? null
              : demoHost(section.demo, `${section.title} Counter preview`)
          }
        </section>`,
      )}

      <aside class="curriculum-next">
        <span class="index">NEXT / APPLICATION</span>
        <h2>Build TodoMVC one boundary at a time</h2>
        <p>
          Apply the same ownership model to domain rules, use cases, UI, routing, and persistence.
        </p>
        <a class="button-link" href=${siteHref("/explore/tutorial")}>Start the tutorial</a>
      </aside>
    </div>
  </div>
</main>`;

export const TutorialIndex = html`<main
  id="main-content"
  class="page curriculum-page tutorial-index-page"
  tabindex="-1"
>
  <header class="curriculum-hero">
    <span class="index">TUTORIAL / TODOMVC</span>
    <h1>Build TodoMVC one boundary at a time</h1>
    <p>
      Grow a working application from pure domain rules to reactive use cases, keyed UI, routing,
      persistence, and one explicit composition root.
    </p>
    <div class="curriculum-hero__actions">
      <a class="button-link" href=${siteHref(`/explore/tutorial/${tutorialSteps[0]!.slug}`)}
        >Begin with the domain</a
      >
      <a href=${siteHref("/explore/quick-start")}>Need the Counter first? →</a>
    </div>
  </header>

  <section class="tutorial-map" aria-labelledby="tutorial-map-title">
    <header>
      <span class="index">10 WORKING MILESTONES</span>
      <h2 id="tutorial-map-title">The application grows outward</h2>
      <p>
        Each step keeps earlier boundaries intact and adds one responsibility at the edge. The first
        three milestones stay deliberately non-visual; runnable previews begin with presentation.
      </p>
    </header>
    <ol>
      ${tutorialSteps.map(
        (step, index) => html`<li>
          <a href=${siteHref(`/explore/tutorial/${step.slug}`)}>
            <span class="tutorial-map__number">${String(index + 1).padStart(2, "0")}</span>
            <span><strong>${step.title}</strong><small>${step.summary}</small></span>
            <span aria-hidden="true">→</span>
          </a>
        </li>`,
      )}
    </ol>
  </section>

  <section class="architecture-intro" aria-labelledby="architecture-title">
    <span class="index">CLEAN ARCHITECTURE / CONCRETE DEPENDENCIES</span>
    <h2 id="architecture-title">Policy points inward. Composition stays at the edge.</h2>
    <pre aria-label="TodoMVC dependency direction"><code>main → presentation → application → domain
  └──→ infrastructure ────────↗</code></pre>
    <p>
      Clean architecture here means replaceable boundaries and visible dependency direction—not zero
      library imports. The domain deliberately uses Effect Schema as its data contract.
    </p>
    <p>
      The completed tutorial stays aligned with the
      <a href="https://github.com/TylorS/typed-smol/tree/main/examples/todomvc"
        >TodoMVC example source</a
      >.
    </p>
  </section>
</main>`;

const architectureLabels: Readonly<Record<TutorialStep["architecture"][number], string>> = {
  domain: "Domain",
  application: "Application",
  presentation: "Presentation",
  infrastructure: "Infrastructure",
  main: "Composition root",
};

export const TutorialStepPage = (step: TutorialStep) => {
  const index = tutorialSteps.indexOf(step);
  const previous = tutorialSteps[index - 1];
  const next = tutorialSteps[index + 1];

  return html`<main id="main-content" class="page curriculum-page tutorial-step-page" tabindex="-1">
    <header class="curriculum-hero curriculum-hero--step">
      <a class="back" href=${siteHref("/explore/tutorial")}>← Tutorial map</a>
      <span class="index"
        >TUTORIAL / ${String(index + 1).padStart(2, "0")} OF ${tutorialSteps.length}</span
      >
      <h1>${step.title}</h1>
      <p>${step.summary}</p>
      <div class="architecture-chips" aria-label="Architecture layers introduced">
        ${step.architecture.map((layer) => html`<span>${architectureLabels[layer]}</span>`)}
      </div>
    </header>

    <div class="tutorial-workbench">
      <article>
        <div class="markdown-body">${renderGuideMarkdown(step.body)}</div>
        <div class="curriculum-files">
          ${step.files.map((sourceFile) =>
            renderFile(sourceFile, previousFile(tutorialSteps, index, sourceFile.name)),
          )}
        </div>
      </article>
      <aside>
        ${step.demo === undefined ? null : demoHost(step.demo, `${step.title} TodoMVC preview`)}
        <div class="tutorial-boundary">
          <strong>Dependency checkpoint</strong>
          <p>${step.architecture.map((layer) => architectureLabels[layer]).join(" → ")}</p>
        </div>
      </aside>
    </div>

    <nav class="tutorial-pagination" aria-label="TodoMVC tutorial">
      ${
        previous === undefined
          ? html`<a href=${siteHref("/explore/tutorial")}>← Tutorial map</a>`
          : html`<a href=${siteHref(`/explore/tutorial/${previous.slug}`)}>← ${previous.title}</a>`
      }
      ${
        next === undefined
          ? html`<a href=${siteHref("/reference")}>Explore the API →</a>`
          : html`<a href=${siteHref(`/explore/tutorial/${next.slug}`)}>${next.title} →</a>`
      }
    </nav>
  </main>`;
};
