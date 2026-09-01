import { html } from "@typed/template";
import { glossaryEntries } from "../docs/Content.js";
import { renderGuideMarkdown } from "../docs/RenderMarkdown.js";

export const Glossary = html`
  <main id="main-content" class="page" tabindex="-1">
    <header class="page-head">
      <span class="index">REFERENCE / LANGUAGE</span>
      <h1>Glossary</h1>
      <p>Canonical terms, aliases, exact meanings, and the concepts they compose with.</p>
    </header>

    <nav class="alphabet" aria-label="Glossary alphabet">A · C · D · E · F · H · K · R · S · W</nav>

    <dl class="glossary">
      ${glossaryEntries.map(
        (entry) => html`
          <div id=${entry.id}>
            <dt>${entry.term}</dt>
            <dd>
              <p>${entry.definition}</p>
              <div class="glossary-details">${renderGuideMarkdown(entry.details)}</div>
              ${
                entry.aliases.length > 0
                  ? html`<small>Also: ${entry.aliases.join(", ")}</small>`
                  : ""
              }
              <nav aria-label="Related to ${entry.term}">
                ${entry.related.map((id) => {
                  const related = glossaryEntries.find((candidate) => candidate.id === id);
                  return html`<a href="#${id}">${related?.term ?? id}</a>`;
                })}
                ${entry.links.map((link) => html`<a href=${link} rel="external">Effect docs ↗</a>`)}
              </nav>
            </dd>
          </div>
        `,
      )}
    </dl>
  </main>
`;
