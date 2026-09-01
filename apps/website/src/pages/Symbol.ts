import { HtmlRenderEvent, html } from "@typed/template";
import type { SymbolDocumentation } from "../docs/Model.js";
import { referenceSlug } from "../docs/Reference.js";
import { headingId, renderGuideMarkdown } from "../docs/RenderMarkdown.js";
import { highlightCode } from "../docs/SyntaxHighlight.js";
import { siteHref } from "../SiteHref.js";

const renderExample = (language: string, code: string) => {
  const normalized = code.trim();
  const markdown = /^(```|~~~)/u.test(normalized)
    ? normalized
    : `\`\`\`${language}\n${normalized}\n\`\`\``;
  return renderGuideMarkdown(markdown);
};

const renderSignature = (signature: string) =>
  HtmlRenderEvent(highlightCode("ts", signature), true);

const moduleHref = (symbol: SymbolDocumentation) =>
  siteHref(`/reference/modules/${encodeURIComponent(
    symbol.moduleName === "." ? symbol.packageName : `${symbol.packageName}/${symbol.moduleName}`,
  )}`);

const moduleLabel = (symbol: SymbolDocumentation) =>
  symbol.moduleName === "." ? "entry point" : symbol.moduleName;

const Breadcrumb = (symbol: SymbolDocumentation) => html`
  <nav class="reference-breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li><a href=${siteHref("/reference")}>Reference</a></li>
      <li>
        <a href=${siteHref(`/reference/packages/${encodeURIComponent(symbol.packageName)}`)}
          >${symbol.packageName}</a
        >
      </li>
      <li>
        <a href=${moduleHref(symbol)}><code>${moduleLabel(symbol)}</code></a>
      </li>
      <li><span aria-current="page">${symbol.exportName}</span></li>
    </ol>
  </nav>
`;

export const SymbolPage = (symbol: SymbolDocumentation) => {
  const glossaryRelations = symbol.relations.filter(({ kind }) => kind === "glossary");
  const sectionHeadings = Object.keys(symbol.sections);

  return html`
    <main
      id="main-content"
      class="page symbol-page reference-page"
      tabindex="-1"
      data-symbol-id=${symbol.id}
    >
      ${Breadcrumb(symbol)}

      <header class="symbol-intro symbol-overview">
        <div class="symbol-overview__identity">
          <span class="index">${symbol.packageName} / ${moduleLabel(symbol)}</span>
          <span class="symbol-overview__kind">${symbol.kind}</span>
        </div>
        <h1><code>${symbol.exportName}</code></h1>
        <div class="symbol-summary markdown-body">${renderGuideMarkdown(symbol.summary)}</div>

        <dl class="symbol-facts" aria-label="${symbol.exportName} metadata">
          <div>
            <dt>Kind</dt>
            <dd>${symbol.kind}</dd>
          </div>
          ${
            symbol.category === undefined
              ? null
              : html`<div>
                  <dt>Category</dt>
                  <dd>${symbol.category}</dd>
                </div>`
          }
          ${
            symbol.since === undefined
              ? null
              : html`<div>
                  <dt>Since</dt>
                  <dd>${symbol.since}</dd>
                </div>`
          }
          <div>
            <dt>Module</dt>
            <dd>
              <a href=${moduleHref(symbol)}><code>${moduleLabel(symbol)}</code></a>
            </dd>
          </div>
        </dl>

        ${
          glossaryRelations.length === 0
            ? null
            : html`
                <div class="symbol-relations" aria-label="Related glossary terms">
                  <span>Related</span>
                  ${glossaryRelations.map(
                    ({ target }) => html`<a href=${siteHref(`/glossary#${target}`)}>${target}</a>`,
                  )}
                </div>
              `
        }
      </header>

      <div class="symbol-layout">
        <nav class="local-nav symbol-navigation" aria-label="On this page">
          <strong>On this page</strong>
          <a href="#signatures">Signatures</a>
          ${sectionHeadings.map((heading) => html`<a href="#${headingId(heading)}">${heading}</a>`)}
          ${symbol.examples.length === 0 ? null : html`<a href="#examples">Examples</a>`}
          <a href="#source">Source record</a>
        </nav>

        <article class="reading-width guide-article symbol-article">
          <section id="signatures" class="reference-signature" aria-labelledby="signatures-title">
            <header class="reference-signature__header">
              <div>
                <span class="index">TYPESCRIPT</span>
                <h2 id="signatures-title">Signatures</h2>
              </div>
              <span
                >${symbol.signatures.length === 1 ? "1 declaration" : `${symbol.signatures.length} declarations`}</span
              >
            </header>
            <div class="reference-signature__list">
              ${symbol.signatures.map(
                (signature) => html`
                  <pre
                    class="reference-signature__block"
                  ><code class="reference-signature__code language-typescript">${renderSignature(signature)}</code></pre>
                `,
              )}
            </div>
          </section>

          <div class="symbol-section-list">
            ${Object.entries(symbol.sections).map(
              ([heading, body]) => html`
                <section
                  id=${headingId(heading)}
                  class="symbol-section"
                  aria-labelledby="${headingId(heading)}-title"
                >
                  <header><h2 id="${headingId(heading)}-title">${heading}</h2></header>
                  <div class="markdown-body">${renderGuideMarkdown(body)}</div>
                </section>
              `,
            )}
          </div>

          ${
            symbol.examples.length === 0
              ? null
              : html`
                  <section id="examples" class="symbol-examples" aria-labelledby="examples-title">
                    <header>
                      <span class="index">USAGE</span>
                      <h2 id="examples-title">Examples</h2>
                    </header>
                    <div class="symbol-example-list">
                      ${symbol.examples.map(
                        (example) => html`
                          <div class="symbol-example" data-language=${example.language}>
                            ${renderExample(example.language, example.code)}
                          </div>
                        `,
                      )}
                    </div>
                  </section>
                `
          }

          <section id="source" class="source-provenance" aria-labelledby="source-title">
            <span class="index">SOURCE</span>
            <h2 id="source-title">Reference record</h2>
            <dl>
              <div>
                <dt>Declared at</dt>
                <dd><code>${symbol.source.file}:${symbol.source.line}</code></dd>
              </div>
              <div>
                <dt>Machine-readable</dt>
                <dd>
                  <a href=${siteHref(`/docs/reference/exposures/${referenceSlug(symbol.id)}.json`)}
                    >Open JSON record</a
                  >
                </dd>
              </div>
            </dl>
          </section>
        </article>
      </div>
    </main>
  `;
};
