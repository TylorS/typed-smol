import { html } from "@typed/template";
import { extractTypeScriptFences, recipes, type RecipeDocumentation } from "../docs/Recipes.js";
import { headingId, renderGuideMarkdown } from "../docs/RenderMarkdown.js";
import { siteHref } from "../SiteHref.js";

export type RecipeMeta = {
  readonly audience: string;
};

const recipeMeta: Readonly<Record<string, RecipeMeta>> = {
  "dom-output": { audience: "DOM and renderer authors" },
  "html-output": { audience: "SSR and renderer authors" },
  react: { audience: "React adapter authors" },
  svelte: { audience: "Svelte adapter authors" },
  vue: { audience: "Vue adapter authors" },
  "web-component": { audience: "Web Component authors" },
};

export const metaFor = (recipe: RecipeDocumentation): RecipeMeta =>
  recipeMeta[recipe.slug] ?? { audience: "Adapter authors" };

const exampleCount = (recipe: RecipeDocumentation): number =>
  extractTypeScriptFences(recipe.body).length;

export const recipeCard = (recipe: RecipeDocumentation, index: number) => html`
  <article class="recipe-card" aria-labelledby="${recipe.slug}-card-title">
    <div class="recipe-card__topline">
      <span class="index">0${index + 1}</span>
      <span class="recipe-card__context">${metaFor(recipe).audience}</span>
    </div>
    <h3 id="${recipe.slug}-card-title">
      <a href=${siteHref(`/integrate/${recipe.slug}`)}>${recipe.title}</a>
    </h3>
    <p>${recipe.summary}</p>
    <a class="recipe-card__link" href=${siteHref(`/integrate/${recipe.slug}`)}
      >Read recipe <span aria-hidden="true">→</span></a
    >
  </article>
`;

export const RecipePage = (slug: string) => {
  const recipe = recipes.find((candidate) => candidate.slug === slug);
  if (recipe === undefined) {
    return html`
      <main id="main-content" class="page recipe-page recipe-page--missing" tabindex="-1">
        <a class="back" href=${siteHref("/integrate")}>← Integration directory</a>
        <h1>Recipe not found</h1>
        <p><a href=${siteHref("/integrate")}>Return to the integration recipes.</a></p>
      </main>
    `;
  }

  return html`
    <main id="main-content" class="page recipe-page" tabindex="-1">
      <a class="back" href=${siteHref("/integrate")}>← Integration directory</a>
      <header class="recipe-page-intro">
        <span class="index">INTEGRATE / ${metaFor(recipe).audience}</span>
        <h1>${recipe.title}</h1>
        <p>${recipe.summary}</p>
      </header>

      <div class="recipe-page-layout">
        <nav class="local-nav recipe-toc" aria-label="Sections in ${recipe.title}">
          <strong>In this recipe</strong>
          ${recipe.headings.map(
            (heading) => html`<a href="#${headingId(heading, recipe.slug)}">${heading}</a>`,
          )}
        </nav>
        <article class="markdown-body prose recipe-content" aria-label=${recipe.title}>
          ${renderGuideMarkdown(recipe.body, recipe.slug)}
        </article>
      </div>

      <nav class="recipe-page-next" aria-label="More integration recipes">
        <a href=${siteHref("/integrate")}>All integration recipes →</a>
      </nav>
    </main>
  `;
};
